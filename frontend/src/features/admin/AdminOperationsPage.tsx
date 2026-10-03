import React, { useState, useEffect } from 'react';
import {
  Activity, ShieldAlert, Cpu, Database, Play, CheckCircle2,
  AlertTriangle, RefreshCw, Layers, ArrowRight, Lock
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SCENARIOS = [
  { id: 'SUCCESS', label: 'SUCCESS (Happy Path)', desc: 'Clean run from inventory to drone delivery' },
  { id: 'LOW_STOCK', label: 'LOW_STOCK (Inventory Check)', desc: 'Tests stock confidence threshold warning' },
  { id: 'PAYMENT_RETRY', label: 'PAYMENT_RETRY (Network Latency)', desc: 'Simulates attempt 1 timeout followed by attempt 2 authorization' },
  { id: 'PAYMENT_FAILURE', label: 'PAYMENT_FAILURE (Card Decline)', desc: 'Gateway rejection and order failure' },
  { id: 'FRAUD_REJECTION', label: 'FRAUD_REJECTION (Neural Sentinel)', desc: 'Fraud risk > 0.3 triggers security abort' },
  { id: 'DELIVERY_RETRY', label: 'DELIVERY_RETRY (Route Obstruction)', desc: 'Drone reroute attempt 2 assignment' },
  { id: 'DELIVERY_FAILURE', label: 'DELIVERY_FAILURE (Vortex Exception)', desc: 'Carrier dispatch exception' },
];

export const AdminOperationsPage: React.FC = () => {
  const { user, setIsAuthModalOpen } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [selectedRunEvents, setSelectedRunEvents] = useState<any[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulation form
  const [selectedScenario, setSelectedScenario] = useState('SUCCESS');
  const [simulationSeed, setSimulationSeed] = useState(42);
  const [targetOrderId, setTargetOrderId] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const fetchOpsData = async () => {
    if (!user || user.role !== 'admin') {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await api.getAdminMetrics();
      setMetrics(data);
      setRecentRuns(data.recent_runs || []);
      if (data.recent_runs?.length > 0 && !activeRunId) {
        handleViewRun(data.recent_runs[0].run_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpsData();
    const interval = setInterval(fetchOpsData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleViewRun = async (runId: string) => {
    setActiveRunId(runId);
    try {
      const events = await api.getRunEvents(runId);
      setSelectedRunEvents(events);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOrderId.trim()) {
      alert('Please provide an existing order ID or order number to simulate.');
      return;
    }
    try {
      setIsSimulating(true);
      const res = await api.triggerSimulation(targetOrderId, selectedScenario, simulationSeed);
      setSimulationResult(res);
      setTimeout(fetchOpsData, 1500);
    } catch (err: any) {
      alert(err.message || 'Simulation trigger failed');
    } finally {
      setIsSimulating(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-coral/20 text-coral flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-black text-2xl text-ink">Admin Operations Portal Restricted</h2>
          <p className="text-sm text-ink-muted">
            The multi-agent orchestration console, PostgreSQL job monitoring, and simulation testbed require administrative privileges.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-ink text-white font-bold text-xs uppercase tracking-wider hover:bg-ink-light transition-colors shadow-soft-sm"
          >
            Sign In with Operations Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-mint-dark uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            <span>COMMERCE ENGINE TELEMETRY & OPERATIONS</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-ink">
            Operations Portal
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Multi-agent orchestrator monitoring, PostgreSQL job queue health, and deterministic testbed.
          </p>
        </div>

        <button
          onClick={fetchOpsData}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-surface border border-ink-border text-xs font-bold text-ink hover:bg-mist transition-colors shadow-soft-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-5 bg-surface border border-ink-border/60 rounded-3xl shadow-soft-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <Activity className="w-4 h-4 text-mint-dark" />
          </div>
          <span className="font-display font-black text-3xl text-ink">
            {metrics?.total_orders || 0}
          </span>
          <span className="block text-[11px] text-ink-muted mt-1">Processed across all runs</span>
        </div>

        <div className="p-5 bg-surface border border-ink-border/60 rounded-3xl shadow-soft-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Volume</span>
            <span className="text-xs font-bold text-ink">INR</span>
          </div>
          <span className="font-display font-black text-3xl text-ink">
            ₹{parseFloat(metrics?.total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className="block text-[11px] text-ink-muted mt-1">Authoritative backend Decimal</span>
        </div>

        <div className="p-5 bg-surface border border-ink-border/60 rounded-3xl shadow-soft-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Job Queue</span>
            <Database className="w-4 h-4 text-sage" />
          </div>
          <span className="font-display font-black text-3xl text-ink">
            {metrics?.pending_jobs || 0}
          </span>
          <span className="block text-[11px] text-ink-muted mt-1">FOR UPDATE SKIP LOCKED</span>
        </div>

        <div className="p-5 bg-surface border border-ink-border/60 rounded-3xl shadow-soft-sm">
          <div className="flex items-center justify-between text-ink-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Worker Health</span>
            <CheckCircle2 className="w-4 h-4 text-mint-dark" />
          </div>
          <span className="font-display font-black text-xl text-ink truncate block">
            OPTIMAL
          </span>
          <span className="block text-[11px] text-ink-muted mt-1">Native PostgreSQL 18</span>
        </div>

      </div>

      {/* Deterministic Scenario Evaluation Testbed */}
      <div className="bg-surface border border-ink-border/70 rounded-3xl p-6 sm:p-8 shadow-soft-sm space-y-6">
        <div>
          <h3 className="font-display font-extrabold text-xl text-ink flex items-center space-x-2">
            <Play className="w-5 h-5 text-mint-dark" />
            <span>Deterministic Scenario Simulation Engine</span>
          </h3>
          <p className="text-xs text-ink-muted mt-1">
            Recreate evaluation scenarios with seeded pseudo-random logic without impacting real customer checkout.
          </p>
        </div>

        <form onSubmit={handleTriggerSimulation} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-ink mb-1.5">Scenario Type</label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full bg-mist border border-ink-border px-4 py-2.5 rounded-xl text-xs font-bold text-ink"
              >
                {SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.label} — {sc.desc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Deterministic Seed</label>
              <input
                type="number"
                value={simulationSeed}
                onChange={(e) => setSimulationSeed(Number(e.target.value))}
                className="w-full bg-mist border border-ink-border px-4 py-2.5 rounded-xl text-xs font-bold text-ink"
              />
            </div>

          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">Target Order ID or Order Number</label>
            <div className="flex space-x-3">
              <input
                type="text"
                required
                placeholder="e.g. Paste an existing Order UUID or pick from recent below"
                value={targetOrderId}
                onChange={(e) => setTargetOrderId(e.target.value)}
                className="flex-1 bg-mist border border-ink-border px-4 py-2.5 rounded-xl text-xs font-mono font-medium text-ink"
              />
              <button
                type="submit"
                disabled={isSimulating}
                className="px-6 py-2.5 rounded-xl bg-ink text-surface hover:bg-ink-light font-bold text-xs transition-colors flex items-center space-x-2 shrink-0"
              >
                <span>{isSimulating ? 'Simulating...' : 'Execute Scenario'}</span>
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
        </form>

        {simulationResult && (
          <div className="p-4 bg-mint-light/60 border border-mint rounded-2xl text-xs font-bold text-ink flex items-center justify-between">
            <span>Simulation Triggered: Order #{simulationResult.order_number} under scenario {simulationResult.scenario} (Seed {simulationResult.seed})</span>
            <button
              onClick={() => setSimulationResult(null)}
              className="text-xs underline text-ink-muted hover:text-ink"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Two Column: Recent Runs Table + Event Telemetry Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recent Runs Table (5 cols) */}
        <div className="lg:col-span-5 bg-surface border border-ink-border/60 rounded-3xl p-6 shadow-soft-sm space-y-4">
          <h4 className="font-display font-bold text-base text-ink">Recent Engine Runs</h4>

          <div className="divide-y divide-ink-border/40 overflow-y-auto max-h-[480px]">
            {recentRuns.map((r) => (
              <div
                key={r.run_id}
                onClick={() => {
                  handleViewRun(r.run_id);
                  if (r.order_id) setTargetOrderId(r.order_id);
                }}
                className={`py-3 px-3 rounded-2xl cursor-pointer transition-colors ${
                  activeRunId === r.run_id ? 'bg-mist border border-ink-border' : 'hover:bg-mist/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-extrabold text-xs text-ink">
                    #{r.order_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.status === 'COMPLETED'
                        ? 'bg-sage-light text-ink'
                        : r.status === 'RUNNING'
                        ? 'bg-mint text-ink animate-pulse'
                        : 'bg-coral-light text-coral-dark'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-ink-muted mt-1">
                  <span>Scenario: <strong>{r.scenario}</strong></span>
                  <span>{r.execution_time_ms} ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Event Telemetry Timeline (7 cols) */}
        <div className="lg:col-span-7 bg-surface border border-ink-border/60 rounded-3xl p-6 shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-base text-ink">Agent Event Telemetry Timeline</h4>
            <span className="text-xs text-ink-muted font-bold font-mono">
              {activeRunId ? `Run: ${activeRunId.slice(0, 8)}...` : 'Select a run'}
            </span>
          </div>

          {selectedRunEvents.length === 0 ? (
            <div className="py-20 text-center text-xs text-ink-muted">
              Select a run from the left panel to inspect its agent transitions and payloads.
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[480px] pr-2">
              {selectedRunEvents.map((ev, i) => (
                <div key={ev.id || i} className="p-3.5 bg-mist/50 border border-ink-border/50 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-mint-dark" />
                      <span>{ev.agent}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface border border-ink-border text-[10px] font-bold text-ink">
                      {ev.state}
                    </span>
                  </div>
                  
                  {ev.payload && Object.keys(ev.payload).length > 0 && (
                    <pre className="text-[11px] bg-surface/80 p-2.5 rounded-xl font-mono text-ink-muted overflow-x-auto border border-ink-border/40">
                      {JSON.stringify(ev.payload, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
