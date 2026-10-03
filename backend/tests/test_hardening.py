import pytest
import uuid
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy import select
from app.orchestration.state_machine import can_transition, validate_transition, InvalidStateTransitionError, OrderState
from app.database.models import Product, Order, Inventory, User
from app.database.session import async_session_factory
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_state_machine_strictness():
    # Valid forward transitions
    assert can_transition(OrderState.CREATED.value, OrderState.ORDER_PLACED.value) is True
    assert can_transition(OrderState.ORDER_PLACED.value, OrderState.INVENTORY_VERIFIED.value) is True
    assert can_transition(OrderState.INVENTORY_VERIFIED.value, OrderState.PAYMENT_PENDING.value) is True
    assert can_transition(OrderState.PAYMENT_PENDING.value, OrderState.PAYMENT_AUTHORIZED.value) is True
    assert can_transition(OrderState.PAYMENT_AUTHORIZED.value, OrderState.PACKED.value) is True
    assert can_transition(OrderState.PACKED.value, OrderState.SHIPPED.value) is True
    assert can_transition(OrderState.SHIPPED.value, OrderState.OUT_FOR_DELIVERY.value) is True
    assert can_transition(OrderState.OUT_FOR_DELIVERY.value, OrderState.DELIVERED.value) is True

    # Invalid backward transitions
    assert can_transition(OrderState.INVENTORY_VERIFIED.value, OrderState.ORDER_PLACED.value) is False
    assert can_transition(OrderState.SHIPPED.value, OrderState.PACKED.value) is False
    assert can_transition(OrderState.DELIVERED.value, OrderState.SHIPPED.value) is False
    assert can_transition(OrderState.FAILED.value, OrderState.ORDER_PLACED.value) is False

    # Validation helper raises InvalidStateTransitionError
    with pytest.raises(InvalidStateTransitionError):
        validate_transition(OrderState.DELIVERED.value, OrderState.SHIPPED.value)

    with pytest.raises(InvalidStateTransitionError):
        validate_transition(OrderState.INVENTORY_VERIFIED.value, OrderState.ORDER_PLACED.value)


@pytest.mark.asyncio
async def test_financial_calculations_decimal(client: AsyncClient):
    # Verify Decimal / NUMERIC accuracy
    estimate_payload = {
        "items": [
            {"product_id": "test-p1", "quantity": 2}
        ]
    }
    # Create product with precise decimal price
    async with async_session_factory() as session:
        prod = (await session.execute(select(Product))).scalars().first()
        assert prod is not None
        assert isinstance(prod.discounted_price, Decimal)
        
        estimate_payload["items"][0]["product_id"] = prod.id
        expected_subtotal = prod.discounted_price * Decimal(2)

    res = await client.post("/api/orders/estimate", json=estimate_payload)
    assert res.status_code == 200
    data = res.json()
    assert Decimal(str(data["subtotal"])) == expected_subtotal
    assert Decimal(str(data["total"])) >= expected_subtotal


@pytest.mark.asyncio
async def test_idempotency_key_prevents_duplicate_orders(client: AsyncClient):
    idem_key = f"IDEM-TEST-{uuid.uuid4().hex[:8]}"
    async with async_session_factory() as session:
        prod = (await session.execute(select(Product))).scalars().first()
        assert prod is not None

    payload = {
        "customer_name": "Idempotent Shopper",
        "customer_email": "idem@storesting.com",
        "shipping_address": {"street": "1 Future Way", "city": "Bengaluru", "country": "India"},
        "payment_method": "UPI",
        "scenario": "SUCCESS",
        "items": [{"product_id": prod.id, "quantity": 1}]
    }

    # First request
    res1 = await client.post("/api/orders", json=payload, headers={"Idempotency-Key": idem_key})
    assert res1.status_code == 200
    order1 = res1.json()

    # Duplicate request with same Idempotency-Key
    res2 = await client.post("/api/orders", json=payload, headers={"Idempotency-Key": idem_key})
    assert res2.status_code == 200
    order2 = res2.json()

    # Must return the identical order
    assert order1["id"] == order2["id"]
    assert order1["order_number"] == order2["order_number"]


