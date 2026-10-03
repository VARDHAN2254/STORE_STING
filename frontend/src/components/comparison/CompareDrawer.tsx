import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, Scale, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';

export const CompareDrawer: React.FC = () => {
  const { compareList, isCompareDrawerOpen, setIsCompareDrawerOpen, removeFromCompare, clearCompare } = useCompare();
  const { addItem } = useCart();
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isCompareDrawerOpen && compareList.length >= 2) {
      setIsLoading(true);
      api.compareProducts(compareList.map(p => p.id))
        .then(data => setComparisonData(data))
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    } else {
      setComparisonData(null);
    }
  }, [isCompareDrawerOpen, compareList]);

  if (!isCompareDrawerOpen) return null;

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCompareDrawerOpen(false)}
      />

      <div className="fixed inset-x-0 bottom-0 max-h-[85vh] flex flex-col bg-surface border-t border-ink-border shadow-soft-float rounded-t-3xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-ink-border/60 flex items-center justify-between max-w-7xl w-full mx-auto">
          <div className="flex items-center space-x-3">
            <Scale className="w-5 h-5 text-ink" />
            <div>
              <h3 className="font-display font-extrabold text-lg text-ink">
                Intelligent Product Comparison
              </h3>
              <p className="text-xs text-ink-muted">
                Factual attributes, measurable metrics, and spec breakdowns
              </p>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-mist font-bold text-ink">
              {compareList.length} of 4 Selected
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={clearCompare}
              className="text-xs font-semibold text-ink-muted hover:text-coral-dark transition-colors"
            >
              Clear all
            </button>
            <button
              onClick={() => setIsCompareDrawerOpen(false)}
              className="p-2 rounded-full hover:bg-mist text-ink"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
          {compareList.length < 2 ? (
            <div className="py-12 text-center">
              <Scale className="w-10 h-10 text-ink-muted mx-auto mb-3" />
              <p className="text-sm font-semibold text-ink">Select at least 2 products to compare</p>
              <p className="text-xs text-ink-muted mt-1">Browse the catalog and click the scale icon on any card.</p>
            </div>
          ) : isLoading ? (
            <div className="py-16 text-center text-xs font-semibold text-ink-muted animate-pulse">
              Computing factual comparison metrics...
            </div>
          ) : (
            <div className="overflow-x-auto pb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-w-[650px]">
                {compareList.map((prod) => {
                  const compItem = comparisonData?.items?.find((i: any) => i.product.id === prod.id);

                  return (
                    <div
                      key={prod.id}
                      className="bg-mist/30 border border-ink-border/60 rounded-2xl p-4 flex flex-col justify-between space-y-4"
                    >
                      {/* Product Media & Name */}
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                            {prod.brand}
                          </span>
                          <button
                            onClick={() => removeFromCompare(prod.id)}
                            className="text-ink-muted hover:text-coral-dark p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <img
                          src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&q=80'}
                          alt={prod.name}
                          className="w-full h-32 object-cover rounded-xl bg-pearl mb-3"
                        />

                        <h4 className="font-display font-bold text-sm text-ink line-clamp-2">
                          {prod.name}
                        </h4>

                        {/* Factual Highlight Tag */}
                        {compItem?.highlight && (
                          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-mint-light text-ink border border-mint">
                            ★ {compItem.highlight}
                          </div>
                        )}
                      </div>

                      {/* Specs Matrix */}
                      <div className="space-y-2 text-xs border-t border-b border-ink-border/50 py-3">
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Price</span>
                          <span className="font-extrabold text-ink">{formatPrice(prod.discounted_price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Rating</span>
                          <span className="font-bold text-ink">{prod.rating}★ ({prod.review_count})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-muted">Availability</span>
                          <span className="font-medium text-ink">{prod.stock_status}</span>
                        </div>
                        {prod.best_for && (
                          <div className="pt-1">
                            <span className="text-[10px] font-semibold text-ink-muted block uppercase">Best For:</span>
                            <span className="text-[11px] font-medium text-ink">{prod.best_for}</span>
                          </div>
                        )}
                      </div>

                      {/* Add to Cart button */}
                      <button
                        onClick={() => addItem(prod.id, 1)}
                        className="w-full py-2.5 rounded-xl bg-ink text-surface hover:bg-ink-light text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
