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


class InvalidStateTransitionError(Exception):
    def __init__(self, current_state: str, next_state: str, order_id: str = ""):
        super().__init__(
            f"Invalid order state transition: cannot transition from '{current_state}' to '{next_state}' for order {order_id}"
        )
        self.current_state = current_state
        self.next_state = next_state
        self.order_id = order_id


# Strict monotonic state transition matrix - forward only or terminal
VALID_TRANSITIONS: Dict[OrderState, Set[OrderState]] = {
    OrderState.CREATED: {OrderState.ORDER_PLACED, OrderState.FAILED, OrderState.CANCELLED},
    OrderState.ORDER_PLACED: {OrderState.INVENTORY_VERIFIED, OrderState.FAILED, OrderState.CANCELLED},
    OrderState.INVENTORY_VERIFIED: {OrderState.PAYMENT_PENDING, OrderState.FAILED, OrderState.CANCELLED},
    OrderState.PAYMENT_PENDING: {OrderState.PAYMENT_AUTHORIZED, OrderState.FAILED, OrderState.CANCELLED},
    OrderState.PAYMENT_AUTHORIZED: {OrderState.PACKED, OrderState.FAILED, OrderState.CANCELLED},
    OrderState.PACKED: {OrderState.SHIPPED, OrderState.FAILED, OrderState.CANCELLED},
    OrderState.SHIPPED: {OrderState.OUT_FOR_DELIVERY, OrderState.FAILED},
    OrderState.OUT_FOR_DELIVERY: {OrderState.DELIVERED, OrderState.FAILED},
    # Terminal states have NO outgoing transitions
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


def validate_transition(current_state: str, next_state: str, order_id: str = "") -> None:
    if not can_transition(current_state, next_state):
        raise InvalidStateTransitionError(current_state, next_state, order_id)
