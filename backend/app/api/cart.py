import uuid
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.database.models import Cart, CartItem, Product, User
from app.schemas.schemas import CartResponse, CartItemCreate, CartItemUpdate, CartItemResponse, ProductResponse
from app.api.deps import get_current_user_optional

router = APIRouter(prefix="/cart", tags=["cart"])


async def get_or_create_cart(
    session_token: Optional[str],
    user: Optional[User],
    db: AsyncSession
) -> Cart:
    cart = None
    if user:
        result = await db.execute(
            select(Cart)
            .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images))
            .where(Cart.user_id == user.id)
        )
        cart = result.scalars().first()

    if not cart and session_token:
        result = await db.execute(
            select(Cart)
            .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images))
            .where(Cart.session_token == session_token)
        )
        cart = result.scalars().first()

    if not cart:
        token = session_token or str(uuid.uuid4())
        cart = Cart(
            id=str(uuid.uuid4()),
            user_id=user.id if user else None,
            session_token=token,
        )
        db.add(cart)
        await db.commit()
        refetched = await db.execute(
            select(Cart)
            .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images))
            .where(Cart.id == cart.id)
        )
        cart = refetched.scalars().first()

    return cart


def compute_cart_response(cart: Cart, setup_items: list[Product]) -> CartResponse:
    subtotal = Decimal("0.00")
    item_responses = []

    for itm in cart.items:
        item_total = itm.unit_price * Decimal(itm.quantity)
        subtotal += item_total
        item_responses.append(
            CartItemResponse(
                id=itm.id,
                product_id=itm.product_id,
                quantity=itm.quantity,
                unit_price=itm.unit_price,
                total_price=item_total,
                product=ProductResponse.model_validate(itm.product),
            )
        )

    # Shipping rule: free above 20,000, else 499
    shipping = Decimal("0.00") if subtotal >= Decimal("20000.00") or subtotal == Decimal("0.00") else Decimal("499.00")
    discount = Decimal("0.00")
    tax = Decimal("0.00")
    total = subtotal - discount + shipping + tax

    return CartResponse(
        id=cart.id,
        session_token=cart.session_token,
        items=item_responses,
        subtotal=subtotal,
        discount=discount,
        shipping=shipping,
        tax=tax,
        total=total,
        setup_suggestions=[ProductResponse.model_validate(p) for p in setup_items],
    )


@router.get("", response_model=CartResponse)
async def get_cart(
    x_session_token: Optional[str] = Header(None),
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    cart = await get_or_create_cart(x_session_token, user, db)

    # Get complementary products for "Complete your setup"
    cart_prod_ids = [itm.product_id for itm in cart.items]
    sugg_query = (
        select(Product)
        .options(selectinload(Product.images))
        .where(~Product.id.in_(cart_prod_ids) if cart_prod_ids else True)
        .limit(3)
    )
    sugg_res = await db.execute(sugg_query)
    setup_items = sugg_res.scalars().all()

    return compute_cart_response(cart, setup_items)


@router.post("/items", response_model=CartResponse)
async def add_cart_item(
    payload: CartItemCreate,
    x_session_token: Optional[str] = Header(None),
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    cart = await get_or_create_cart(x_session_token, user, db)

    prod_res = await db.execute(select(Product).options(selectinload(Product.images)).where(Product.id == payload.product_id))
    product = prod_res.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    # Check if item exists in cart
    existing_item = next((i for i in cart.items if i.product_id == product.id), None)
    if existing_item:
        existing_item.quantity += payload.quantity
    else:
        new_item = CartItem(
            id=str(uuid.uuid4()),
            cart_id=cart.id,
            product_id=product.id,
            quantity=payload.quantity,
            unit_price=product.discounted_price,
        )
        db.add(new_item)

    await db.commit()
    refetched = await db.execute(
        select(Cart)
        .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images))
        .where(Cart.id == cart.id)
        .execution_options(populate_existing=True)
    )
    cart = refetched.scalars().first()

    return compute_cart_response(cart, [])


@router.patch("/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: str,
    payload: CartItemUpdate,
    x_session_token: Optional[str] = Header(None),
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    cart = await get_or_create_cart(x_session_token, user, db)
    item = next((i for i in cart.items if i.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found.")

    item.quantity = payload.quantity
    await db.commit()

    refetched = await db.execute(
        select(Cart)
        .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images))
        .where(Cart.id == cart.id)
        .execution_options(populate_existing=True)
    )
    cart = refetched.scalars().first()
    return compute_cart_response(cart, [])


@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_cart_item(
    item_id: str,
    x_session_token: Optional[str] = Header(None),
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    cart = await get_or_create_cart(x_session_token, user, db)
    item = next((i for i in cart.items if i.id == item_id), None)
    if item:
        await db.delete(item)
        await db.commit()

    refetched = await db.execute(
        select(Cart)
        .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images))
        .where(Cart.id == cart.id)
        .execution_options(populate_existing=True)
    )
    cart = refetched.scalars().first()
    return compute_cart_response(cart, [])
