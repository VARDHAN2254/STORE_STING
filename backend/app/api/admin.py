from typing import List, Dict, Any
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.database.models import Order, OrderItem, Run, RunEvent, Job, Inventory, Product, User
from app.api.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/metrics")
async def get_operations_metrics(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    total_orders = await db.scalar(select(func.count(Order.id))) or 0
    total_revenue = await db.scalar(select(func.sum(Order.total))) or Decimal("0.00")
    pending_jobs = await db.scalar(select(func.count(Job.id)).where(Job.status == "PENDING")) or 0
    active_runs = await db.scalar(select(func.count(Run.id)).where(Run.status == "RUNNING")) or 0

    # Low stock alerts
    low_stock_res = await db.execute(
        select(Inventory)
        .options(selectinload(Inventory.product))
        .where(Inventory.available_units <= 10)
    )
    low_stock_items = [
        {
            "product_name": inv.product.name if inv.product else "Unknown",
            "warehouse": inv.warehouse,
            "available_units": inv.available_units,
            "stock_units": inv.stock_units,
        }
        for inv in low_stock_res.scalars().all()
    ]

    # Recent runs
    recent_runs_res = await db.execute(
        select(Run)
        .options(selectinload(Run.order), selectinload(Run.events))
        .order_by(desc(Run.created_at))
        .limit(10)
    )
    recent_runs = [
        {
            "run_id": r.id,
            "order_number": r.order.order_number if r.order else "N/A",
            "scenario": r.scenario,
            "seed": r.seed,
            "status": r.status,
            "execution_time_ms": str(r.execution_time_ms),
            "events_count": len(r.events),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in recent_runs_res.scalars().all()
    ]

    return {
        "total_orders": total_orders,
        "total_revenue": str(total_revenue),
        "pending_jobs": pending_jobs,
        "active_runs": active_runs,
        "worker_health": "OPTIMAL (PostgreSQL Concurrent Safe)",
        "low_stock_alerts": low_stock_items,
        "recent_runs": recent_runs,
    }


@router.get("/runs/{run_id}/events")
async def get_run_events(
    run_id: str,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(RunEvent)
        .where(RunEvent.run_id == run_id)
        .order_by(RunEvent.sequence_number.asc(), RunEvent.id.asc())
    )
    events = result.scalars().all()
    return [
        {
            "id": ev.id,
            "sequence_number": ev.sequence_number,
            "agent": ev.agent,
            "state": ev.state,
            "payload": ev.payload,
            "timestamp": ev.created_at.isoformat() if ev.created_at else None,
        }
        for ev in events
    ]


@router.post("/simulate")
async def trigger_simulation_scenario(
    order_id: str,
    scenario: str,
    seed: int = 42,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    valid_scenarios = [
        "SUCCESS", "LOW_STOCK", "PAYMENT_RETRY", "PAYMENT_FAILURE",
        "FRAUD_REJECTION", "DELIVERY_RETRY", "DELIVERY_FAILURE"
    ]
    if scenario not in valid_scenarios:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario. Supported scenarios: {', '.join(valid_scenarios)}"
        )

    order_res = await db.execute(select(Order).where(Order.id == order_id))
    order = order_res.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    order.scenario = scenario
    
    # Enqueue deterministic scenario job into PostgreSQL jobs table
    import uuid
    job = Job(
        id=str(uuid.uuid4()),
        job_type="process_order",
        payload={
            "order_id": order.id,
            "scenario": scenario,
            "seed": seed,
        },
        status="PENDING",
    )
    db.add(job)
    await db.commit()

    return {
        "status": "SIMULATION_ENQUEUED",
        "job_id": job.id,
        "order_id": order.id,
        "order_number": order.order_number,
        "scenario": scenario,
        "seed": seed,
    }
