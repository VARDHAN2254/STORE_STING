from decimal import Decimal
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.models import Order, OrderItem, Product


class OrderAgent:
    """Validates order items, ensures catalog price fidelity, and computes authoritative totals."""

    async def process(self, session: AsyncSession, order: Order) -> Dict[str, Any]:
        result = await session.execute(
            select(OrderItem).where(OrderItem.order_id == order.id)
        )
        items = result.scalars().all()

        computed_subtotal = Decimal("0.00")
        validated_items = []

        for item in items:
            prod_result = await session.execute(select(Product).where(Product.id == item.product_id))
            prod = prod_result.scalars().first()
            if not prod:
                raise ValueError(f"Product ID {item.product_id} no longer exists in catalog.")

            # Authoritative pricing from catalog
            authoritative_unit_price = prod.discounted_price
            item_total = authoritative_unit_price * Decimal(item.quantity)
            item.unit_price = authoritative_unit_price
            item.total_price = item_total
            computed_subtotal += item_total

            validated_items.append({
                "product_id": prod.id,
                "sku": prod.sku,
                "name": prod.name,
                "quantity": item.quantity,
                "unit_price": str(authoritative_unit_price),
                "total_price": str(item_total),
            })

        order.subtotal = computed_subtotal
        # Calculate shipping: free over ₹20,000, else ₹499
        if computed_subtotal >= Decimal("20000.00"):
            order.shipping = Decimal("0.00")
        else:
            order.shipping = Decimal("499.00")

        order.total = order.subtotal - order.discount + order.shipping + order.tax

        return {
            "order_number": order.order_number,
            "items_count": len(items),
            "subtotal": str(order.subtotal),
            "shipping": str(order.shipping),
            "total": str(order.total),
            "customer": order.customer_name,
            "validated_items": validated_items,
        }
