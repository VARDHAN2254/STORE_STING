import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface border-t border-ink-border/60 pt-16 pb-12 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-ink-border/50">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-mist text-ink">
              <Truck className="w-5 h-5 text-ink" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink">Ultra-Fast Transit</h4>
              <p className="text-xs text-ink-muted mt-0.5">Autonomous drone & hyper-logistics with live telemetry tracking.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-mist text-ink">
              <ShieldCheck className="w-5 h-5 text-ink" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink">Zero-Friction Guarantee</h4>
              <p className="text-xs text-ink-muted mt-0.5">2-year warranty across all quantum and neural hardware.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-mist text-ink">
              <RotateCcw className="w-5 h-5 text-ink" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink">30-Day Effortless Returns</h4>
              <p className="text-xs text-ink-muted mt-0.5">Instant doorstep pickup with carbon-neutral packaging.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-mist text-ink">
              <Cpu className="w-5 h-5 text-ink" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink">Multi-Agent Core</h4>
              <p className="text-xs text-ink-muted mt-0.5">Invisible backend intelligence verifying inventory and dispatch.</p>
            </div>
          </div>
        </div>

        {/* Brand & Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 py-12">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-mist border border-sage flex items-center justify-center">
                <span className="font-display font-extrabold text-sm text-ink">S</span>
              </div>
              <span className="font-display font-extrabold text-lg text-ink">STORE STING</span>
            </div>
            <p className="text-xs text-ink-muted max-w-sm leading-relaxed">
              Shopping, reimagined for 2050. A calm, intelligent commerce platform prioritizing clarity, durability, and human-centric living. Built on native runtimes and PostgreSQL concurrency.
            </p>
            <div className="text-[11px] text-ink-muted/80">
              Soft Future Design System • Light UI Standard
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-ink">Categories</h5>
            <ul className="mt-4 space-y-2.5 text-xs text-ink-muted">
              <li><Link to="/discover?category=computers" className="hover:text-ink transition-colors">Computers & Laptops</Link></li>
              <li><Link to="/discover?category=mobiles" className="hover:text-ink transition-colors">Mobiles & Communicators</Link></li>
              <li><Link to="/discover?category=wearables" className="hover:text-ink transition-colors">Wearables & Biometrics</Link></li>
              <li><Link to="/discover?category=workspace" className="hover:text-ink transition-colors">Workspace & Ergonomics</Link></li>
              <li><Link to="/discover?category=lifestyle" className="hover:text-ink transition-colors">Lifestyle & Travel</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-ink">Curated Goals</h5>
            <ul className="mt-4 space-y-2.5 text-xs text-ink-muted">
              <li><Link to="/discover?goal=students" className="hover:text-ink transition-colors">For Students</Link></li>
              <li><Link to="/discover?goal=creators" className="hover:text-ink transition-colors">For Creators</Link></li>
              <li><Link to="/discover?goal=gamers" className="hover:text-ink transition-colors">For Gamers</Link></li>
              <li><Link to="/discover?goal=workspace" className="hover:text-ink transition-colors">For Your Workspace</Link></li>
              <li><Link to="/discover?goal=travel" className="hover:text-ink transition-colors">Travel Essentials</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-ink">Platform & Ops</h5>
            <ul className="mt-4 space-y-2.5 text-xs text-ink-muted">
              <li><Link to="/my-space" className="hover:text-ink transition-colors">My Space</Link></li>
              <li><Link to="/admin" className="hover:text-ink transition-colors">Operations Dashboard</Link></li>
              <li><a href="/api/docs" target="_blank" rel="noreferrer" className="hover:text-ink transition-colors">API Documentation</a></li>
              <li><span className="text-mint-dark font-medium">Native PostgreSQL 18</span></li>
              <li><span className="text-ink-muted">Zero Docker Architecture</span></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-ink-border/40 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted">
          <div>© 2050 STORE STING Inc. All rights reserved. Shopping, reimagined.</div>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span>Privacy & Neural Data Guard</span>
            <span>Terms of Service</span>
            <span>System Telemetry</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
