import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User as UserIcon, Sparkles, Scale, Menu, X, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { itemCount, setIsCartOpen } = useCart();
  const { user, setIsAuthModalOpen, logout } = useAuth();
  const { compareList, setIsCompareDrawerOpen } = useCompare();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(quickQuery)}`);
      setQuickQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-ink-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-2xl bg-mist border border-sage/60 flex items-center justify-center shadow-soft-sm group-hover:scale-105 transition-transform duration-200">
                <span className="font-display font-black text-xl text-ink">S</span>
                <span className="w-1.5 h-1.5 rounded-full bg-mint absolute top-2 right-2 animate-pulse-subtle"></span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-xl tracking-tight text-ink group-hover:text-ink/80 transition-colors">
                  STORE STING
                </span>
                <span className="text-[10px] tracking-widest uppercase font-medium text-ink-muted -mt-1">
                  Shopping, reimagined.
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-ink-muted">
              <Link to="/discover" className="hover:text-ink transition-colors">
                Discover
              </Link>
              <Link to="/discover?goal=workspace" className="hover:text-ink transition-colors flex items-center space-x-1">
                <span>Workspace</span>
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-mint-light text-ink rounded-full">2050</span>
              </Link>
              <Link to="/discover?goal=creators" className="hover:text-ink transition-colors">
                Creators
              </Link>
              <Link to="/discover?goal=students" className="hover:text-ink transition-colors">
                Students
              </Link>
              <Link to="/admin" className="text-xs px-2.5 py-1 rounded-full bg-mist border border-ink-border text-ink hover:bg-pearl transition-colors">
                Operations
              </Link>
            </nav>
          </div>

          {/* Quick Natural Language Search Pill */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleQuickSearch} className="w-full relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-ink-muted absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ask anything (e.g. laptop for coding under ₹70,000)..."
                  value={quickQuery}
                  onChange={(e) => setQuickQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-surface border border-ink-border/70 rounded-full focus:outline-none focus:ring-2 focus:ring-mint focus:border-transparent transition-all shadow-soft-sm"
                />
                {quickQuery && (
                  <button type="submit" className="absolute right-2.5 p-1 rounded-full bg-ink text-surface hover:bg-ink-light">
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Compare Badge Button */}
            {compareList.length > 0 && (
              <button
                onClick={() => setIsCompareDrawerOpen(true)}
                className="relative p-2.5 rounded-full hover:bg-mist transition-colors text-ink"
                title="Compare Products"
              >
                <Scale className="w-5 h-5 text-ink" />
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-lime text-ink text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {compareList.length}
                </span>
              </button>
            )}

            {/* User / My Space */}
            {user ? (
              <div className="relative group">
                <Link
                  to="/my-space"
                  className="flex items-center space-x-2 p-1.5 pl-3 rounded-full hover:bg-mist border border-ink-border/60 transition-colors"
                >
                  <span className="text-xs font-semibold text-ink max-w-[90px] truncate">
                    {user.full_name.split(' ')[0]}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-sage-light flex items-center justify-center text-ink text-xs font-bold">
                    {user.full_name[0]}
                  </div>
                </Link>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs font-semibold px-4 py-2 rounded-full border border-ink-border/70 hover:bg-mist transition-colors flex items-center space-x-1.5"
              >
                <UserIcon className="w-3.5 h-3.5 text-ink-muted" />
                <span>Sign in</span>
              </button>
            )}

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full bg-ink text-surface hover:bg-ink-light transition-all shadow-soft flex items-center justify-center group"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-mint text-ink text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 md:hidden rounded-lg hover:bg-mist text-ink"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-ink-border/50 space-y-3">
            <form onSubmit={handleQuickSearch} className="mb-4">
              <input
                type="text"
                placeholder="Ask e.g. laptop for coding..."
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-surface border border-ink-border rounded-full"
              />
            </form>
            <div className="flex flex-col space-y-2 text-sm font-medium">
              <Link to="/discover" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-mist">
                Discover All
              </Link>
              <Link to="/discover?goal=workspace" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-mist">
                Workspace 2050
              </Link>
              <Link to="/discover?goal=creators" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-mist">
                Creator Setups
              </Link>
              <Link to="/discover?goal=students" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-mist">
                Student Tech
              </Link>
              <Link to="/my-space" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-mist">
                My Space & Orders
              </Link>
              <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="py-2 px-3 rounded-lg bg-mist text-xs font-semibold">
                Operations & Simulation Engine
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
