import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, ShoppingBag, Package, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const { itemCount, setIsCartOpen } = useCart();
  const { user, setIsAuthModalOpen } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-ink-border/70 py-2.5 px-6 shadow-soft-float">
      <div className="flex items-center justify-between">
        
        <Link
          to="/"
          className={`flex flex-col items-center space-y-1 text-[11px] font-medium transition-colors ${
            isActive('/') ? 'text-ink font-bold' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        <Link
          to="/discover"
          className={`flex flex-col items-center space-y-1 text-[11px] font-medium transition-colors ${
            isActive('/discover') ? 'text-ink font-bold' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Discover</span>
        </Link>

        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center space-y-1 text-[11px] font-medium text-ink-muted hover:text-ink relative"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-mint text-ink text-[10px] font-extrabold rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </button>

        <Link
          to="/my-space"
          className={`flex flex-col items-center space-y-1 text-[11px] font-medium transition-colors ${
            isActive('/my-space') ? 'text-ink font-bold' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Package className="w-5 h-5" />
          <span>Orders</span>
        </Link>

        <button
          onClick={() => {
            if (user) {
              window.location.href = '/my-space';
            } else {
              setIsAuthModalOpen(true);
            }
          }}
          className={`flex flex-col items-center space-y-1 text-[11px] font-medium text-ink-muted hover:text-ink`}
        >
          <User className="w-5 h-5" />
          <span>{user ? 'Account' : 'Sign In'}</span>
        </button>

      </div>
    </div>
  );
};
