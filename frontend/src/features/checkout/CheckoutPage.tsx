import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, ArrowLeft, Check, CreditCard, Smartphone, Wallet, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();

  // Steps: 1: Delivery, 2: Payment, 3: Review
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Delivery Form State
  const [customerName, setCustomerName] = useState(user?.full_name || 'Alex Mercer');
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'alex@storesting.com');
  const [street, setStreet] = useState('742 Innovation Way, Indiranagar');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('560038');
  const [phone, setPhone] = useState('+91 98765 43210');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Wallet' | 'COD'>('UPI');
  const [upiId, setUpiId] = useState('alex@oksbi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h2 className="font-display font-bold text-2xl text-ink">Your cart is empty</h2>
        <p className="text-xs text-ink-muted mt-2">Add items to your cart before proceeding to checkout.</p>
        <Link to="/discover" className="mt-6 inline-block px-6 py-2.5 rounded-full bg-ink text-surface text-xs font-semibold">
          Discover Catalog
        </Link>
      </div>
    );
  }

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handlePlaceOrder = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const payload = {
        customer_name: customerName,
        customer_email: customerEmail,
        shipping_address: {
          street,
          city,
          state,
          postal_code: postalCode,
          phone,
          country: 'India',
        },
        payment_method: paymentMethod,
        items: cart.items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        scenario: 'SUCCESS',
      };

      const order = await api.createOrder(payload);
      await refreshCart();
      // Navigate to real-time order tracking page
      navigate(`/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to complete order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Checkout Progress Stepper */}
      <div className="flex items-center justify-between max-w-xl mx-auto">
        {[
          { num: 1, title: 'Delivery' },
          { num: 2, title: 'Payment' },
          { num: 3, title: 'Review' },
        ].map((s) => (
          <div key={s.num} className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                step >= s.num
                  ? 'bg-ink text-surface'
                  : 'bg-mist text-ink-muted border border-ink-border'
              }`}
            >
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-xs font-semibold ${step >= s.num ? 'text-ink' : 'text-ink-muted'}`}>
              {s.title}
            </span>
            {s.num < 3 && <div className="w-12 h-0.5 bg-ink-border/70 hidden sm:block" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-coral-light/60 border border-coral text-coral-dark rounded-2xl text-xs font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Step Form (8 cols) */}
        <div className="lg:col-span-8 bg-surface border border-ink-border/60 rounded-3xl p-6 sm:p-8 shadow-soft-sm">
          
          {/* STEP 1: DELIVERY */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="font-display font-extrabold text-xl text-ink">
                Shipping & Contact Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">Recipient Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-mist border border-ink-border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">Email Address (Order Updates)</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-mist border border-ink-border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Street Address</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-mist border border-ink-border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-mist border border-ink-border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-mist border border-ink-border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">Postal PIN</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-mist border border-ink-border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Phone for Delivery Telemetry</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-mist border border-ink-border rounded-xl"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-full bg-ink text-surface text-xs font-semibold hover:bg-ink-light flex items-center space-x-2"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-extrabold text-xl text-ink">
                  Payment Method Selection
                </h3>
                <span className="text-[11px] text-mint-dark font-bold">Encrypted Simulation</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: <Smartphone className="w-4 h-4" /> },
                  { id: 'Card', label: 'Credit Card', icon: <CreditCard className="w-4 h-4" /> },
                  { id: 'Wallet', label: 'Neural Wallet', icon: <Wallet className="w-4 h-4" /> },
                  { id: 'COD', label: 'Pay on Delivery', icon: <Truck className="w-4 h-4" /> },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center space-y-2 text-xs font-bold transition-all ${
                      paymentMethod === m.id
                        ? 'bg-mint-light border-mint-dark text-ink shadow-sm'
                        : 'bg-mist border-ink-border/60 text-ink-muted hover:text-ink'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'UPI' && (
                <div className="p-4 bg-mist rounded-2xl border border-ink-border/50">
                  <label className="block text-xs font-bold text-ink mb-1.5">UPI ID (VPA)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@bank"
                    className="w-full px-4 py-2.5 text-xs bg-surface border border-ink-border rounded-xl font-semibold text-ink"
                  />
                  <p className="text-[11px] text-ink-muted mt-1.5">Fast instant authorization without OTP delay.</p>
                </div>
              )}

              {paymentMethod === 'Card' && (
                <div className="p-4 bg-mist rounded-2xl border border-ink-border/50 space-y-3">
                  <p className="text-xs text-ink-muted">Simulated PCI tokenized card authorization</p>
                  <input
                    type="text"
                    disabled
                    value="•••• •••• •••• 2050 (Quantum Shield Card)"
                    className="w-full px-4 py-2.5 text-xs bg-surface border border-ink-border rounded-xl font-semibold text-ink"
                  />
                </div>
              )}

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-ink-muted hover:text-ink flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-full bg-ink text-surface text-xs font-semibold hover:bg-ink-light flex items-center space-x-2"
                >
                  <span>Review Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & CONFIRM */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="font-display font-extrabold text-xl text-ink">
                Final Order Review
              </h3>

              <div className="p-4 bg-mist rounded-2xl border border-ink-border/50 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-ink">Recipient:</span>
                  <span className="text-ink-muted">{customerName} ({customerEmail})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-ink">Destination:</span>
                  <span className="text-ink-muted">{street}, {city}, {postalCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-ink">Payment via:</span>
                  <span className="text-ink font-semibold">{paymentMethod}</span>
                </div>
              </div>

              {/* Items summary */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block">
                  Items to be Dispatched:
                </span>
                {cart.items.map((i) => (
                  <div key={i.id} className="flex items-center justify-between text-xs py-2 border-b border-ink-border/40">
                    <span className="font-medium text-ink">{i.product.name} (x{i.quantity})</span>
                    <span className="font-bold text-ink">{formatPrice(i.total_price)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-ink-muted hover:text-ink flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Payment</span>
                </button>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="px-8 py-4 rounded-full bg-ink text-surface hover:bg-ink-light font-display font-bold text-sm transition-all shadow-soft flex items-center space-x-2 disabled:opacity-50"
                >
                  <span>{isProcessing ? 'Orchestrating Order Agents...' : `Authorize & Pay ${formatPrice(cart.total)}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Order Summary Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-surface border border-ink-border/60 rounded-3xl p-6 shadow-soft-sm h-fit space-y-4">
          <h4 className="font-display font-bold text-base text-ink">Summary</h4>

          <div className="space-y-2 text-xs text-ink-muted border-b border-ink-border/50 pb-4">
            <div className="flex justify-between">
              <span>Subtotal ({cart.items.length} items)</span>
              <span className="font-semibold text-ink">{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span className="font-semibold text-ink">
                {parseFloat(cart.shipping) === 0 ? <span className="text-mint-dark font-bold">FREE</span> : formatPrice(cart.shipping)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Taxes (Included)</span>
              <span className="font-semibold text-ink">₹0.00</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-ink-border/50 text-base font-extrabold text-ink">
              <span>Total Payable</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
          </div>

          <div className="space-y-2 text-[11px] text-ink-muted">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-mint-dark" />
              <span>Multi-Agent Inventory Lock Guaranteed</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Truck className="w-3.5 h-3.5 text-mint-dark" />
              <span>Real-time SSE Tracking on Placement</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
