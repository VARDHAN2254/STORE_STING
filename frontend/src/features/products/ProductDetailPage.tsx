import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star, ShoppingBag, ShieldCheck, Truck, RotateCcw,
  Scale, Check, Sparkles, ThumbsUp, ArrowLeft
} from 'lucide-react';
import { ProductDetail, Review } from '../../types';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useCompare } from '../../context/CompareContext';
import { useAuth } from '../../context/AuthContext';

export const ProductDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { addItem, isLoading: isCartLoading } = useCart();
  const { addToCompare, isInCompare, removeFromCompare } = useCompare();
  const { user, setIsAuthModalOpen } = useAuth();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Review submission state
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!idOrSlug) return;
    setIsLoading(true);
    api.getProductDetail(idOrSlug)
      .then((data) => {
        setProduct(data);
        return api.getReviews(data.id);
      })
      .then(setReviews)
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [idOrSlug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse space-y-8">
        <div className="h-6 w-32 bg-mist rounded-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="h-96 bg-mist rounded-3xl" />
          <div className="space-y-4">
            <div className="h-10 bg-mist rounded-2xl w-3/4" />
            <div className="h-6 bg-mist rounded-xl w-1/4" />
            <div className="h-24 bg-mist rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display font-bold text-2xl text-ink">Product not found</h2>
        <Link to="/discover" className="mt-4 inline-block text-xs font-semibold text-mint-dark underline">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const inCompare = isInCompare(product.id);

  const formatPrice = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleBuyNow = async () => {
    await addItem(product.id, quantity);
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      setIsSubmittingReview(true);
      const rev = await api.addReview(product.id, {
        rating: newRating,
        title: newTitle,
        comment: newComment,
      });
      setReviews([rev, ...reviews]);
      setNewTitle('');
      setNewComment('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to search & catalog</span>
      </button>

      {/* Hero Section: Gallery & Purchase Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface border border-ink-border/70 rounded-3xl p-4 overflow-hidden aspect-[4/3] flex items-center justify-center relative shadow-soft-sm">
            <img
              src={product.images[selectedImageIndex]?.url || product.images[0]?.url}
              alt={product.name}
              className="w-full h-full object-cover rounded-2xl"
            />
            {product.badges?.[0] && (
              <div className="absolute top-6 left-6 px-3 py-1 rounded-full bg-surface/90 backdrop-blur-md border border-ink-border text-xs font-bold text-ink shadow-sm">
                ✦ {product.badges[0]}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center space-x-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all p-1 bg-surface ${
                    selectedImageIndex === idx ? 'border-ink shadow-sm' : 'border-ink-border/50 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover rounded-xl" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Purchase Controls & Highlights (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-widest text-ink-muted">
                {product.brand}
              </span>
              <span
                className={`px-3 py-0.5 rounded-full font-bold text-xs ${
                  product.stock_status === 'In Stock'
                    ? 'bg-sage-light text-ink'
                    : 'bg-coral-light text-coral-dark'
                }`}
              >
                {product.stock_status}
              </span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <span className="text-sm font-bold text-ink">{product.rating}</span>
              <span className="text-xs text-ink-muted">({product.review_count} verified reviews)</span>
            </div>

            {/* Price display */}
            <div className="pt-2 flex items-baseline space-x-3">
              <span className="font-display font-black text-3xl sm:text-4xl text-ink">
                {formatPrice(product.discounted_price)}
              </span>
              {product.discount_percent > 0 && (
                <span className="text-base text-ink-muted line-through font-semibold">
                  {formatPrice(product.price)}
                </span>
              )}
              {product.discount_percent > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-mint-light text-mint-dark text-xs font-bold">
                  {product.discount_percent}% OFF
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed font-normal pt-2">
              {product.description}
            </p>

            {/* Best For Callout */}
            {product.best_for && (
              <div className="p-3.5 bg-mist/70 border border-ink-border/50 rounded-2xl">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink block mb-0.5">
                  ✦ Ideal match for:
                </span>
                <span className="text-xs font-medium text-ink-muted">
                  {product.best_for}
                </span>
              </div>
            )}
          </div>

          {/* Actions: Add to Cart & Buy Now */}
          <div className="space-y-3 pt-4 border-t border-ink-border/50">
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-mist border border-ink-border/70 rounded-2xl p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-ink font-bold hover:bg-surface rounded-xl transition-colors"
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold text-ink">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-ink font-bold hover:bg-surface rounded-xl transition-colors"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => addItem(product.id, quantity)}
                disabled={isCartLoading || product.stock_status === 'Out of Stock'}
                className="flex-1 py-3.5 rounded-2xl bg-surface border-2 border-ink text-ink hover:bg-mist font-display font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 active:scale-98"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>

            <button
              onClick={handleBuyNow}
              disabled={isCartLoading || product.stock_status === 'Out of Stock'}
              className="w-full py-4 rounded-2xl bg-ink text-surface hover:bg-ink-light font-display font-bold text-xs sm:text-sm transition-all shadow-soft flex items-center justify-center space-x-2 active:scale-98"
            >
              <span>Instant Buy with 1-Click Checkout</span>
            </button>

            {/* Compare Trigger */}
            <button
              onClick={() => {
                if (inCompare) removeFromCompare(product.id);
                else addToCompare(product);
              }}
              className="w-full py-2.5 rounded-2xl text-xs font-semibold text-ink-muted hover:text-ink hover:bg-mist transition-colors flex items-center justify-center space-x-2"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{inCompare ? 'Remove from Comparison Matrix' : 'Add to Comparison Matrix'}</span>
            </button>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-ink-border/40 text-[11px] text-ink-muted text-center">
            <div className="flex flex-col items-center">
              <Truck className="w-4 h-4 text-ink mb-1" />
              <span>Ships in 24h</span>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-4 h-4 text-ink mb-1" />
              <span>2-Yr Warranty</span>
            </div>
            <div className="flex flex-col items-center">
              <RotateCcw className="w-4 h-4 text-ink mb-1" />
              <span>30-Day Returns</span>
            </div>
          </div>

        </div>

      </div>

      {/* Understanding & Specifications Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pt-12 border-t border-ink-border/50">
        
        {/* Features & What's Included */}
        <div className="md:col-span-6 space-y-8">
          <div>
            <h3 className="font-display font-extrabold text-2xl text-ink mb-4">
              Why you'll like it
            </h3>
            <ul className="space-y-3">
              {product.features?.map((feat, i) => (
                <li key={i} className="flex items-start space-x-3 text-xs sm:text-sm text-ink-muted">
                  <span className="p-1 rounded-full bg-mint-light text-ink mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-extrabold text-xl text-ink mb-4">
              What's included in the box
            </h3>
            <div className="p-5 bg-surface border border-ink-border/60 rounded-2xl space-y-2">
              {product.whats_included?.map((inc, i) => (
                <div key={i} className="text-xs text-ink font-medium flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                  <span>{inc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Technical Specs Table */}
        <div className="md:col-span-6">
          <h3 className="font-display font-extrabold text-2xl text-ink mb-4">
            Technical Specifications
          </h3>
          <div className="bg-surface border border-ink-border/60 rounded-3xl overflow-hidden">
            <dl className="divide-y divide-ink-border/40">
              {Object.entries(product.specs || {}).map(([key, val], idx) => (
                <div key={idx} className="px-5 py-3.5 grid grid-cols-3 text-xs">
                  <dt className="font-bold text-ink">{key}</dt>
                  <dd className="col-span-2 text-ink-muted font-medium">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

      </div>

      {/* Customer Reviews Section */}
      <div className="pt-12 border-t border-ink-border/50 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-extrabold text-2xl text-ink">
              Verified Customer Reviews
            </h3>
            <p className="text-xs text-ink-muted mt-1">
              Real feedback from verified purchasers • Authentic hardware telemetry
            </p>
          </div>
        </div>

        {/* Review Submission Form */}
        <div className="p-6 bg-surface border border-ink-border/60 rounded-3xl">
          <h4 className="font-display font-bold text-base text-ink mb-3">Write a Review</h4>
          <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-xl">
            <div>
              <label className="text-xs font-semibold text-ink block mb-1">Rating</label>
              <select
                value={newRating}
                onChange={(e) => setNewRating(Number(e.target.value))}
                className="bg-mist text-xs px-3 py-2 rounded-xl font-bold border border-ink-border"
              >
                <option value={5}>5 ★ - Exceptional</option>
                <option value={4}>4 ★ - Very Good</option>
                <option value={3}>3 ★ - Average</option>
                <option value={2}>2 ★ - Disappointing</option>
                <option value={1}>1 ★ - Unsatisfactory</option>
              </select>
            </div>
            <div>
              <input
                type="text"
                required
                placeholder="Review Headline (e.g. Astonishing engineering)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-mist border border-ink-border rounded-xl"
              />
            </div>
            <div>
              <textarea
                required
                rows={3}
                placeholder="Share your detailed experience..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-mist border border-ink-border rounded-xl"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="px-6 py-2.5 rounded-full bg-ink text-surface text-xs font-semibold hover:bg-ink-light"
            >
              {isSubmittingReview ? 'Submitting...' : 'Post Verified Review'}
            </button>
          </form>
        </div>

        {/* Existing reviews list */}
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-5 bg-surface border border-ink-border/50 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex text-amber-500">
                    {Array.from({ length: Math.round(parseFloat(rev.rating)) }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-ink">{rev.title}</span>
                </div>
                {rev.is_verified_purchase && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-mint-light text-mint-dark">
                    ✓ Verified Purchase
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">{rev.comment}</p>
              <div className="flex items-center justify-between pt-2 text-[11px] text-ink-muted">
                <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                <span className="flex items-center space-x-1">
                  <ThumbsUp className="w-3 h-3 text-ink-muted" />
                  <span>{rev.helpful_votes} helpful</span>
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
};
