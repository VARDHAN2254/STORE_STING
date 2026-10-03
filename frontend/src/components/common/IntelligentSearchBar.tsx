import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';

interface IntelligentSearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

const POPULAR_PROMPTS = [
  "I need a lightweight laptop for coding under ₹70000",
  "Spatial earbuds for deep work focus",
  "Ceramic keyboard for silent tactile typing",
  "Daylight monitor lamp with zero glare",
];

export const IntelligentSearchBar: React.FC<IntelligentSearchBarProps> = ({
  initialQuery = '',
  onSearch,
  className = '',
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (onSearch) {
      onSearch(query);
    } else {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setQuery(prompt);
    if (onSearch) {
      onSearch(prompt);
    } else {
      navigate(`/search?q=${encodeURIComponent(prompt)}`);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center bg-surface border-2 border-ink-border rounded-3xl shadow-soft p-1.5 focus-within:border-mint focus-within:ring-4 focus-within:ring-mint-light/40 transition-all">
          <div className="pl-4 pr-2 text-ink-muted">
            <Sparkles className="w-5 h-5 text-mint-dark animate-pulse-subtle" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keywords or intent (e.g. lightweight laptop for coding under ₹70,000)..."
            className="w-full py-3 pr-4 text-sm sm:text-base bg-transparent text-ink placeholder:text-ink-muted/70 focus:outline-none font-medium"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-ink text-surface hover:bg-ink-light transition-all flex items-center space-x-2 font-semibold text-xs sm:text-sm active:scale-95 shadow-soft-sm shrink-0"
          >
            <span>Search</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Suggested Natural Language Prompts */}
      <div className="mt-3 flex items-center flex-wrap gap-2 text-xs">
        <span className="text-ink-muted font-medium flex items-center space-x-1">
          <span className="text-[11px] uppercase tracking-wider font-bold">Try asking:</span>
        </span>
        {POPULAR_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePromptClick(prompt)}
            className="px-3 py-1 rounded-full bg-mist hover:bg-pearl text-ink font-medium border border-ink-border/50 transition-colors text-[11px]"
          >
            "{prompt}"
          </button>
        ))}
      </div>
    </div>
  );
};
