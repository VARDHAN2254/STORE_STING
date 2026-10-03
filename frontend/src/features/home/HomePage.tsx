import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Laptop, Smartphone, Watch, Monitor, Home as HomeIcon, Compass, ShieldCheck } from 'lucide-react';
import { IntelligentSearchBar } from '../../components/common/IntelligentSearchBar';
import { ProductCard } from '../../components/common/ProductCard';
import { Product, Category } from '../../types';
import { api } from '../../services/api';

const GOAL_PILLS = [
  { label: 'All Essentials', goal: '' },
  { label: 'For Your Workspace', goal: 'workspace' },
  { label: 'For Creators', goal: 'creators' },
  { label: 'For Students', goal: 'students' },
  { label: 'For Gamers', goal: 'gamers' },
  { label: 'Travel Essentials', goal: 'travel' },
];

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [workspaceProducts, setWorkspaceProducts] = useState<Product[]>([]);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [goalProducts, setGoalProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [cats, trending, workspace] = await Promise.all([
          api.getCategories(),
          api.getTrending(),
          api.getGoalCollection('workspace'),
        ]);
        setCategories(cats);
        setTrendingProducts(trending);
        setWorkspaceProducts(workspace);
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedGoal) {
      api.getGoalCollection(selectedGoal)
        .then(data => setGoalProducts(data))
        .catch(err => console.error(err));
    }
  }, [selectedGoal]);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'laptop': return <Laptop className="w-5 h-5" />;
      case 'smartphone': return <Smartphone className="w-5 h-5" />;
      case 'watch': return <Watch className="w-5 h-5" />;
      case 'monitor': return <Monitor className="w-5 h-5" />;
      case 'home': return <HomeIcon className="w-5 h-5" />;
      default: return <Compass className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-20 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl space-y-6">
            
            {/* Pill tag */}
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-mist border border-sage/60 text-xs font-semibold text-ink">
              <span className="w-2 h-2 rounded-full bg-mint animate-pulse-subtle"></span>
              <span>The Soft Future of Commerce • Circa 2050</span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-ink tracking-tight leading-[1.08]">
              Shop beyond <br className="hidden sm:inline" />
              <span className="relative">
                ordinary.
                <span className="absolute left-0 bottom-1 w-full h-3 bg-mint-light/70 -z-10 rounded-full"></span>
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-ink-muted leading-relaxed font-normal max-w-xl">
              Discover products chosen around how you live, work, create and explore. Seamless multi-agent commerce built on invisible intelligence.
            </p>

            {/* Intelligent Search Input */}
            <div className="pt-4 max-w-2xl">
              <IntelligentSearchBar />
            </div>

          </div>

          {/* Goal-Based Discovery Switcher */}
          <div className="mt-14 pt-8 border-t border-ink-border/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Shop By What You Accomplish:
              </span>
              <Link to="/discover" className="text-xs font-bold text-ink hover:text-ink/80 flex items-center space-x-1">
                <span>View all catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-center space-x-2.5 overflow-x-auto pb-2 scrollbar-none">
              {GOAL_PILLS.map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedGoal(pill.goal)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 active:scale-95 ${
                    selectedGoal === pill.goal
                      ? 'bg-ink text-surface shadow-soft-sm'
                      : 'bg-surface text-ink border border-ink-border/70 hover:bg-mist'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Goal-selected products grid */}
            {selectedGoal && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
                {goalProducts.slice(0, 4).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

          </div>

        </div>
      </section>

      {/* Category Discovery Circles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-ink">Curated Departments</h2>
            <p className="text-xs text-ink-muted mt-1">Calm aesthetics, quantum performance, and biological harmony</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/discover?category=${cat.slug}`}
              className="p-5 bg-surface border border-ink-border/60 rounded-3xl text-center group card-hover flex flex-col items-center justify-between"
            >
              <div className="w-12 h-12 rounded-2xl bg-mist flex items-center justify-center text-ink group-hover:scale-110 transition-transform mb-3">
                {getCategoryIcon(cat.icon_name)}
              </div>
              <div>
                <h3 className="font-display font-bold text-xs text-ink group-hover:underline">
                  {cat.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Now Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-mint-dark uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Trending Now</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl text-ink">Engineered for Daily Flow</h2>
          </div>
          <Link
            to="/discover"
            className="hidden sm:flex items-center space-x-1 text-xs font-bold text-ink hover:underline"
          >
            <span>Explore all products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-mist/60 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingProducts.slice(0, 4).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* Featured Architecture Spotlight: Workspace 2050 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-mist via-surface to-pearl/40 border border-ink-border/70 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-xl space-y-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">
              Curated Environment
            </span>
            <h3 className="font-display font-extrabold text-3xl sm:text-4xl text-ink tracking-tight">
              The 2050 Studio Sanctuary.
            </h3>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed font-normal">
              Designed for effortless focus. Featuring asymmetric zero-glare circadian illumination, ceramic tactile hall-effect keyboards, and sub-kilo neural notebooks.
            </p>
            <div className="pt-2">
              <Link
                to="/discover?goal=workspace"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-ink text-surface font-semibold text-xs hover:bg-ink-light transition-all shadow-soft active:scale-95"
              >
                <span>Discover the Workspace Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="mt-8 lg:mt-0 lg:absolute lg:right-12 lg:top-1/2 lg:-translate-y-1/2 w-full lg:w-96">
            {workspaceProducts.length > 0 && (
              <ProductCard product={workspaceProducts[0]} />
            )}
          </div>
        </div>
      </section>

      {/* Editor's Discoveries Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-ink">Editor's Discoveries</h2>
            <p className="text-xs text-ink-muted mt-1">Exceptional craftsmanship, verified battery endurance, and minimalist utility</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingProducts.slice(4, 8).map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

    </div>
  );
};
