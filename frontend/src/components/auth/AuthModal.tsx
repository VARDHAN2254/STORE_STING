import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isLoginTab) {
        await login(email, password);
      } else {
        await register(email, password, fullName);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@storesting.com');
    setPassword('StoreSting2050!');
    setIsLoginTab(true);
  };

  const handleFillDemoCustomer = () => {
    setEmail('alex@storesting.com');
    setPassword('Customer2050!');
    setIsLoginTab(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsAuthModalOpen(false)}
      />

      <div className="relative bg-surface border border-ink-border rounded-3xl shadow-soft-float max-w-md w-full p-8 overflow-hidden z-10">
        
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-mist text-ink-muted hover:text-ink transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-2xl bg-mist border border-sage/60 mx-auto flex items-center justify-center mb-3">
            <span className="font-display font-extrabold text-xl text-ink">S</span>
          </div>
          <h3 className="font-display font-extrabold text-2xl text-ink">
            {isLoginTab ? 'Welcome to STORE STING' : 'Create your account'}
          </h3>
          <p className="text-xs text-ink-muted mt-1">
            Shopping, reimagined for 2050.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-mist p-1 rounded-2xl mb-6 border border-ink-border/50">
          <button
            type="button"
            onClick={() => { setIsLoginTab(true); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isLoginTab ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLoginTab(false); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isLoginTab ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-coral-light/50 border border-coral text-coral-dark text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginTab && (
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Full Name</label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-ink-muted absolute left-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Mercer"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-mist/50 border border-ink-border/70 rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-mint focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-ink-muted absolute left-3.5" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-mist/50 border border-ink-border/70 rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-mint focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3.5" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-mist/50 border border-ink-border/70 rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-mint focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-xl bg-ink text-surface hover:bg-ink-light font-display font-bold text-xs transition-all shadow-soft flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Authenticating...' : isLoginTab ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials quick fill */}
        <div className="mt-6 pt-5 border-t border-ink-border/40 text-center">
          <p className="text-[11px] font-semibold text-ink-muted mb-2">Quick Demo Accounts:</p>
          <div className="flex justify-center space-x-2">
            <button
              type="button"
              onClick={handleFillDemoCustomer}
              className="text-[11px] font-bold px-3 py-1 rounded-lg bg-mist hover:bg-pearl text-ink border border-ink-border/50"
            >
              Demo Customer
            </button>
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="text-[11px] font-bold px-3 py-1 rounded-lg bg-mist hover:bg-pearl text-ink border border-ink-border/50"
            >
              Demo Admin (Ops)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
