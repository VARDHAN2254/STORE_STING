import asyncio
from app.worker.processor import JobWorker


def main():
    worker = JobWorker()
    try:
        asyncio.run(worker.run())
    except KeyboardInterrupt:
        print("Worker interrupted by user.")


if __name__ == "__main__":
    main()
