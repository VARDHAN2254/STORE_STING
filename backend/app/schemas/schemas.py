from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, Any, List
from decimal import Decimal


# Auth
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    preferences: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Category
class CategoryResponse(BaseModel):
    id: str
    slug: str
    name: str
    description: str
    icon_name: str
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


# Product
class ProductImageResponse(BaseModel):
    id: str
    url: str
    alt_text: str
    is_primary: bool

    model_config = ConfigDict(from_attributes=True)


class ProductResponse(BaseModel):
    id: str
    sku: str
    name: str
    slug: str
    brand: str
    category_id: str
    price: Decimal
    discount_percent: int
    discounted_price: Decimal
    rating: Decimal
    review_count: int
    stock_status: str
    badges: List[str]
    best_for: str
    goal_tags: List[str]
    images: List[ProductImageResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProductDetailResponse(ProductResponse):
    description: str
    specs: Dict[str, Any]
    features: List[str]
    whats_included: List[str]


# Cart
class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemResponse(BaseModel):
    id: str
    product_id: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    product: ProductResponse

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    id: str
    session_token: str
    items: List[CartItemResponse]
    subtotal: Decimal
    discount: Decimal
    shipping: Decimal
    tax: Decimal
    total: Decimal
    setup_suggestions: List[ProductResponse] = []


# Wishlist
class WishlistAddRequest(BaseModel):
    product_id: str
    collection_name: str = "Dream Tech"


class WishlistItemResponse(BaseModel):
    id: str
    product_id: str
    product: ProductResponse

    model_config = ConfigDict(from_attributes=True)


class WishlistResponse(BaseModel):
    id: str
    collection_name: str
    items: List[WishlistItemResponse]

    model_config = ConfigDict(from_attributes=True)


# Order & Checkout
class CheckoutItem(BaseModel):
    product_id: str
    quantity: int = 1


class CheckoutEstimateRequest(BaseModel):
    items: List[CheckoutItem]


class CheckoutEstimateResponse(BaseModel):
    subtotal: Decimal
    discount: Decimal
    shipping: Decimal
    tax: Decimal
    total: Decimal


class OrderCreateRequest(BaseModel):
    customer_name: str
    customer_email: EmailStr
    shipping_address: Dict[str, Any]
    payment_method: str = "UPI"
    items: List[CheckoutItem]
    scenario: str = "SUCCESS"  # For simulation testing: SUCCESS, LOW_STOCK, PAYMENT_RETRY, PAYMENT_FAILURE, FRAUD_REJECTION, DELIVERY_RETRY, DELIVERY_FAILURE


class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    sku: str
    product_name: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: str
    order_number: str
    customer_name: str
    customer_email: str
    subtotal: Decimal
    discount: Decimal
    shipping: Decimal
    tax: Decimal
    total: Decimal
    status: str
    payment_method: str
    shipping_partner: str
    estimated_delivery_days: int
    tracking_number: str
    scenario: str
    created_at: Any
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Reviews
class ReviewCreate(BaseModel):
    rating: Decimal = Field(ge=1.0, le=5.0)
    title: str = Field(min_length=2, max_length=150)
    comment: str = Field(min_length=5)


class ReviewResponse(BaseModel):
    id: str
    user_id: str
    rating: Decimal
    title: str
    comment: str
    is_verified_purchase: bool
    helpful_votes: int
    created_at: Any

    model_config = ConfigDict(from_attributes=True)


# Notifications
class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    category: str
    is_read: bool
    link: Optional[str]
    created_at: Any

    model_config = ConfigDict(from_attributes=True)
