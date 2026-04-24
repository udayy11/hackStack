/**
 * AI Learning Page — model metrics, weight optimization, and retraining.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, RefreshCcw, TrendingUp, Target, Gauge, Leaf } from 'lucide-react';
import { getLearningMetrics, getLearningSum, optimizeWeights, retrainModels } from '../services/api';

export default function Learning() {
  const [metrics, setMetrics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    Promise.all([getLearningMetrics(), getLearningSum()])
      .then(([m, s]) => { setMetrics(m); setSummary(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleOptimize = async () => {
    setOptimizing(true);
    try { await optimizeWeights(); const [m, s] = await Promise.all([getLearningMetrics(), getLearningSum()]); setMetrics(m); setSummary(s); } catch (e) { console.error(e); }
    setOptimizing(false);
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try { await retrainModels(); const [m, s] = await Promise.all([getLearningMetrics(), getLearningSum()]); setMetrics(m); setSummary(s); } catch (e) { console.error(e); }
    setRetraining(false);
  };

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Learning Loop</h1>
          <p className="text-sm text-text-muted mt-1">Track, improve, and retrain AI models</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleOptimize} disabled={optimizing} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple/15 text-purple hover:bg-purple/25 disabled:opacity-40 transition-colors cursor-pointer text-sm">
            <Gauge className="w-4 h-4" /> {optimizing ? 'Optimizing...' : 'Optimize Weights'}
          </button>
          <button onClick={handleRetrain} disabled={retraining} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan/15 text-cyan hover:bg-cyan/25 disabled:opacity-40 transition-colors cursor-pointer text-sm">
            <RefreshCcw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} /> {retraining ? 'Retraining...' : 'Retrain Models'}
          </button>
        </div>
      </div>

      {/* Model Versions */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4 text-center">
            <Brain className="w-6 h-6 text-purple mx-auto mb-2" />
            <p className="text-xs text-text-muted">Risk Model</p>
            <p className="text-sm font-bold text-purple mt-1">{summary.current_model_versions?.risk_scoring}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <TrendingUp className="w-6 h-6 text-cyan mx-auto mb-2" />
            <p className="text-xs text-text-muted">Forecast Model</p>
            <p className="text-sm font-bold text-cyan mt-1">{summary.current_model_versions?.demand_forecasting}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Target className="w-6 h-6 text-green mx-auto mb-2" />
            <p className="text-xs text-text-muted">System Health</p>
            <p className={`text-sm font-bold mt-1 ${summary.system_health === 'optimal' ? 'text-green' : 'text-amber'}`}>{summary.system_health?.toUpperCase()}</p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">📈 Demand Forecasting</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(metrics.demand_forecast || {}).map(([k, v]) => (
                <div key={k} className="bg-bg-primary/50 rounded-xl p-3">
                  <p className="text-xs text-text-muted">{k.replace(/_/g, ' ').toUpperCase()}</p>
                  <p className="text-lg font-bold text-text-primary mt-1">{typeof v === 'number' ? v.toLocaleString() : v}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">🎯 Risk Scoring</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(metrics.risk_scoring || {}).map(([k, v]) => (
                <div key={k} className="bg-bg-primary/50 rounded-xl p-3">
                  <p className="text-xs text-text-muted">{k.replace(/_/g, ' ').toUpperCase()}</p>
                  <p className="text-lg font-bold text-text-primary mt-1">{typeof v === 'number' ? v.toLocaleString() : v}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">🔍 Disruption Detection</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(metrics.disruption_detection || {}).map(([k, v]) => (
                <div key={k} className="bg-bg-primary/50 rounded-xl p-3">
                  <p className="text-xs text-text-muted">{k.replace(/_/g, ' ').toUpperCase()}</p>
                  <p className="text-lg font-bold text-text-primary mt-1">{typeof v === 'number' ? v.toLocaleString() : v}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">⚡ Action Effectiveness</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(metrics.action_effectiveness || {}).map(([k, v]) => (
                <div key={k} className="bg-bg-primary/50 rounded-xl p-3">
                  <p className="text-xs text-text-muted">{k.replace(/_/g, ' ').toUpperCase()}</p>
                  <p className="text-lg font-bold text-text-primary mt-1">{typeof v === 'number' ? v.toLocaleString() : v}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
