import {
  Product, ProductDetail, Category, Cart, Order,
  OrderDetailData, User, Review, NotificationItem, SearchResponse
} from '../types';

const API_BASE = '/api';

function getSessionToken(): string {
  let token = localStorage.getItem('storesting_session_token');
  if (!token) {
    token = 'sess-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('storesting_session_token', token);
  }
  return token;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('storesting_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-token': getSessionToken(),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Products & Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getProducts(params?: {
    category?: string;
    brand?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
    goal?: string;
  }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.brand) query.set('brand', params.brand);
    if (params?.min_price) query.set('min_price', params.min_price.toString());
    if (params?.max_price) query.set('max_price', params.max_price.toString());
    if (params?.sort_by) query.set('sort_by', params.sort_by);
    if (params?.goal) query.set('goal', params.goal);

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async getProductDetail(idOrSlug: string): Promise<ProductDetail> {
    const res = await fetch(`${API_BASE}/products/${idOrSlug}`);
    if (!res.ok) throw new Error('Product not found');
    return res.json();
  },

  async compareProducts(productIds: string[]): Promise<any> {
    const res = await fetch(`${API_BASE}/products/compare`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ product_ids: productIds }),
    });
    if (!res.ok) throw new Error('Comparison failed');
    return res.json();
  },

  async searchProducts(q: string): Promise<SearchResponse> {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  // Cart
  async getCart(): Promise<Cart> {
    const res = await fetch(`${API_BASE}/cart`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to load cart');
    return res.json();
  },

  async addToCart(productId: string, quantity = 1): Promise<Cart> {
    const res = await fetch(`${API_BASE}/cart/items`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    if (!res.ok) throw new Error('Failed to add item to cart');
    return res.json();
  },

  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: getAuthHeader(),
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) throw new Error('Failed to update cart');
    return res.json();
  },

  async removeCartItem(itemId: string): Promise<Cart> {
    const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to remove cart item');
    return res.json();
  },

  // Checkout & Orders
  async estimateCheckout(items: { product_id: string; quantity: number }[]): Promise<any> {
    const res = await fetch(`${API_BASE}/orders/estimate`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error('Failed to estimate checkout');
    return res.json();
  },

  async createOrder(payload: {
    customer_name: string;
    customer_email: string;
    shipping_address: Record<string, any>;
    payment_method: string;
    items: { product_id: string; quantity: number }[];
    scenario?: string;
  }): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create order');
    }
    return res.json();
  },

  async getOrderDetail(idOrNumber: string): Promise<OrderDetailData> {
    const res = await fetch(`${API_BASE}/orders/${idOrNumber}`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Order not found');
    return res.json();
  },

  async getUserOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch user orders');
    return res.json();
  },

  // Recommendations & Goals
  async getGoalCollection(goal: string): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/recommendations/goals/${goal}`);
    if (!res.ok) throw new Error('Failed to fetch goal collection');
    return res.json();
  },

  async getTrending(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/recommendations/trending`);
    if (!res.ok) throw new Error('Failed to fetch trending');
    return res.json();
  },

  async getMySpace(): Promise<any> {
    const res = await fetch(`${API_BASE}/recommendations/my-space`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch My Space');
    return res.json();
  },

  // Reviews
  async getReviews(productId: string): Promise<Review[]> {
    const res = await fetch(`${API_BASE}/reviews/products/${productId}`);
    if (!res.ok) return [];
    return res.json();
  },

  async addReview(productId: string, data: { rating: number; title: string; comment: string }): Promise<Review> {
    const res = await fetch(`${API_BASE}/reviews/products/${productId}`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return res.json();
  },

  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('storesting_auth_token', data.access_token);
    return data;
  },

  async register(email: string, password: string, full_name: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    const data = await res.json();
    localStorage.setItem('storesting_auth_token', data.access_token);
    return data;
  },

  async getMe(): Promise<User | null> {
    const token = localStorage.getItem('storesting_auth_token');
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        localStorage.removeItem('storesting_auth_token');
        return null;
      }
      return res.json();
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem('storesting_auth_token');
  },

  // Admin / Operations
  async getAdminMetrics(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/metrics`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch operations metrics');
    return res.json();
  },

  async getRunEvents(runId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/runs/${runId}/events`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to fetch run events');
    return res.json();
  },

  async triggerSimulation(orderId: string, scenario: string, seed = 42): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/simulate?order_id=${orderId}&scenario=${scenario}&seed=${seed}`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Simulation failed');
    return res.json();
  }
};
