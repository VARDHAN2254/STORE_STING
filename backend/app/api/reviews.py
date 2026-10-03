import uuid
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.database.session import get_db
from app.database.models import Review, Product, User
from app.schemas.schemas import ReviewResponse, ReviewCreate
from app.api.deps import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/products/{product_id}", response_model=List[ReviewResponse])
async def get_product_reviews(product_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Review)
        .where(Review.product_id == product_id)
        .order_by(desc(Review.created_at))
    )
    reviews = result.scalars().all()
    return [ReviewResponse.model_validate(r) for r in reviews]


@router.post("/products/{product_id}", response_model=ReviewResponse)
async def create_product_review(
    product_id: str,
    payload: ReviewCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    prod_res = await db.execute(select(Product).where(Product.id == product_id))
    product = prod_res.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    review = Review(
        id=str(uuid.uuid4()),
        product_id=product.id,
        user_id=user.id,
        rating=payload.rating,
        title=payload.title,
        comment=payload.comment,
        is_verified_purchase=True,
        helpful_votes=0,
    )
    db.add(review)

    # Recalculate product rating
    reviews_res = await db.execute(select(Review).where(Review.product_id == product.id))
    all_revs = reviews_res.scalars().all()
    new_count = len(all_revs) + 1
    total_rating = sum(r.rating for r in all_revs) + payload.rating
    product.rating = Decimal(f"{total_rating / Decimal(new_count):.2f}")
    product.review_count = new_count

    await db.commit()
    await db.refresh(review)
    return ReviewResponse.model_validate(review)


@router.post("/{review_id}/helpful")
async def vote_helpful(review_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")
    review.helpful_votes += 1
    await db.commit()
    return {"status": "success", "helpful_votes": review.helpful_votes}
