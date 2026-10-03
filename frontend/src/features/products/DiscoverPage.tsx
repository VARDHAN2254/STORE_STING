import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, ArrowUpDown, Sparkles, X } from 'lucide-react';
import { ProductCard } from '../../components/common/ProductCard';
import { Product, Category } from '../../types';
import { api } from '../../services/api';

export const DiscoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const goalParam = searchParams.get('goal') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedGoal, setSelectedGoal] = useState(goalParam);
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setSelectedGoal(searchParams.get('goal') || '');
  }, [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const data = await api.getProducts({
          category: selectedCategory || undefined,
          goal: selectedGoal || undefined,
          max_price: priceRange ? Number(priceRange) : undefined,
          sort_by: sortBy,
        });
        setProducts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [selectedCategory, selectedGoal, sortBy, priceRange]);

  const handleCategorySelect = (catSlug: string) => {
    const next = selectedCategory === catSlug ? '' : catSlug;
    setSelectedCategory(next);
    const newParams = new URLSearchParams(searchParams);
    if (next) newParams.set('category', next);
    else newParams.delete('category');
    setSearchParams(newParams);
  };

  const handleGoalSelect = (goal: string) => {
    const next = selectedGoal === goal ? '' : goal;
    setSelectedGoal(next);
    const newParams = new URLSearchParams(searchParams);
    if (next) newParams.set('goal', next);
    else newParams.delete('goal');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedGoal('');
    setPriceRange('');
    setSortBy('featured');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-ink">
          Discover Catalog
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted mt-1">
          Explore refined hardware, workspaces, and lifestyle technology built for 2050.
        </p>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-surface border border-ink-border/60 rounded-3xl p-5 mb-8 shadow-soft-sm space-y-4">
        
        {/* Categories Pills */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block mb-2">
            Categories:
          </span>
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => handleCategorySelect('')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === ''
                  ? 'bg-ink text-surface'
                  : 'bg-mist text-ink hover:bg-pearl'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCategorySelect(c.slug)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === c.slug
                    ? 'bg-ink text-surface'
                    : 'bg-mist text-ink hover:bg-pearl'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Goal Tags */}
        <div className="pt-2 border-t border-ink-border/40">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block mb-2">
            Goal Collections:
          </span>
          <div className="flex items-center flex-wrap gap-2">
            {['workspace', 'creators', 'students', 'gamers', 'travel'].map((g) => (
              <button
                key={g}
                onClick={() => handleGoalSelect(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedGoal === g
                    ? 'bg-mint text-ink font-bold border border-mint-dark'
                    : 'bg-surface border border-ink-border/70 text-ink-muted hover:text-ink'
                }`}
              >
                ✦ For {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Sort and Price Controls */}
        <div className="pt-2 border-t border-ink-border/40 flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-ink-muted" />
              <span className="text-ink-muted">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-mist px-3 py-1.5 rounded-xl border border-ink-border/70 font-semibold text-ink focus:outline-none"
              >
                <option value="featured">Featured & Curated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-ink-muted">Max Budget:</span>
              <input
                type="number"
                placeholder="e.g. 70000"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value ? Number(e.target.value) : '')}
                className="w-28 bg-mist px-3 py-1.5 rounded-xl border border-ink-border/70 font-semibold text-ink focus:outline-none text-xs"
              />
            </div>
          </div>

          {(selectedCategory || selectedGoal || priceRange || sortBy !== 'featured') && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-coral-dark hover:underline flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset all filters</span>
            </button>
          )}
        </div>

      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-80 bg-mist/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-ink-border/50 rounded-3xl">
          <p className="font-display font-bold text-lg text-ink">No matching products found</p>
          <p className="text-xs text-ink-muted mt-1">Try adjusting your filters or search criteria.</p>
          <button
            onClick={clearFilters}
            className="mt-4 px-5 py-2 rounded-full bg-ink text-surface text-xs font-semibold"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div>
          <div className="text-xs text-ink-muted font-semibold mb-4">
            Showing {products.length} products
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
