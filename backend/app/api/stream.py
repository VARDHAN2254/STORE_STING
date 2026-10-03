import asyncio
import json
from typing import Optional
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.database.models import Order, User
from app.core.security import decode_access_token
from app.orchestration.orchestrator import register_subscriber, unregister_subscriber

router = APIRouter(prefix="/orders", tags=["stream"])


@router.get("/{order_id}/stream")
async def stream_order_events(
    order_id: str,
    request: Request,
    token: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    # 1. Authorize order telemetry stream
    result = await db.execute(
        select(Order).where((Order.id == order_id) | (Order.order_number == order_id))
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    # If the order is bound to a registered customer account, enforce identity verification
    if order.user_id:
        # Extract JWT token from Authorization header or URL query parameter
        auth_header = request.headers.get("authorization")
        jwt_token = token
        if auth_header and auth_header.startswith("Bearer "):
            jwt_token = auth_header.replace("Bearer ", "").strip()

        user = None
        if jwt_token:
            payload = decode_access_token(jwt_token)
            if payload and "sub" in payload:
                u_res = await db.execute(select(User).where(User.id == payload["sub"]))
                user = u_res.scalars().first()

        if not user or (user.id != order.user_id and user.role != "admin"):
            raise HTTPException(
                status_code=403,
                detail="Access denied: unauthorized to stream telemetry for this order."
            )

    queue: asyncio.Queue = asyncio.Queue()
    register_subscriber(order.id, queue)

    async def event_generator():
        try:
            # Yield initial connection heartbeat with verified order identifier
            yield f"data: {json.dumps({'type': 'connected', 'order_id': order.id, 'order_number': order.order_number})}\n\n"
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
            unregister_subscriber(order.id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
