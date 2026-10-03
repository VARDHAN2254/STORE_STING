from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc, cast, String
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.database.models import Product, Category, ProductImage
from app.schemas.schemas import ProductResponse, ProductDetailResponse

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[ProductResponse])
async def list_products(
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    sort_by: str = Query(default="featured", pattern="^(featured|price_asc|price_desc|rating)$"),
    goal: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(Product).options(selectinload(Product.images))

    if category:
        # Check if category is slug or ID
        cat_res = await db.execute(select(Category).where((Category.slug == category) | (Category.id == category)))
        cat = cat_res.scalars().first()
        if cat:
            query = query.where(Product.category_id == cat.id)

    if brand:
        query = query.where(Product.brand.ilike(f"%{brand}%"))

    if min_price is not None:
        query = query.where(Product.discounted_price >= min_price)

    if max_price is not None:
        query = query.where(Product.discounted_price <= max_price)

    if goal:
        query = query.where(cast(Product.goal_tags, String).ilike(f"%{goal}%"))

    if sort_by == "price_asc":
        query = query.order_by(asc(Product.discounted_price))
    elif sort_by == "price_desc":
        query = query.order_by(desc(Product.discounted_price))
    elif sort_by == "rating":
        query = query.order_by(desc(Product.rating))
    else:
        query = query.order_by(desc(Product.is_featured), desc(Product.created_at))

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    products = result.scalars().all()
    return [ProductResponse.model_validate(p) for p in products]


@router.get("/{id_or_slug}", response_model=ProductDetailResponse)
async def get_product(id_or_slug: str, db: AsyncSession = Depends(get_db)):
    query = (
        select(Product)
        .options(selectinload(Product.images))
        .where((Product.id == id_or_slug) | (Product.slug == id_or_slug))
    )
    result = await db.execute(query)
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    return ProductDetailResponse.model_validate(product)


class CompareRequest(BaseModel):
    product_ids: List[str]


@router.post("/compare")
async def compare_products(payload: CompareRequest, db: AsyncSession = Depends(get_db)):
    if len(payload.product_ids) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 product IDs to compare.")

    query = (
        select(Product)
        .options(selectinload(Product.images))
        .where(Product.id.in_(payload.product_ids))
    )
    result = await db.execute(query)
    products = result.scalars().all()

    if not products:
        raise HTTPException(status_code=404, detail="No matching products found.")

    # Compute factual attribute highlights
    lowest_price_product = min(products, key=lambda p: p.discounted_price)
    highest_rated_product = max(products, key=lambda p: p.rating)

    highlights = {
        lowest_price_product.id: "Lowest price option",
        highest_rated_product.id: f"Highest customer satisfaction ({highest_rated_product.rating}★)",
    }

    # Compare specs
    comparisons = []
    for p in products:
        comparisons.append({
            "product": ProductResponse.model_validate(p),
            "highlight": highlights.get(p.id, "Balanced performer"),
            "specs": p.specs,
            "best_for": p.best_for,
            "rating": str(p.rating),
            "price": str(p.discounted_price),
            "availability": p.stock_status,
        })

    return {
        "compared_count": len(products),
        "items": comparisons,
    }
