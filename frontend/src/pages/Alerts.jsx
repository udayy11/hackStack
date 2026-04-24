/**
 * Alerts Panel — real-time alert management with filtering.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, Filter, AlertTriangle, Info, AlertOctagon } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getAlerts, markAlertRead, resolveAlert } from '../services/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'unresolved') params.resolved = false;
      if (['info', 'warning', 'critical'].includes(filter)) params.severity = filter;
      const data = await getAlerts(params);
      setAlerts(data.alerts || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAlerts(); }, [filter]);

  const handleResolve = async (id) => {
    await resolveAlert(id);
    fetchAlerts();
  };

  const handleRead = async (id) => {
    await markAlertRead(id);
    fetchAlerts();
  };

  const severityIcon = (sev) => {
    if (sev === 'critical') return <AlertOctagon className="w-5 h-5 text-red" />;
    if (sev === 'warning') return <AlertTriangle className="w-5 h-5 text-amber" />;
    return <Info className="w-5 h-5 text-blue" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Alerts</h1>
          <p className="text-sm text-text-muted mt-1">Real-time supply chain notifications</p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full bg-red/15 text-red font-medium">
          {alerts.filter(a => !a.is_resolved).length} active
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-text-muted" />
        {['all', 'unresolved', 'critical', 'warning', 'info'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === f ? 'bg-cyan/15 text-cyan border border-cyan/30' : 'bg-bg-card text-text-muted hover:text-text-primary border border-transparent'
            }`}
          >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)
        ) : alerts.length === 0 ? (
          <div className="glass-card p-12 text-center text-text-muted">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No alerts found</p>
          </div>
        ) : alerts.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card p-4 flex items-start gap-4 ${
              !alert.is_read ? 'border-l-3 border-l-cyan' : ''
            } ${alert.is_resolved ? 'opacity-60' : ''}`}
          >
            {severityIcon(alert.severity)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-text-primary text-sm">{alert.title}</h3>
                <StatusBadge status={alert.severity} />
                <span className="text-xs text-text-muted px-2 py-0.5 rounded bg-bg-elevated">{alert.category}</span>
              </div>
              <p className="text-sm text-text-secondary">{alert.message}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-text-muted">
                  {alert.created_at ? new Date(alert.created_at).toLocaleString() : ''}
                </span>
                {alert.shipment_id && (
                  <span className="text-xs text-cyan">Shipment #{alert.shipment_id}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!alert.is_read && (
                <button
                  onClick={() => handleRead(alert.id)}
                  className="text-xs px-2 py-1 rounded-lg bg-blue/10 text-blue hover:bg-blue/20 transition-colors cursor-pointer"
                >Mark Read</button>
              )}
              {!alert.is_resolved && (
                <button
                  onClick={() => handleResolve(alert.id)}
                  className="text-xs px-2 py-1 rounded-lg bg-green/10 text-green hover:bg-green/20 transition-colors cursor-pointer flex items-center gap-1"
                ><CheckCircle className="w-3 h-3" /> Resolve</button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
