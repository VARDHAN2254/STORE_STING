import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeItem, addItem, isLoading } = useCart();

  if (!isCartOpen) return null;

  const subtotalNum = cart ? parseFloat(cart.subtotal) : 0;
  const freeShippingThreshold = 20000;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotalNum);
  const freeShippingProgress = Math.min(100, (subtotalNum / freeShippingThreshold) * 100);

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-ink-border shadow-soft-float flex flex-col justify-between">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-ink-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <ShoppingBag className="w-5 h-5 text-ink" />
                <h3 className="font-display font-extrabold text-xl text-ink">Your Cart</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-mist text-ink-muted font-bold">
                  {cart?.items.length || 0}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full hover:bg-mist text-ink-muted hover:text-ink transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress Indicator */}
            <div className="mt-4 p-3 bg-mist/70 rounded-2xl border border-ink-border/40">
              <div className="flex items-center justify-between text-xs font-semibold text-ink mb-1.5">
                <span>{freeShippingRemaining === 0 ? '✨ Free Express Delivery Unlocked!' : `Add ${formatPrice(freeShippingRemaining)} for Free Delivery`}</span>
                <span className="text-[10px] text-ink-muted">{Math.round(freeShippingProgress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-pearl rounded-full overflow-hidden">
                <div
                  className="h-full bg-mint transition-all duration-300 rounded-full"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Items Scrollable List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {(!cart || cart.items.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-3xl bg-mist flex items-center justify-center text-ink-muted mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-display font-bold text-lg text-ink">Your cart is empty</h4>
                <p className="text-xs text-ink-muted mt-1 max-w-xs">
                  Discover refined technology, curated workspaces, and lifestyle essentials.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/discover');
                  }}
                  className="mt-6 px-6 py-2.5 rounded-full bg-ink text-surface text-xs font-semibold hover:bg-ink-light transition-colors"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-mist/40 border border-ink-border/50 rounded-2xl flex items-center space-x-3.5"
                    >
                      <img
                        src={item.product.images?.[0]?.url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=200&q=80'}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-xl bg-pearl shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product.slug || item.product.id}`}
                          onClick={() => setIsCartOpen(false)}
                          className="font-display font-bold text-sm text-ink hover:underline truncate block"
                        >
                          {item.product.name}
                        </Link>
                        <div className="text-xs font-semibold text-ink mt-0.5">
                          {formatPrice(item.unit_price)}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2 bg-surface border border-ink-border/60 rounded-lg px-2 py-0.5">
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateQuantity(item.id, item.quantity - 1);
                                } else {
                                  removeItem(item.id);
                                }
                              }}
                              className="text-ink-muted hover:text-ink p-0.5"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-ink w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="text-ink-muted hover:text-ink p-0.5"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-ink-muted hover:text-coral-dark p-1 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Complete Your Setup Recommendations (Non-aggressive upsell) */}
                {cart.setup_suggestions && cart.setup_suggestions.length > 0 && (
                  <div className="pt-4 border-t border-ink-border/40">
                    <div className="flex items-center space-x-1.5 mb-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-mint-dark" />
                      <h5 className="text-xs font-bold text-ink uppercase tracking-wider">
                        Complete your setup
                      </h5>
                    </div>
                    <div className="space-y-2">
                      {cart.setup_suggestions.slice(0, 2).map((sugg) => (
                        <div
                          key={sugg.id}
                          className="p-2.5 bg-surface border border-ink-border/40 rounded-xl flex items-center justify-between space-x-3"
                        >
                          <img
                            src={sugg.images?.[0]?.url || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=100&q=80'}
                            alt={sugg.name}
                            className="w-10 h-10 object-cover rounded-lg bg-pearl shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-ink line-clamp-1">{sugg.name}</span>
                            <span className="text-[11px] text-ink-muted font-bold">{formatPrice(sugg.discounted_price)}</span>
                          </div>
                          <button
                            onClick={() => addItem(sugg.id, 1)}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-mist hover:bg-ink hover:text-surface transition-colors shrink-0"
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Drawer Footer with Financial Summary */}
          {cart && cart.items.length > 0 && (
            <div className="p-6 border-t border-ink-border bg-surface space-y-3.5">
              <div className="space-y-1.5 text-xs text-ink-muted">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink">{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-ink">
                    {parseFloat(cart.shipping) === 0 ? <span className="text-mint-dark font-bold">FREE</span> : formatPrice(cart.shipping)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-ink-border/50 text-base font-extrabold text-ink">
                  <span>Total</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-ink text-surface hover:bg-ink-light font-display font-bold text-sm transition-all shadow-soft flex items-center justify-center space-x-2 active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-ink-muted text-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-mint-dark" />
                <span>Encrypted checkout • Multi-agent verification</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
