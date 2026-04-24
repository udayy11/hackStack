/**
 * Dashboard Page — main landing page with KPIs, risk gauge, alerts, and map preview.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package, TrendingUp, DollarSign, Leaf, AlertTriangle,
  Truck, CheckCircle, Clock, Shield
} from 'lucide-react';
import KpiCard from '../components/KpiCard';
import RiskGauge from '../components/RiskGauge';
import StatusBadge from '../components/StatusBadge';
import { getDashboard } from '../services/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="text-text-muted p-8">Failed to load dashboard.</div>;

  const { kpis, recent_alerts, recent_actions, high_risk_shipments } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">Real-time supply chain intelligence</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <KpiCard icon={TrendingUp} label="OTIF Rate" value={kpis.otif_percentage} suffix="%" color="green" delay={0} />
        <KpiCard icon={Package} label="Total Shipments" value={kpis.total_shipments} color="cyan" delay={1} />
        <KpiCard icon={Truck} label="In Transit" value={kpis.in_transit} color="purple" delay={2} />
        <KpiCard icon={DollarSign} label="Total Value" value={`$${(kpis.total_cost_usd / 1000).toFixed(0)}K`} color="amber" delay={3} />
        <KpiCard icon={Leaf} label="Carbon Footprint" value={`${(kpis.total_carbon_kg / 1000).toFixed(1)}T`} suffix="CO₂" color="green" delay={4} />
      </div>

      {/* Middle Row: Risk Gauge + Alerts + High Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Gauge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 flex flex-col items-center justify-center"
        >
          <h3 className="text-sm font-semibold text-text-muted mb-4 uppercase tracking-wider">System Risk Score</h3>
          <RiskGauge score={Math.round(kpis.average_risk_score)} />
          <div className="grid grid-cols-3 gap-4 mt-4 w-full">
            <div className="text-center">
              <p className="text-lg font-bold text-green">{kpis.delivered}</p>
              <p className="text-xs text-text-muted">Delivered</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber">{kpis.delayed}</p>
              <p className="text-xs text-text-muted">Delayed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red">{kpis.critical_alerts}</p>
              <p className="text-xs text-text-muted">Critical</p>
            </div>
          </div>
        </motion.div>

        {/* Alerts Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Recent Alerts</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-red/15 text-red">
              {kpis.active_alerts} active
            </span>
          </div>
          <div className="space-y-3">
            {recent_alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl bg-bg-primary/50 hover:bg-white/3 transition-colors">
                <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${
                  alert.severity === 'critical' ? 'text-red' : alert.severity === 'warning' ? 'text-amber' : 'text-blue'
                }`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{alert.title}</p>
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={alert.severity} />
                    <span className="text-xs text-text-muted">{alert.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* High Risk Shipments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">High Risk Shipments</h3>
          <div className="space-y-2">
            {high_risk_shipments.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-primary/50 hover:bg-white/3 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">{s.tracking_id}</p>
                  <p className="text-xs text-text-muted truncate">{s.origin} → {s.destination}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={s.risk_level} />
                  <span className={`text-sm font-bold ${
                    s.risk_score > 70 ? 'text-red' : 'text-amber'
                  }`}>{s.risk_score}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-5"
      >
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Recent AI Actions</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Description</th>
                <th>Status</th>
                <th>Approval</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recent_actions.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className="text-xs px-2 py-1 rounded-lg bg-purple/10 text-purple font-medium">
                      {(a.action_type || '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="text-text-secondary max-w-md truncate">{a.description}</td>
                  <td>{a.success ? (
                    <span className="flex items-center gap-1 text-green text-xs"><CheckCircle className="w-3.5 h-3.5" /> Success</span>
                  ) : (
                    <span className="text-red text-xs">Failed</span>
                  )}</td>
                  <td className="text-xs text-text-muted">{a.auto_approved ? 'Auto' : 'Manual'}</td>
                  <td className="text-xs text-text-muted">{new Date(a.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-72" />)}
      </div>
    </div>
  );
}
