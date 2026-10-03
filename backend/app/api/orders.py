import uuid
import random
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.database.session import get_db, async_session_factory
from app.database.models import Order, OrderItem, Product, Job, User, Run, RunEvent
from app.schemas.schemas import (
    OrderCreateRequest, OrderResponse,
    CheckoutEstimateRequest, CheckoutEstimateResponse, OrderItemResponse
)
from app.api.deps import get_current_user_optional, get_current_user
from app.orchestration.orchestrator import OrderOrchestrator

router = APIRouter(prefix="/orders", tags=["orders"])


async def run_order_in_background(order_id: str, scenario: str, seed: int):
    async with async_session_factory() as session:
        orchestrator = OrderOrchestrator()
        await orchestrator.run_pipeline(session, order_id, seed=seed, scenario=scenario)


@router.post("/estimate", response_model=CheckoutEstimateResponse)
async def estimate_checkout(payload: CheckoutEstimateRequest, db: AsyncSession = Depends(get_db)):
    subtotal = Decimal("0.00")
    for itm in payload.items:
        prod_res = await db.execute(select(Product).where(Product.id == itm.product_id))
        prod = prod_res.scalars().first()
        if prod:
            subtotal += prod.discounted_price * Decimal(itm.quantity)

    shipping = Decimal("0.00") if subtotal >= Decimal("20000.00") or subtotal == Decimal("0.00") else Decimal("499.00")
    discount = Decimal("0.00")
    tax = Decimal("0.00")
    total = subtotal - discount + shipping + tax

    return CheckoutEstimateResponse(
        subtotal=subtotal,
        discount=discount,
        shipping=shipping,
        tax=tax,
        total=total,
    )


@router.post("", response_model=OrderResponse)
async def create_order(
    payload: OrderCreateRequest,
    background_tasks: BackgroundTasks,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cannot place order with zero items.")

    # Authoritative price calculation
    subtotal = Decimal("0.00")
    validated_items = []

    for itm in payload.items:
        prod_res = await db.execute(select(Product).where(Product.id == itm.product_id))
        prod = prod_res.scalars().first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product {itm.product_id} not found.")

        item_total = prod.discounted_price * Decimal(itm.quantity)
        subtotal += item_total
        validated_items.append((prod, itm.quantity, prod.discounted_price, item_total))

    shipping = Decimal("0.00") if subtotal >= Decimal("20000.00") else Decimal("499.00")
    discount = Decimal("0.00")
    tax = Decimal("0.00")
    total = subtotal - discount + shipping + tax

    order_num = f"SS-{random.randint(10000, 99999)}"

    order = Order(
        id=str(uuid.uuid4()),
        order_number=order_num,
        user_id=user.id if user else None,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        shipping_address=payload.shipping_address,
        subtotal=subtotal,
        discount=discount,
        shipping=shipping,
        tax=tax,
        total=total,
        status="CREATED",
        payment_method=payload.payment_method,
        scenario=payload.scenario,
    )
    db.add(order)
    await db.flush()

    for prod, qty, unit_p, total_p in validated_items:
        order_item = OrderItem(
            id=str(uuid.uuid4()),
            order_id=order.id,
            product_id=prod.id,
            sku=prod.sku,
            product_name=prod.name,
            quantity=qty,
            unit_price=unit_p,
            total_price=total_p,
        )
        db.add(order_item)

    # Enqueue background job in PostgreSQL jobs table
    job = Job(
        id=str(uuid.uuid4()),
        job_type="process_order",
        payload={
            "order_id": order.id,
            "scenario": payload.scenario,
            "seed": random.randint(10, 999),
        },
        status="PENDING",
    )
    db.add(job)
    await db.commit()

    # Trigger async execution task
    background_tasks.add_task(run_order_in_background, order.id, payload.scenario, job.payload["seed"])

    refetched = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order.id)
    )
    saved_order = refetched.scalars().first()
    return OrderResponse.model_validate(saved_order)


@router.get("", response_model=List[OrderResponse])
async def list_orders(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == user.id)
        .order_by(desc(Order.created_at))
    )
    result = await db.execute(query)
    orders = result.scalars().all()
    return [OrderResponse.model_validate(o) for o in orders]


@router.get("/{id_or_number}")
async def get_order_detail(
    id_or_number: str,
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images),
            selectinload(Order.runs).selectinload(Run.events),
            selectinload(Order.shipments),
            selectinload(Order.payments),
        )
        .where((Order.id == id_or_number) | (Order.order_number == id_or_number))
    )
    result = await db.execute(query)
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    latest_run = order.runs[-1] if order.runs else None
    events_list = []
    if latest_run:
        for ev in latest_run.events:
            events_list.append({
                "agent": ev.agent,
                "state": ev.state,
                "payload": ev.payload,
                "timestamp": ev.created_at.isoformat() if ev.created_at else None,
            })

    shipment_info = order.shipments[0] if order.shipments else None

    return {
        "order": OrderResponse.model_validate(order),
        "items": [
            {
                "id": itm.id,
                "product_id": itm.product_id,
                "name": itm.product_name,
                "sku": itm.sku,
                "quantity": itm.quantity,
                "unit_price": str(itm.unit_price),
                "total_price": str(itm.total_price),
                "image": itm.product.images[0].url if itm.product and itm.product.images else None,
            }
            for itm in order.items
        ],
        "events": events_list,
        "shipment": {
            "tracking_number": shipment_info.tracking_number if shipment_info else order.tracking_number,
            "carrier": shipment_info.carrier if shipment_info else order.shipping_partner,
            "status": shipment_info.status if shipment_info else "PENDING",
            "estimated_delivery": shipment_info.estimated_delivery.isoformat() if shipment_info and shipment_info.estimated_delivery else None,
        } if shipment_info else None,
    }
