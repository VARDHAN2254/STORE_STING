import pytest
from decimal import Decimal


@pytest.mark.asyncio
async def test_health_check(client):
    res = await client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "STORE STING" in data["service"]


@pytest.mark.asyncio
async def test_database_health(client):
    res = await client.get("/api/health/database")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "operational"
    assert data["database"] == "connected"


@pytest.mark.asyncio
async def test_list_categories(client):
    res = await client.get("/api/categories")
    assert res.status_code == 200
    cats = res.json()
    assert len(cats) >= 5
    slugs = [c["slug"] for c in cats]
    assert "computers" in slugs
    assert "workspace" in slugs


@pytest.mark.asyncio
async def test_list_and_filter_products(client):
    res = await client.get("/api/products?category=computers")
    assert res.status_code == 200
    products = res.json()
    assert len(products) >= 1
    for p in products:
        assert Decimal(str(p["discounted_price"])) > 0
        assert p["stock_status"] in ["In Stock", "Low Stock", "Out of Stock"]


@pytest.mark.asyncio
async def test_intelligent_comparison(client):
    # Get 2 products
    prod_res = await client.get("/api/products?limit=2")
    products = prod_res.json()
    assert len(products) >= 2
    ids = [products[0]["id"], products[1]["id"]]

    res = await client.post("/api/products/compare", json={"product_ids": ids})
    assert res.status_code == 200
    comp = res.json()
    assert comp["compared_count"] == 2
    assert len(comp["items"]) == 2
    assert "specs" in comp["items"][0]
    assert "highlight" in comp["items"][0]


@pytest.mark.asyncio
async def test_natural_language_search(client):
    res = await client.get("/api/search?q=lightweight+laptop+for+coding+under+70000")
    assert res.status_code == 200
    data = res.json()
    assert data["results_count"] > 0
    top_match = data["results"][0]
    assert top_match["match_percentage"] >= 70
    assert len(top_match["match_reasons"]) > 0
    # AstraBook Pro 100 should be the top match
    assert "AstraBook" in top_match["product"]["name"]


@pytest.mark.asyncio
async def test_cart_workflow(client):
    import uuid
    session_token = f"test-session-{uuid.uuid4()}"
    prod_res = await client.get("/api/products?limit=1")
    product = prod_res.json()[0]

    # Add to cart
    add_res = await client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers={"x-session-token": session_token}
    )
    assert add_res.status_code == 200
    cart = add_res.json()
    assert len(cart["items"]) == 1
    assert cart["items"][0]["product_id"] == product["id"]
    assert Decimal(str(cart["subtotal"])) == Decimal(str(product["discounted_price"]))
    assert Decimal(str(cart["total"])) > 0


@pytest.mark.asyncio
async def test_order_creation_and_orchestration(client):
    prod_res = await client.get("/api/products?limit=1")
    product = prod_res.json()[0]

    order_payload = {
        "customer_name": "Maya Lin",
        "customer_email": "maya@storesting.com",
        "shipping_address": {
            "street": "100 Quantum Avenue",
            "city": "Bengaluru",
            "state": "Karnataka",
            "postal_code": "560001",
            "country": "India"
        },
        "payment_method": "UPI",
        "scenario": "SUCCESS",
        "items": [
            {"product_id": product["id"], "quantity": 1}
        ]
    }

    res = await client.post("/api/orders", json=order_payload)
    assert res.status_code == 200
    order_data = res.json()
    assert order_data["order_number"].startswith("SS-")
    assert Decimal(str(order_data["total"])) > 0
    assert order_data["customer_name"] == "Maya Lin"

    # Fetch order detail with events
    detail_res = await client.get(f"/api/orders/{order_data['id']}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["order"]["id"] == order_data["id"]
    assert len(detail["items"]) == 1


@pytest.mark.asyncio
async def test_admin_metrics(client):
    from app.core.security import create_access_token
    from app.database.session import async_session_factory
    from app.database.models import User
    from sqlalchemy import select

    async with async_session_factory() as session:
        admin = (await session.execute(select(User).where(User.role == "admin"))).scalars().first()
        token = create_access_token(subject=admin.id)

    res = await client.get("/api/admin/metrics", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    metrics = res.json()
    assert metrics["total_orders"] >= 1
    assert "OPTIMAL" in metrics["worker_health"]
