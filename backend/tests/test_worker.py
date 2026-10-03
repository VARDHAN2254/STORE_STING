import pytest
import uuid
from app.worker.processor import JobWorker
from app.database.models import Job, Order, OrderItem, Product
from app.database.session import async_session_factory
from sqlalchemy import select, delete


@pytest.mark.asyncio
async def test_job_worker_execution(client, db_session):
    # Clear any leftover pending jobs from previous test runs
    await db_session.execute(delete(Job).where(Job.status == "PENDING"))
    await db_session.commit()

    # Fetch a product
    prod_res = await db_session.execute(select(Product).limit(1))
    product = prod_res.scalars().first()

    # Create an order
    order_id = str(uuid.uuid4())
    order = Order(
        id=order_id,
        order_number=f"SS-WRK-{uuid.uuid4().hex[:6].upper()}",
        customer_name="Dev Tester",
        customer_email="dev@storesting.com",
        shipping_address={"city": "Bengaluru", "country": "India"},
        subtotal=product.discounted_price,
        discount=0,
        shipping=0,
        tax=0,
        total=product.discounted_price,
        status="CREATED",
        payment_method="UPI",
        scenario="SUCCESS",
    )
    db_session.add(order)
    
    order_item = OrderItem(
        id=str(uuid.uuid4()),
        order_id=order_id,
        product_id=product.id,
        sku=product.sku,
        product_name=product.name,
        quantity=1,
        unit_price=product.discounted_price,
        total_price=product.discounted_price,
    )
    db_session.add(order_item)

    # Insert a pending job
    job = Job(
        id=str(uuid.uuid4()),
        job_type="process_order",
        payload={"order_id": order_id, "scenario": "SUCCESS", "seed": 42},
        status="PENDING",
    )
    db_session.add(job)
    await db_session.commit()

    # Instantiate worker and claim job
    worker = JobWorker(worker_id="test-worker-1")
    claimed_job = await worker.claim_next_job()
    assert claimed_job is not None
    assert claimed_job.id == job.id
    assert claimed_job.status == "PROCESSING"
    assert claimed_job.locked_by == "test-worker-1"

    # Process job
    await worker.process_job(claimed_job)

    # Query in fresh session to observe committed transaction
    async with async_session_factory() as verify_session:
        refetched_job = await verify_session.execute(select(Job).where(Job.id == claimed_job.id))
        job_record = refetched_job.scalars().first()
        assert job_record.status == "COMPLETED"

        refetched_order = await verify_session.execute(select(Order).where(Order.id == order_id))
        order_record = refetched_order.scalars().first()
        assert order_record.status == "DELIVERED"
