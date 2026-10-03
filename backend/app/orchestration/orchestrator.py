import asyncio
import time
import uuid
from decimal import Decimal
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.models import Order, Run, RunEvent, Notification, Inventory, OrderItem
from app.orchestration.state_machine import OrderState, can_transition
from app.agents.order_agent import OrderAgent
from app.agents.inventory_agent import InventoryAgent
from app.agents.payment_agent import PaymentAgent
from app.agents.fulfillment_agent import FulfillmentAgent
from app.agents.delivery_agent import DeliveryAgent

# In-memory pub/sub registry for SSE streams
order_event_subscribers: Dict[str, list[asyncio.Queue]] = {}


def register_subscriber(order_id: str, queue: asyncio.Queue):
    if order_id not in order_event_subscribers:
        order_event_subscribers[order_id] = []
    order_event_subscribers[order_id].append(queue)


def unregister_subscriber(order_id: str, queue: asyncio.Queue):
    if order_id in order_event_subscribers:
        if queue in order_event_subscribers[order_id]:
            order_event_subscribers[order_id].remove(queue)
        if not order_event_subscribers[order_id]:
            del order_event_subscribers[order_id]


async def broadcast_order_event(order_id: str, event_data: Dict[str, Any]):
    if order_id in order_event_subscribers:
        for queue in list(order_event_subscribers[order_id]):
            try:
                await queue.put(event_data)
            except Exception:
                pass


