/**
 * Dashboard Page — main landing page with KPIs, risk gauge, alerts, and map preview.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package, TrendingUp, DollarSign, Leaf, AlertTriangle,
  Truck, CheckCircle, Settings, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import KpiCard from '../components/KpiCard';
import RiskGauge from '../components/RiskGauge';
import StatusBadge from '../components/StatusBadge';
import { getDashboardPersonalized } from '../services/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.pathname === '/onboarding') return;

    const preferences = localStorage.getItem('userPreferences');

    if (!preferences) {
      navigate('/onboarding');
      return;
    }

    try {
      const prefs = JSON.parse(preferences);

      getDashboardPersonalized(prefs)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    } catch (err) {
      console.error('Invalid preferences JSON:', err);
      setLoading(false);
    }

  }, [navigate]);

  // ✅ Proper conditional rendering
  if (loading) return <LoadingSkeleton />;
  if (!data) {
    return (
      <div className="text-text-muted p-8">
        Failed to load dashboard.
      </div>
    );
  }

  const { kpis, recent_alerts, recent_actions, high_risk_shipments } = data;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">
            Real-time supply chain intelligence
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/onboarding')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan/10 border border-cyan/30 text-cyan hover:bg-cyan/20 transition-all text-sm font-medium"
        >
          <Settings className="w-4 h-4" />
          Re-run Setup
        </motion.button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <KpiCard icon={TrendingUp} label="OTIF Rate" value={kpis.otif_percentage} suffix="%" color="green" />
        <KpiCard icon={Package} label="Total Shipments" value={kpis.total_shipments} color="cyan" />
        <KpiCard icon={Truck} label="In Transit" value={kpis.in_transit} color="purple" />
        <KpiCard icon={DollarSign} label="Total Value" value={`$${(kpis.total_cost_usd / 1000).toFixed(0)}K`} color="amber" />
        <KpiCard icon={Leaf} label="Carbon Footprint" value={`${(kpis.total_carbon_kg / 1000).toFixed(1)}T`} suffix="CO₂" color="green" />
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Risk Gauge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 flex flex-col items-center justify-center"
        >
          <h3 className="text-sm text-text-muted mb-4 uppercase">
            System Risk Score
          </h3>

          <RiskGauge score={Math.round(kpis.average_risk_score)} />

          <div className="grid grid-cols-3 gap-4 mt-4 w-full">
            <Stat label="Delivered" value={kpis.delivered} color="text-green" />
            <Stat label="Delayed" value={kpis.delayed} color="text-amber" />
            <Stat label="Critical" value={kpis.critical_alerts} color="text-red" />
          </div>
        </motion.div>

        {/* Alerts */}
        <motion.div className="glass-card p-5">
          <h3 className="text-sm text-text-muted mb-4 uppercase">
            Recent Alerts
          </h3>

          <div className="space-y-3">
            {recent_alerts.map(alert => (
              <div key={alert.id} className="flex gap-3 p-3 rounded-xl bg-bg-primary/50">

                <AlertTriangle className={`w-4 h-4 mt-1 ${
                  alert.severity === 'critical' ? 'text-red' :
                  alert.severity === 'warning' ? 'text-amber' : 'text-blue'
                }`} />

                <div>
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-text-muted">{alert.message}</p>
                  <StatusBadge status={alert.severity} />
                </div>

              </div>
            ))}
          </div>
        </motion.div>

        {/* High Risk */}
        <motion.div className="glass-card p-5">
          <h3 className="text-sm text-text-muted mb-4 uppercase">
            High Risk Shipments
          </h3>

          {high_risk_shipments.slice(0, 6).map(s => (
            <div key={s.id} className="flex justify-between p-3 rounded-xl bg-bg-primary/50">

              <div>
                <p className="text-sm">{s.tracking_id}</p>
                <p className="text-xs text-text-muted">
                  {s.origin} → {s.destination}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={s.risk_level} />
                <span className="font-bold">{s.risk_score}</span>
              </div>

            </div>
          ))}
        </motion.div>

      </div>

      {/* Actions Table */}
      <div className="glass-card p-5">
        <h3 className="text-sm text-text-muted mb-4 uppercase">
          Recent Actions
        </h3>

        <table className="data-table w-full">
          <tbody>
            {recent_actions.map(a => (
              <tr key={a.id}>
                <td>{a.action_type}</td>
                <td>{a.description}</td>
                <td>{a.success ? 'Success' : 'Failed'}</td>
                <td>{a.auto_approved ? 'Auto' : 'Manual'}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  );
}

/* ---------- Small Components ---------- */

function Stat({ label, value, color }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-72" />
        ))}
      </div>
    </div>
  );
}