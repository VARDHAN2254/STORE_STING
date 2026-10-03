from enum import Enum
from typing import Set, Dict


class OrderState(str, Enum):
    CREATED = "CREATED"
    ORDER_PLACED = "ORDER_PLACED"
    INVENTORY_VERIFIED = "INVENTORY_VERIFIED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAYMENT_AUTHORIZED = "PAYMENT_AUTHORIZED"
    PACKED = "PACKED"
    SHIPPED = "SHIPPED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


# Explicit valid state transition matrix
VALID_TRANSITIONS: Dict[OrderState, Set[OrderState]] = {
    OrderState.CREATED: {OrderState.ORDER_PLACED, OrderState.FAILED, OrderState.CANCELLED},
    OrderState.ORDER_PLACED: {OrderState.INVENTORY_VERIFIED, OrderState.FAILED, OrderState.CANCELLED},
    OrderState.INVENTORY_VERIFIED: {OrderState.PAYMENT_PENDING, OrderState.PAYMENT_AUTHORIZED, OrderState.FAILED, OrderState.CANCELLED},
    OrderState.PAYMENT_PENDING: {OrderState.PAYMENT_AUTHORIZED, OrderState.FAILED, OrderState.CANCELLED},
    OrderState.PAYMENT_AUTHORIZED: {OrderState.PACKED, OrderState.FAILED, OrderState.CANCELLED},
    OrderState.PACKED: {OrderState.SHIPPED, OrderState.FAILED, OrderState.CANCELLED},
    OrderState.SHIPPED: {OrderState.OUT_FOR_DELIVERY, OrderState.DELIVERED, OrderState.FAILED},
    OrderState.OUT_FOR_DELIVERY: {OrderState.DELIVERED, OrderState.FAILED},
    OrderState.DELIVERED: set(),
    OrderState.FAILED: set(),
    OrderState.CANCELLED: set(),
}


def can_transition(current_state: str, next_state: str) -> bool:
    try:
        current_enum = OrderState(current_state)
        next_enum = OrderState(next_state)
        return next_enum in VALID_TRANSITIONS.get(current_enum, set())
    except ValueError:
        return False