class OrderOrchestrator:
    def __init__(self):
        self.order_agent = OrderAgent()
        self.inventory_agent = InventoryAgent()
        self.payment_agent = PaymentAgent()
        self.fulfillment_agent = FulfillmentAgent()
        self.delivery_agent = DeliveryAgent()

    async def _log_event(
        self,
        session: AsyncSession,
        run: Run,
        order: Order,
        agent_name: str,
        state: OrderState,
        payload: Dict[str, Any]
    ):
        event = RunEvent(
            run_id=run.id,
            order_id=order.id,
            agent=agent_name,
            state=state.value,
            payload=payload,
        )
        session.add(event)
        await session.flush()

        # Broadcast over SSE queue
        broadcast_data = {
            "order_id": order.id,
            "order_number": order.order_number,
            "state": state.value,
            "agent": agent_name,
            "payload": payload,
            "timestamp": time.time(),
        }
        await broadcast_order_event(order.id, broadcast_data)

    async def _add_notification(
        self,
        session: AsyncSession,
        order: Order,
        title: str,
        message: str,
        category: str = "order"
    ):
        if order.user_id:
            notif = Notification(
                id=str(uuid.uuid4()),
                user_id=order.user_id,
                title=title,
                message=message,
                category=category,
                link=f"/orders/{order.id}",
            )
            session.add(notif)

    async def run_pipeline(
        self,
        session: AsyncSession,
        order_id: str,
        seed: int = 42,
        scenario: Optional[str] = None
    ) -> Run:
        start_time = time.time()

        # Load order
        order_res = await session.execute(select(Order).where(Order.id == order_id))
        order = order_res.scalars().first()
        if not order:
            raise ValueError(f"Order {order_id} not found.")

        scenario = scenario or order.scenario or "SUCCESS"

        # Initialize Run record
        run = Run(
            id=str(uuid.uuid4()),
            order_id=order.id,
            seed=seed,
            scenario=scenario,
            status="RUNNING",
        )
        session.add(run)
        await session.flush()

        try:
            # 1. ORDER_PLACED (OrderAgent)
            order.status = OrderState.ORDER_PLACED.value
            order_payload = await self.order_agent.process(session, order)
            await self._log_event(session, run, order, "OrderAgent", OrderState.ORDER_PLACED, order_payload)
            await self._add_notification(
                session, order,
                f"Order Confirmed #{order.order_number}",
                f"Your order of {order_payload['items_count']} item(s) totaling ₹{order.total} has been confirmed.",
            )
            await session.commit()
            await asyncio.sleep(0.3)

            # 2. INVENTORY_VERIFIED (InventoryAgent)
            order.status = OrderState.INVENTORY_VERIFIED.value
            inv_payload = await self.inventory_agent.process(session, order, scenario=scenario)
            await self._log_event(session, run, order, "InventoryAgent", OrderState.INVENTORY_VERIFIED, inv_payload)
            await session.commit()
            await asyncio.sleep(0.3)

            # 3. PAYMENT (PaymentAgent with retry support)
            order.status = OrderState.PAYMENT_PENDING.value
            await self._log_event(session, run, order, "PaymentAgent", OrderState.PAYMENT_PENDING, {"status": "Awaiting authorization"})

            max_payment_retries = 2
            pay_attempt = 1
            pay_authorized = False
            last_pay_payload = {}

            while pay_attempt <= max_payment_retries and not pay_authorized:
                pay_authorized, last_pay_payload = await self.payment_agent.process(
                    session, order, attempt=pay_attempt, scenario=scenario, seed=seed
                )
                if not pay_authorized:
                    if pay_attempt < max_payment_retries and scenario == "PAYMENT_RETRY":
                        pay_attempt += 1
                        await asyncio.sleep(0.4)
                    else:
                        break
                else:
                    break

            if not pay_authorized:
                order.status = OrderState.FAILED.value
                run.status = "FAILED"
                await self._log_event(
                    session, run, order, "PaymentAgent", OrderState.FAILED,
                    {"error": "Payment declined or high fraud risk", **last_pay_payload}
                )
                await self._release_reserved_inventory(session, order)
                await session.commit()
                return run

            order.status = OrderState.PAYMENT_AUTHORIZED.value
            await self._log_event(session, run, order, "PaymentAgent", OrderState.PAYMENT_AUTHORIZED, last_pay_payload)
            await self._add_notification(
                session, order,
                "Payment Authorized",
                f"Payment of ₹{order.total} was securely authorized via {order.payment_method}.",
            )
            await session.commit()
            await asyncio.sleep(0.3)

            # 4. PACKED (FulfillmentAgent)
            order.status = OrderState.PACKED.value
            pack_payload = await self.fulfillment_agent.process(session, order)
            await self._log_event(session, run, order, "FulfillmentAgent", OrderState.PACKED, pack_payload)
            await session.commit()
            await asyncio.sleep(0.3)

            # 5. SHIPPED & OUT_FOR_DELIVERY (DeliveryAgent with retry support)
            order.status = OrderState.SHIPPED.value
            max_del_retries = 2
            del_attempt = 1
            del_passed = False
            last_del_payload = {}

            while del_attempt <= max_del_retries and not del_passed:
                del_passed, last_del_payload = await self.delivery_agent.process(
                    session, order, attempt=del_attempt, scenario=scenario, seed=seed
                )
                if not del_passed:
                    if del_attempt < max_del_retries and scenario == "DELIVERY_RETRY":
                        del_attempt += 1
                        await asyncio.sleep(0.4)
                    else:
                        break
                else:
                    break

            if not del_passed:
                order.status = OrderState.FAILED.value
                run.status = "FAILED"
                await self._log_event(
                    session, run, order, "DeliveryAgent", OrderState.FAILED,
                    {"error": "Logistics dispatch failed", **last_del_payload}
                )
                await session.commit()
                return run

            await self._log_event(session, run, order, "DeliveryAgent", OrderState.SHIPPED, last_del_payload)
            await self._add_notification(
                session, order,
                f"Order Shipped via {last_del_payload['carrier']}",
                f"Tracking number: {last_del_payload['tracking_number']}. Estimated in {last_del_payload['estimated_delivery_days']} days.",
            )
            await session.commit()
            await asyncio.sleep(0.3)

            # 6. OUT_FOR_DELIVERY
            order.status = OrderState.OUT_FOR_DELIVERY.value
            await self._log_event(
                session, run, order, "DeliveryAgent", OrderState.OUT_FOR_DELIVERY,
                {"status": "Courier out for final localized delivery", "carrier": last_del_payload["carrier"]}
            )
            await session.commit()
            await asyncio.sleep(0.3)

            # 7. DELIVERED
            order.status = OrderState.DELIVERED.value
            execution_time = (time.time() - start_time) * 1000
            run.status = "COMPLETED"
            run.execution_time_ms = Decimal(f"{execution_time:.2f}")

            await self._log_event(
                session, run, order, "System", OrderState.DELIVERED,
                {"status": "Successfully delivered to customer address", "execution_time_ms": float(execution_time)}
            )
            await self._add_notification(
                session, order,
                "Package Delivered!",
                f"Order #{order.order_number} has been delivered safely. Enjoy your Soft Future experience.",
            )
            await session.commit()
            return run

        except Exception as e:
            await session.rollback()
            order.status = OrderState.FAILED.value
            run.status = "FAILED"
            await self._log_event(session, run, order, "System", OrderState.FAILED, {"error": str(e)})
            await self._release_reserved_inventory(session, order)
            await session.commit()
            return run

    async def _release_reserved_inventory(self, session: AsyncSession, order: Order):
        try:
            items_res = await session.execute(select(OrderItem).where(OrderItem.order_id == order.id))
            items = items_res.scalars().all()
            for itm in items:
                inv_res = await session.execute(
                    select(Inventory).where(Inventory.product_id == itm.product_id).with_for_update()
                )
                inv = inv_res.scalars().first()
                if inv and inv.reserved_units >= itm.quantity:
                    inv.reserved_units -= itm.quantity
                    inv.available_units = inv.stock_units - inv.reserved_units
        except Exception:
            pass
