import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { ProductCard } from '../../components/common/ProductCard';
import { IntelligentSearchBar } from '../../components/common/IntelligentSearchBar';
import { SearchResponse } from '../../types';
import { api } from '../../services/api';

export const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!query) return;
    setIsLoading(true);
    api.searchProducts(query)
      .then(setSearchData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Search Header */}
      <div className="space-y-4">
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <div className="max-w-3xl">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-ink">
            Intelligent Search Results
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Interpreted criteria based on budget constraints, use-cases, and hardware intent.
          </p>
        </div>

        <div className="max-w-2xl pt-2">
          <IntelligentSearchBar initialQuery={query} />
        </div>
      </div>

      {/* Interpreted Criteria Card */}
      {searchData && searchData.interpreted_criteria && (
        <div className="p-4 sm:p-5 bg-surface border border-ink-border/70 rounded-3xl shadow-soft-sm flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-ink pr-3 border-r border-ink-border/50">
            <Sparkles className="w-4 h-4 text-mint-dark" />
            <span>Interpreted Intent:</span>
          </div>

          {searchData.interpreted_criteria.max_budget && (
            <div className="px-3 py-1 rounded-full bg-mist text-ink text-xs font-semibold flex items-center space-x-1">
              <span>Budget:</span>
              <span className="font-bold">≤ ₹{parseFloat(searchData.interpreted_criteria.max_budget).toLocaleString('en-IN')}</span>
            </div>
          )}

          {searchData.interpreted_criteria.category_hints?.map((cat, i) => (
            <div key={i} className="px-3 py-1 rounded-full bg-mist text-ink text-xs font-semibold flex items-center space-x-1">
              <span>Category:</span>
              <span className="font-bold capitalize">{cat}</span>
            </div>
          ))}

          {searchData.interpreted_criteria.intent_tags?.map((tag, i) => (
            <div key={i} className="px-3 py-1 rounded-full bg-mint-light text-ink text-xs font-semibold flex items-center space-x-1">
              <span>Target:</span>
              <span className="font-bold capitalize">{tag}</span>
            </div>
          ))}
        </div>
      )}

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-80 bg-mist/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (!searchData || searchData.results.length === 0) ? (
        <div className="text-center py-20 bg-surface border border-ink-border/50 rounded-3xl">
          <p className="font-display font-bold text-lg text-ink">No exact matches found for "{query}"</p>
          <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
            Try phrasing your request differently, e.g., "laptop for coding under ₹70,000" or "spatial earbuds".
          </p>
          <Link
            to="/discover"
            className="mt-4 inline-block px-5 py-2 rounded-full bg-ink text-surface text-xs font-semibold"
          >
            Browse All Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-bold text-ink-muted">
            Found {searchData.results.length} matches ranked by semantic relevance
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {searchData.results.map((res) => (
              <ProductCard
                key={res.product.id}
                product={res.product}
                matchScore={res.match_percentage}
                matchReason={res.match_reasons[0]}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
