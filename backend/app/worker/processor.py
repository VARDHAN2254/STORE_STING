import asyncio
import os
import signal
import structlog
from datetime import datetime, timezone
from sqlalchemy import select, update
from app.database.session import async_session_factory
from app.database.models import Job
from app.orchestration.orchestrator import OrderOrchestrator

logger = structlog.get_logger("worker")


class JobWorker:
    def __init__(self, worker_id: str = None):
        self.worker_id = worker_id or f"worker-{os.getpid()}"
        self.orchestrator = OrderOrchestrator()
        self.is_running = True

    async def claim_next_job(self, job_type: str | None = None) -> Job | None:
        async with async_session_factory() as session:
            # PostgreSQL FOR UPDATE SKIP LOCKED
            stmt = select(Job).where(Job.status == "PENDING")
            if job_type:
                stmt = stmt.where(Job.job_type == job_type)
            stmt = stmt.order_by(Job.created_at.asc()).limit(1).with_for_update(skip_locked=True)
            result = await session.execute(stmt)
            job = result.scalars().first()

            if job:
                job.status = "PROCESSING"
                job.locked_at = datetime.now(timezone.utc)
                job.locked_by = self.worker_id
                job.attempts += 1
                await session.commit()
                return job
            return None

    async def process_job(self, job: Job):
        logger.info("Processing job", job_id=job.id, job_type=job.job_type)
        async with async_session_factory() as session:
            try:
                if job.job_type in {"process_order", "test_process_order"}:
                    order_id = job.payload.get("order_id")
                    scenario = job.payload.get("scenario", "SUCCESS")
                    seed = job.payload.get("seed", 42)

                    run = await self.orchestrator.run_pipeline(
                        session=session,
                        order_id=order_id,
                        seed=seed,
                        scenario=scenario,
                    )

                    # Update job completion
                    await session.execute(
                        update(Job)
                        .where(Job.id == job.id)
                        .values(
                            status="COMPLETED" if run.status == "COMPLETED" else "FAILED",
                            error_message=None if run.status == "COMPLETED" else "Order pipeline run finished with non-complete status",
                        )
                    )
                    await session.commit()
                    logger.info("Job finished", job_id=job.id, status=run.status)

                else:
                    logger.warn("Unknown job type", job_type=job.job_type)
                    await session.execute(
                        update(Job)
                        .where(Job.id == job.id)
                        .values(status="COMPLETED")
                    )
                    await session.commit()

            except Exception as e:
                logger.error("Job execution error", job_id=job.id, error=str(e))
                await session.rollback()
                await session.execute(
                    update(Job)
                    .where(Job.id == job.id)
                    .values(
                        status="FAILED" if job.attempts >= job.max_attempts else "PENDING",
                        error_message=str(e),
                    )
                )
                await session.commit()

    async def run(self):
        logger.info("Starting STORE STING PostgreSQL Commerce Worker", worker_id=self.worker_id)
        while self.is_running:
            try:
                job = await self.claim_next_job(job_type="process_order")
                if job:
                    await self.process_job(job)
                else:
                    await asyncio.sleep(1.0)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Worker loop exception", error=str(e))
                await asyncio.sleep(2.0)
        logger.info("Worker stopped gracefully.")
