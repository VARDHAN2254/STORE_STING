import asyncio
import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from app.orchestration.orchestrator import register_subscriber, unregister_subscriber

router = APIRouter(prefix="/orders", tags=["stream"])


@router.get("/{order_id}/stream")
async def stream_order_events(order_id: str, request: Request):
    queue: asyncio.Queue = asyncio.Queue()
    register_subscriber(order_id, queue)

    async def event_generator():
        try:
            # Yield initial connection heartbeat
            yield f"data: {json.dumps({'type': 'connected', 'order_id': order_id})}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {json.dumps(data)}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat
                    yield ": heartbeat\n\n"
        finally:
            unregister_subscriber(order_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
