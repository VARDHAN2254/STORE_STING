from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, cast, String
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.database.models import Product, User, Order, OrderItem
from app.schemas.schemas import ProductResponse
from app.api.deps import get_current_user_optional

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/goals/{goal_name}", response_model=List[ProductResponse])
async def get_goal_collection(goal_name: str, db: AsyncSession = Depends(get_db)):
    clean_goal = goal_name.lower().replace("-", "")
    query = (
        select(Product)
        .options(selectinload(Product.images))
        .where(cast(Product.goal_tags, String).ilike(f"%{clean_goal}%"))
        .limit(10)
    )
    result = await db.execute(query)
    products = result.scalars().all()
    return [ProductResponse.model_validate(p) for p in products]


@router.get("/trending", response_model=List[ProductResponse])
async def get_trending_products(db: AsyncSession = Depends(get_db)):
    query = (
        select(Product)
        .options(selectinload(Product.images))
        .order_by(desc(Product.review_count), desc(Product.rating))
        .limit(8)
    )
    result = await db.execute(query)
    products = result.scalars().all()
    return [ProductResponse.model_validate(p) for p in products]


@router.get("/new-arrivals", response_model=List[ProductResponse])
async def get_new_arrivals(db: AsyncSession = Depends(get_db)):
    query = (
        select(Product)
        .options(selectinload(Product.images))
        .order_by(desc(Product.created_at))
        .limit(6)
    )
    result = await db.execute(query)
    products = result.scalars().all()
    return [ProductResponse.model_validate(p) for p in products]


@router.get("/my-space")
async def get_my_space(
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    # Fetch buy again products if user has prior orders
    buy_again = []
    if user:
        order_res = await db.execute(
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images))
            .where(Order.user_id == user.id)
            .limit(5)
        )
        orders = order_res.scalars().all()
        seen_ids = set()
        for ord in orders:
            for item in ord.items:
                if item.product and item.product.id not in seen_ids:
                    seen_ids.add(item.product.id)
                    buy_again.append(ProductResponse.model_validate(item.product))

    # Recommendations for workspace & creators
    featured_res = await db.execute(
        select(Product)
        .options(selectinload(Product.images))
        .where(Product.is_featured == True)
        .limit(4)
    )
    curated_picks = [ProductResponse.model_validate(p) for p in featured_res.scalars().all()]

    return {
        "user_name": user.full_name if user else "Guest Explorer",
        "buy_again": buy_again,
        "curated_for_you": curated_picks,
        "saved_goals": ["workspace", "creators", "students"],
    }
