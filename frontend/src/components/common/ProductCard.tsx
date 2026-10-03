import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Scale, Check } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useCompare } from '../../context/CompareContext';

interface ProductCardProps {
  product: Product;
  matchScore?: number;
  matchReason?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, matchScore, matchReason }) => {
  const { addItem, isLoading } = useCart();
  const { addToCompare, isInCompare, removeFromCompare } = useCompare();

  const primaryImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
  const inCompare = isInCompare(product.id);

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="group relative bg-surface border border-ink-border/60 rounded-3xl p-4 card-hover flex flex-col justify-between">
      
      {/* Top Media & Badges Container */}
      <div className="relative">
        <Link to={`/products/${product.slug || product.id}`} className="block overflow-hidden rounded-2xl bg-mist aspect-[4/3]">
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        </Link>

        {/* Dynamic Contextual Match Badge / Recommendation */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          {matchScore ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-mint text-ink shadow-sm">
              ✦ {matchScore}% Match
            </span>
          ) : product.badges?.[0] ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface/90 backdrop-blur-md border border-ink-border/50 text-ink shadow-sm">
              ✦ {product.badges[0]}
            </span>
          ) : null}

          {matchReason && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-mist/95 text-ink-muted border border-ink-border/40">
              {matchReason}
            </span>
          )}
        </div>

        {/* Compare Quick Toggle Action */}
        <button
          onClick={(e) => {
            e.preventDefault();
            if (inCompare) {
              removeFromCompare(product.id);
            } else {
              addToCompare(product);
            }
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
            inCompare
              ? 'bg-ink text-surface shadow-sm'
              : 'bg-surface/80 text-ink hover:bg-surface border border-ink-border/50 opacity-0 group-hover:opacity-100'
          }`}
          title={inCompare ? "Remove from comparison" : "Add to comparison"}
        >
          {inCompare ? <Check className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Product Content Details */}
      <div className="pt-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Stock Pill */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-ink-muted uppercase tracking-wider text-[10px]">
              {product.brand}
            </span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                product.stock_status === 'In Stock'
                  ? 'bg-sage-light/60 text-ink'
                  : product.stock_status === 'Low Stock'
                  ? 'bg-coral-light/70 text-coral-dark'
                  : 'bg-pearl text-ink-muted'
              }`}
            >
              {product.stock_status}
            </span>
          </div>

          {/* Product Name */}
          <Link
            to={`/products/${product.slug || product.id}`}
            className="font-display font-bold text-base text-ink line-clamp-1 group-hover:text-ink/80 transition-colors"
          >
            {product.name}
          </Link>

          {/* Rating */}
          <div className="flex items-center space-x-1.5 mt-1.5">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-bold text-ink">{product.rating}</span>
            <span className="text-xs text-ink-muted">({product.review_count})</span>
          </div>

          {/* Important Specifications Chips */}
          {product.best_for && (
            <p className="text-[11px] text-ink-muted line-clamp-1 mt-2 font-medium">
              Best for: {product.best_for}
            </p>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="pt-4 mt-3 border-t border-ink-border/40 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline space-x-2">
              <span className="font-display font-extrabold text-lg text-ink">
                {formatPrice(product.discounted_price)}
              </span>
              {product.discount_percent > 0 && (
                <span className="text-xs text-ink-muted line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            {product.discount_percent > 0 && (
              <span className="text-[10px] font-bold text-mint-dark">
                Save {product.discount_percent}%
              </span>
            )}
          </div>

          <button
            onClick={() => addItem(product.id, 1)}
            disabled={isLoading || product.stock_status === 'Out of Stock'}
            className="px-3.5 py-2 rounded-xl bg-mist hover:bg-ink hover:text-surface text-ink text-xs font-semibold transition-all duration-200 flex items-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none active:scale-95"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

      </div>

    </div>
  );
};
