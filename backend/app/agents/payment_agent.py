import uuid
from decimal import Decimal
from typing import Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.models import Order, Payment


class PaymentAgent:
    """Evaluates payment authorization, applies fraud-risk scoring, and handles retry mechanisms."""

    async def process(
        self,
        session: AsyncSession,
        order: Order,
        attempt: int = 1,
        scenario: str = "SUCCESS",
        seed: int = 42
    ) -> Tuple[bool, Dict[str, Any]]:
        # Compute deterministic fraud risk
        if scenario == "FRAUD_REJECTION":
            fraud_risk = Decimal("0.850")
            is_authorized = False
            failure_reason = "Flagged by Neural Fraud Sentinel: high risk anomaly."
        elif scenario == "PAYMENT_FAILURE":
            fraud_risk = Decimal("0.120")
            is_authorized = False
            failure_reason = "Payment gateway timeout / card decline simulation."
        elif scenario == "PAYMENT_RETRY":
            if attempt == 1:
                fraud_risk = Decimal("0.380")
                is_authorized = False
                failure_reason = "Bank network latency on initial attempt."
            else:
                fraud_risk = Decimal("0.080")
                is_authorized = True
                failure_reason = None
        else:
            # Default SUCCESS
            fraud_risk = Decimal("0.045")
            is_authorized = True
            failure_reason = None

        # Check existing payment or create new
        pay_result = await session.execute(select(Payment).where(Payment.order_id == order.id))
        payment = pay_result.scalars().first()

        if not payment:
            payment = Payment(
                id=str(uuid.uuid4()),
                order_id=order.id,
                transaction_ref=f"TXN-STING-{uuid.uuid4().hex[:12].upper()}",
                payment_method=order.payment_method,
                amount=order.total,
                status="AUTHORIZED" if is_authorized else "FAILED",
                fraud_risk=fraud_risk,
                attempts=attempt,
                failure_reason=failure_reason,
            )
            session.add(payment)
        else:
            payment.attempts = attempt
            payment.status = "AUTHORIZED" if is_authorized else "FAILED"
            payment.fraud_risk = fraud_risk
            payment.failure_reason = failure_reason

        return is_authorized, {
            "payment_id": payment.id,
            "transaction_ref": payment.transaction_ref,
            "status": payment.status,
            "amount": str(payment.amount),
            "fraud_risk": float(payment.fraud_risk),
            "attempt": attempt,
            "failure_reason": failure_reason,
        }