@pytest.mark.asyncio
async def test_admin_authorization_enforced(client: AsyncClient):
    # 1. Unauthenticated request -> 401
    res_unauth = await client.get("/api/admin/metrics")
    assert res_unauth.status_code == 401

    # 2. Customer token -> 403
    customer_token = create_access_token(subject="usr-alex-2050")
    res_forbidden = await client.get("/api/admin/metrics", headers={"Authorization": f"Bearer {customer_token}"})
    assert res_forbidden.status_code == 403

    # 3. Admin token -> 200
    async with async_session_factory() as session:
        admin_user = (await session.execute(select(User).where(User.role == "admin"))).scalars().first()
        assert admin_user is not None
        admin_token = create_access_token(subject=admin_user.id)

    res_admin = await client.get("/api/admin/metrics", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    metrics = res_admin.json()
    assert "total_orders" in metrics
    assert "worker_health" in metrics


@pytest.mark.asyncio
async def test_inventory_concurrency_row_locking():
    """Verify that row locking prevents overselling when multiple workers attempt reserving stock."""
    import asyncio

    async with async_session_factory() as session:
        # Create a test product with foreign key satisfied
        test_prod = Product(
            id=f"prod-concur-{uuid.uuid4().hex[:8]}",
            sku=f"SKU-CONCUR-{uuid.uuid4().hex[:6]}",
            name="Concurrency Test Probe",
            slug=f"probe-{uuid.uuid4().hex[:6]}",
            brand="StoreSting Lab",
            category_id="cat-computers",
            description="Concurrency test fixture",
            price=Decimal("1000.00"),
            discount_percent=Decimal("0.00"),
            discounted_price=Decimal("1000.00"),
            rating=Decimal("5.0"),
            stock_status="In Stock",
            goal_tags=["workspace"],
        )
        session.add(test_prod)
        await session.flush()

        # Create a test product inventory with exactly 1 unit
        inv = Inventory(
            id=str(uuid.uuid4()),
            product_id=test_prod.id,
            warehouse="Bengaluru Hub Test",
            stock_units=1,
            reserved_units=0,
            available_units=1,
        )
        session.add(inv)
        await session.commit()
        test_prod_id = test_prod.id

    # Two concurrent reservation attempts for 1 unit
    async def try_reserve():
        async with async_session_factory() as s:
            try:
                inv_res = await s.execute(
                    select(Inventory).where(Inventory.product_id == test_prod_id).with_for_update()
                )
                i = inv_res.scalars().first()
                if i.available_units >= 1:
                    await asyncio.sleep(0.05)
                    i.reserved_units += 1
                    i.available_units = i.stock_units - i.reserved_units
                    await s.commit()
                    return True
                else:
                    await s.rollback()
                    return False
            except Exception:
                await s.rollback()
                return False

    results = await asyncio.gather(try_reserve(), try_reserve())
    assert results.count(True) == 1, "Exactly one transaction must succeed reserving the 1 unit."
    assert results.count(False) == 1, "The competing transaction must be denied."

    async with async_session_factory() as s:
        final_inv = (await s.execute(select(Inventory).where(Inventory.product_id == test_prod_id))).scalars().first()
        assert final_inv.available_units == 0
        assert final_inv.reserved_units == 1


@pytest.mark.asyncio
async def test_deterministic_scenarios(client: AsyncClient):
    from app.orchestration.orchestrator import OrderOrchestrator
    from app.database.models import OrderItem

    async with async_session_factory() as session:
        prod = (await session.execute(select(Product))).scalars().first()
        assert prod is not None

        # 1. Test FRAUD_REJECTION scenario
        order_fraud = Order(
            id=str(uuid.uuid4()),
            order_number=f"SS-FRAUD-{uuid.uuid4().hex[:6]}",
            customer_name="High Risk Actor",
            customer_email="fraud@test.com",
            shipping_address={"city": "Nowhere"},
            subtotal=prod.discounted_price,
            total=prod.discounted_price,
            status="CREATED",
            payment_method="CARD",
            scenario="FRAUD_REJECTION",
        )
        session.add(order_fraud)
        await session.flush()
        item = OrderItem(
            id=str(uuid.uuid4()),
            order_id=order_fraud.id,
            product_id=prod.id,
            sku=prod.sku,
            product_name=prod.name,
            quantity=1,
            unit_price=prod.discounted_price,
            total_price=prod.discounted_price,
        )
        session.add(item)
        await session.commit()

        orchestrator = OrderOrchestrator()
        run = await orchestrator.run_pipeline(session, order_fraud.id, scenario="FRAUD_REJECTION")
        assert run.status == "FAILED"
        assert order_fraud.status == "FAILED"

        # 2. Test PAYMENT_RETRY scenario (attempt 1 fails, attempt 2 succeeds)
        order_retry = Order(
            id=str(uuid.uuid4()),
            order_number=f"SS-RETRY-{uuid.uuid4().hex[:6]}",
            customer_name="Retry Shopper",
            customer_email="retry@test.com",
            shipping_address={"city": "Bengaluru"},
            subtotal=prod.discounted_price,
            total=prod.discounted_price,
            status="CREATED",
            payment_method="UPI",
            scenario="PAYMENT_RETRY",
        )
        session.add(order_retry)
        await session.flush()
        item2 = OrderItem(
            id=str(uuid.uuid4()),
            order_id=order_retry.id,
            product_id=prod.id,
            sku=prod.sku,
            product_name=prod.name,
            quantity=1,
            unit_price=prod.discounted_price,
            total_price=prod.discounted_price,
        )
        session.add(item2)
        await session.commit()

        run_retry = await orchestrator.run_pipeline(session, order_retry.id, scenario="PAYMENT_RETRY")
        assert run_retry.status == "COMPLETED"
        assert order_retry.status == "DELIVERED"


@pytest.mark.asyncio
async def test_security_headers_injected(client: AsyncClient):
    """Verify production security headers (X-Content-Type-Options, Frame-Options, etc.) on API responses."""
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("x-frame-options") == "DENY"
    assert resp.headers.get("referrer-policy") == "strict-origin-when-cross-origin"


@pytest.mark.asyncio
async def test_idor_order_access_restriction(client: AsyncClient):
    """Verify that Customer B cannot inspect an order owned by Customer A."""
    from app.core.security import create_access_token
    from app.database.models import User

    async with async_session_factory() as session:
        # Create user B
        user_b = User(
            id=str(uuid.uuid4()),
            email=f"userb-{uuid.uuid4().hex[:4]}@example.com",
            hashed_password="hashed_placeholder",
            full_name="User B",
            role="customer",
        )
        # Create order owned by usr-alex-2050 (Customer A)
        order_a = Order(
            id=str(uuid.uuid4()),
            order_number=f"SS-IDOR-{uuid.uuid4().hex[:6]}",
            user_id="usr-alex-2050",
            customer_name="Customer A",
            customer_email="alex@storesting.com",
            shipping_address={"city": "Bengaluru"},
            subtotal=Decimal("100.00"),
            total=Decimal("100.00"),
            status="CREATED",
            payment_method="UPI",
        )
        session.add_all([user_b, order_a])
        await session.commit()

    token_b = create_access_token(user_b.id)
    token_a = create_access_token("usr-alex-2050")

    # Customer B requests Customer A's order -> must be 403 Forbidden
    resp_b = await client.get(
        f"/api/orders/{order_a.id}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert resp_b.status_code == 403

    # Customer A requests own order -> must be 200 OK
    resp_a = await client.get(
        f"/api/orders/{order_a.id}",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    assert resp_a.status_code == 200


@pytest.mark.asyncio
async def test_sse_telemetry_stream_authorization(client: AsyncClient):
    """Verify that unauthenticated callers and unauthorized users cannot stream order events."""
    from app.core.security import create_access_token
    from app.database.models import User

    async with async_session_factory() as session:
        user_intruder = User(
            id=str(uuid.uuid4()),
            email=f"intruder-{uuid.uuid4().hex[:4]}@example.com",
            hashed_password="hashed_placeholder",
            full_name="Intruder",
            role="customer",
        )
        order_private = Order(
            id=str(uuid.uuid4()),
            order_number=f"SS-PRIV-{uuid.uuid4().hex[:6]}",
            user_id="usr-alex-2050",
            customer_name="Alex Mercer",
            customer_email="alex@storesting.com",
            shipping_address={"city": "Bengaluru"},
            subtotal=Decimal("500.00"),
            total=Decimal("500.00"),
            status="CREATED",
            payment_method="UPI",
        )
        session.add_all([user_intruder, order_private])
        await session.commit()

    intruder_token = create_access_token(user_intruder.id)

    # 1. Unauthenticated request to private order stream -> 403 Forbidden
    unauth_resp = await client.get(f"/api/orders/{order_private.id}/stream")
    assert unauth_resp.status_code == 403

    # 2. Authenticated different user to private order stream -> 403 Forbidden
    intruder_resp = await client.get(
        f"/api/orders/{order_private.id}/stream",
        headers={"Authorization": f"Bearer {intruder_token}"}
    )
    assert intruder_resp.status_code == 403


