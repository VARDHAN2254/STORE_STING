import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.models import Order, Shipment


class DeliveryAgent:
    """Assigns carrier, calculates dynamic delivery SLAs, and tracks logistics stages."""

    async def process(
        self,
        session: AsyncSession,
        order: Order,
        attempt: int = 1,
        scenario: str = "SUCCESS",
        seed: int = 42
    ) -> Tuple[bool, Dict[str, Any]]:
        # Select carrier
        carriers = ["FedEx FutureLink", "UPS HyperFlight", "HyperLoop Drone Express"]
        carrier = carriers[seed % len(carriers)]

        if scenario == "DELIVERY_FAILURE":
            passed = False
            failure_reason = "Logistics node unreachable: severe regional weather vortex."
            est_days = 5
        elif scenario == "DELIVERY_RETRY":
            if attempt == 1:
                passed = False
                failure_reason = "Autonomous drone route obstruction; rerouting transit."
                est_days = 3
            else:
                passed = True
                failure_reason = None
                est_days = 2
        else:
            passed = True
            failure_reason = None
            est_days = 1 if "Drone" in carrier else 2

        tracking_number = f"TRK-STING-2050-{uuid.uuid4().hex[:8].upper()}"
        order.shipping_partner = carrier
        order.estimated_delivery_days = est_days
        order.tracking_number = tracking_number

        now = datetime.now(timezone.utc)
        estimated_delivery = now + timedelta(days=est_days)

        ship_result = await session.execute(select(Shipment).where(Shipment.order_id == order.id))
        shipment = ship_result.scalars().first()

        if not shipment:
            shipment = Shipment(
                id=str(uuid.uuid4()),
                order_id=order.id,
                tracking_number=tracking_number,
                carrier=carrier,
                status="IN_TRANSIT" if passed else "EXCEPTION",
                estimated_delivery=estimated_delivery,
                dispatched_at=now,
                delivered_at=now + timedelta(seconds=1) if passed and scenario == "SUCCESS" else None,
            )
            session.add(shipment)
        else:
            shipment.status = "IN_TRANSIT" if passed else "EXCEPTION"
            shipment.carrier = carrier
            shipment.tracking_number = tracking_number

        return passed, {
            "tracking_number": tracking_number,
            "carrier": carrier,
            "estimated_delivery_days": est_days,
            "estimated_delivery_date": estimated_delivery.isoformat(),
            "status": "DISPATCHED" if passed else "FAILED",
            "failure_reason": failure_reason,
            "attempt": attempt,
        }
