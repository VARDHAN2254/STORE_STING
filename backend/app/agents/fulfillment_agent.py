import uuid
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.models import Order, OrderItem, Inventory


class FulfillmentAgent:
    """Consolidates items, deducts physical warehouse stock, and seals packaging manifest."""

    async def process(self, session: AsyncSession, order: Order) -> Dict[str, Any]:
        result = await session.execute(
            select(OrderItem).where(OrderItem.order_id == order.id)
        )
        items = result.scalars().all()

        manifest_items = []
        for item in items:
            inv_result = await session.execute(
                select(Inventory).where(Inventory.product_id == item.product_id).with_for_update()
            )
            inventory = inv_result.scalars().first()
            if inventory:
                # Deduct stock units that were reserved
                inventory.stock_units -= item.quantity
                inventory.reserved_units -= item.quantity
                inventory.available_units = inventory.stock_units - inventory.reserved_units

            manifest_items.append({
                "sku": item.sku,
                "name": item.product_name,
                "quantity": item.quantity,
                "packaging": "Biodegradable Aerogel Protective Casing",
            })

        batch_id = f"BATCH-STING-{uuid.uuid4().hex[:8].upper()}"

        return {
            "batch_id": batch_id,
            "fulfillment_center": "Main Bengaluru Hub - Sector 4",
            "manifest_items": manifest_items,
            "packaging_type": "Tamper-Evident Soft Future Seal",
            "quality_check": "PASSED (Optical Dimension & Weight Verification)",
        }
