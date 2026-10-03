import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.database.models import Wishlist, WishlistItem, Product, User
from app.schemas.schemas import WishlistResponse, WishlistAddRequest, WishlistItemResponse, ProductResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=List[WishlistResponse])
async def get_wishlists(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Wishlist)
        .options(
            selectinload(Wishlist.items)
            .selectinload(WishlistItem.product)
            .selectinload(Product.images)
        )
        .where(Wishlist.user_id == user.id)
    )
    result = await db.execute(query)
    wishlists = result.scalars().all()

    if not wishlists:
        # Create default "Dream Tech" wishlist
        default_wl = Wishlist(
            id=str(uuid.uuid4()),
            user_id=user.id,
            collection_name="Dream Tech",
        )
        db.add(default_wl)
        await db.commit()
        await db.refresh(default_wl)
        default_wl.items = []
        wishlists = [default_wl]

    responses = []
    for wl in wishlists:
        item_resps = [
            WishlistItemResponse(
                id=itm.id,
                product_id=itm.product_id,
                product=ProductResponse.model_validate(itm.product),
            )
            for itm in wl.items
        ]
        responses.append(
            WishlistResponse(
                id=wl.id,
                collection_name=wl.collection_name,
                items=item_resps,
            )
        )
    return responses


@router.post("", response_model=WishlistResponse)
async def add_to_wishlist(
    payload: WishlistAddRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Find or create collection
    wl_res = await db.execute(
        select(Wishlist)
        .options(selectinload(Wishlist.items).selectinload(WishlistItem.product).selectinload(Product.images))
        .where((Wishlist.user_id == user.id) & (Wishlist.collection_name == payload.collection_name))
    )
    wishlist = wl_res.scalars().first()
    if not wishlist:
        wishlist = Wishlist(
            id=str(uuid.uuid4()),
            user_id=user.id,
            collection_name=payload.collection_name,
        )
        db.add(wishlist)
        await db.flush()
        wishlist.items = []

    # Check if product is already in collection
    existing = next((i for i in wishlist.items if i.product_id == payload.product_id), None)
    if not existing:
        item = WishlistItem(
            id=str(uuid.uuid4()),
            wishlist_id=wishlist.id,
            product_id=payload.product_id,
        )
        db.add(item)
        await db.commit()

    # Refetch
    refetched = await db.execute(
        select(Wishlist)
        .options(selectinload(Wishlist.items).selectinload(WishlistItem.product).selectinload(Product.images))
        .where(Wishlist.id == wishlist.id)
    )
    wishlist = refetched.scalars().first()

    return WishlistResponse(
        id=wishlist.id,
        collection_name=wishlist.collection_name,
        items=[
            WishlistItemResponse(
                id=itm.id,
                product_id=itm.product_id,
                product=ProductResponse.model_validate(itm.product),
            )
            for itm in wishlist.items
        ],
    )


@router.delete("/items/{item_id}")
async def remove_from_wishlist(
    item_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    item_res = await db.execute(
        select(WishlistItem)
        .join(Wishlist)
        .where((WishlistItem.id == item_id) & (Wishlist.user_id == user.id))
    )
    item = item_res.scalars().first()
    if item:
        await db.delete(item)
        await db.commit()
    return {"status": "success", "removed_id": item_id}
