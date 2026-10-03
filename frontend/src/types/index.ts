export interface ProductImage {
  id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand: string;
  category_id: string;
  price: string;
  discount_percent: number;
  discounted_price: string;
  rating: string;
  review_count: number;
  stock_status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  badges: string[];
  best_for: string;
  goal_tags: string[];
  images: ProductImage[];
}

export interface ProductDetail extends Product {
  description: string;
  specs: Record<string, string>;
  features: string[];
  whats_included: string[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_name: string;
  sort_order: number;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  product: Product;
}

export interface Cart {
  id: string;
  session_token: string;
  items: CartItem[];
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
  setup_suggestions: Product[];
}

export interface WishlistItem {
  id: string;
  product_id: string;
  product: Product;
}

export interface Wishlist {
  id: string;
  collection_name: string;
  items: WishlistItem[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  sku: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  image?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
  status: string;
  payment_method: string;
  shipping_partner: string;
  estimated_delivery_days: number;
  tracking_number: string;
  scenario: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderEvent {
  agent: string;
  state: string;
  payload: Record<string, any>;
  timestamp: string;
}

export interface OrderDetailData {
  order: Order;
  items: OrderItem[];
  events: OrderEvent[];
  shipment?: {
    tracking_number: string;
    carrier: string;
    status: string;
    estimated_delivery?: string;
  };
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  preferences?: Record<string, any>;
}

export interface Review {
  id: string;
  user_id: string;
  rating: string;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  helpful_votes: number;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface SearchResult {
  product: Product;
  match_percentage: number;
  match_reasons: string[];
}

export interface SearchResponse {
  query: string;
  interpreted_criteria: {
    max_budget?: string;
    category_hints: string[];
    intent_tags: string[];
  };
  results_count: number;
  results: SearchResult[];
}
