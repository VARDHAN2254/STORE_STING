from decimal import Decimal
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.models import Order, OrderItem, Inventory, Product


class InventoryAgent:
    """Verifies warehouse availability with row locks, reserves stock, and calculates stock confidence."""

    async def process(self, session: AsyncSession, order: Order, scenario: str = "SUCCESS") -> Dict[str, Any]:
        result = await session.execute(
            select(OrderItem).where(OrderItem.order_id == order.id)
        )
        items = result.scalars().all()

        inventory_reservations = []
        overall_confidence = Decimal("0.96")

        for item in items:
            # Query inventory with row lock (FOR UPDATE)
            inv_query = (
                select(Inventory)
                .where(Inventory.product_id == item.product_id)
                .with_for_update()
            )
            inv_result = await session.execute(inv_query)
            inventory = inv_result.scalars().first()

            if not inventory:
                raise ValueError(f"Inventory record missing for product ID {item.product_id}")

            # Check stock
            if scenario == "LOW_STOCK" or inventory.available_units < item.quantity:
                if inventory.available_units < item.quantity:
                    raise ValueError(
                        f"Insufficient stock for {item.product_name}. Available: {inventory.available_units}, Requested: {item.quantity}"
                    )
                # Scenario low stock: lower confidence but permit reservation if units available
                overall_confidence = Decimal("0.62")

            # Reserve units atomically
            inventory.reserved_units += item.quantity
            inventory.available_units = inventory.stock_units - inventory.reserved_units

            # Update product stock status if low
            prod_result = await session.execute(select(Product).where(Product.id == item.product_id))
            prod = prod_result.scalars().first()
            if prod:
                if inventory.available_units <= 5:
                    prod.stock_status = "Low Stock"
                elif inventory.available_units == 0:
                    prod.stock_status = "Out of Stock"

            inventory_reservations.append({
                "product_id": item.product_id,
                "sku": item.sku,
                "warehouse": inventory.warehouse,
                "quantity_reserved": item.quantity,
                "remaining_available": inventory.available_units,
            })

        return {
            "status": "VERIFIED",
            "stock_confidence": float(overall_confidence),
            "reservations": inventory_reservations,
            "warehouse_assigned": "Main Bengaluru Hub",
        }
