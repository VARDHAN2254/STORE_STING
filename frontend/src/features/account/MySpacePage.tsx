import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Heart, RefreshCw, User as UserIcon, LogOut, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Order, Product } from '../../types';
import { api } from '../../services/api';
import { ProductCard } from '../../components/common/ProductCard';

export const MySpacePage: React.FC = () => {
  const { user, logout, setIsAuthModalOpen } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [mySpaceData, setMySpaceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    Promise.all([
      api.getUserOrders(),
      api.getMySpace(),
    ])
      .then(([ords, space]) => {
        setOrders(ords);
        setMySpaceData(space);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-3xl bg-mist flex items-center justify-center text-ink-muted mx-auto mb-4">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="font-display font-extrabold text-2xl text-ink">Sign in to your Personal Space</h2>
        <p className="text-xs text-ink-muted mt-2 max-w-sm mx-auto">
          Access your orders, saved collections, live tracking telemetry, and personalized recommendations.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="mt-6 px-6 py-2.5 rounded-full bg-ink text-surface text-xs font-semibold hover:bg-ink-light"
        >
          Sign In / Create Account
        </button>
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Profile Header */}
      <div className="bg-surface border border-ink-border/60 rounded-3xl p-6 sm:p-8 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-sage-light text-ink flex items-center justify-center font-display font-black text-2xl">
            {user.full_name[0]}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-ink">
                {user.full_name}
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-mint-light text-ink border border-mint">
                2050 Member
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              {user.email} • Default Currency: INR (₹)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin"
            className="px-4 py-2 rounded-xl bg-mist hover:bg-pearl text-xs font-semibold text-ink border border-ink-border/60 transition-colors"
          >
            Operations Portal
          </Link>
          <button
            onClick={logout}
            className="p-2 rounded-xl hover:bg-coral-light/50 text-ink-muted hover:text-coral-dark transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-ink" />
            <h2 className="font-display font-extrabold text-xl text-ink">Your Orders & Deliveries</h2>
          </div>
          <span className="text-xs text-ink-muted font-bold">{orders.length} Total</span>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center bg-surface border border-ink-border/50 rounded-3xl">
            <p className="text-xs text-ink-muted">No orders placed yet.</p>
            <Link to="/discover" className="mt-3 inline-block text-xs font-bold text-mint-dark underline">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-5 bg-surface border border-ink-border/60 rounded-3xl shadow-soft-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-display font-extrabold text-base text-ink">
                        ORDER #{ord.order_number}
                      </span>
                      <span className="text-[11px] text-ink-muted block mt-0.5">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-mint-light text-ink border border-mint">
                      {ord.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-ink-muted">
                    <span>Payment: <strong className="text-ink">{ord.payment_method}</strong></span>
                    <span className="mx-2">•</span>
                    <span>Carrier: <strong className="text-ink">{ord.shipping_partner || 'Assigned'}</strong></span>
                  </div>
                </div>

                <div className="pt-3 border-t border-ink-border/40 flex items-center justify-between">
                  <span className="font-display font-black text-base text-ink">
                    {formatPrice(ord.total)}
                  </span>
                  <Link
                    to={`/orders/${ord.id}`}
                    className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-ink text-surface text-xs font-semibold hover:bg-ink-light"
                  >
                    <span>Track Live</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buy Again / Recommended for You */}
      {mySpaceData?.curated_for_you && mySpaceData.curated_for_you.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-mint-dark" />
            <h2 className="font-display font-extrabold text-xl text-ink">Curated for Your Space</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mySpaceData.curated_for_you.map((p: Product) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
