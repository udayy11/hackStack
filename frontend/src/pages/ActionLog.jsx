/**
 * Action Log — audit trail of automated/manual actions.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, Zap, TrendingDown } from 'lucide-react';
import { getActionLog } from '../services/api';

const actionIcons = { reroute: '🔄', switch_supplier: '🏭', rebalance_stock: '📦', create_purchase_order: '📋', alert_only: '🔔' };

export default function ActionLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActionLog().then(d => setLogs(d.logs || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Action Log</h1>
        <p className="text-sm text-text-muted mt-1">What happened, why, and the outcome</p>
      </div>
      <div className="space-y-4">
        {loading ? [...Array(5)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />) :
        logs.map((log, i) => (
          <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{actionIcons[log.action_type] || '⚡'}</span>
                <div>
                  <h3 className="font-semibold text-text-primary text-sm">{(log.action_type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h3>
                  <p className="text-xs text-text-muted">{log.created_at ? new Date(log.created_at).toLocaleString() : ''}{log.shipment_id && ` · Shipment #${log.shipment_id}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {log.auto_approved ? <span className="text-xs px-2 py-1 rounded-lg bg-purple/10 text-purple flex items-center gap-1"><Zap className="w-3 h-3" /> Auto</span> : <span className="text-xs px-2 py-1 rounded-lg bg-blue/10 text-blue">Manual</span>}
                {log.success ? <span className="flex items-center gap-1 text-xs text-green"><CheckCircle className="w-3.5 h-3.5" /> Success</span> : <span className="flex items-center gap-1 text-xs text-red"><XCircle className="w-3.5 h-3.5" /> Failed</span>}
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-3">{log.description}</p>
            {log.reason && (<div className="bg-bg-primary/60 rounded-xl p-3 mb-3 border border-border"><p className="text-xs text-text-muted mb-1 font-medium">AI Reasoning:</p><p className="text-sm text-text-secondary">{log.reason}</p></div>)}
            <div className="flex items-center gap-6 text-xs">
              {log.risk_score_before != null && log.risk_score_after != null && (<div className="flex items-center gap-2"><span className="text-text-muted">Risk:</span><span className="text-red font-semibold">{log.risk_score_before}</span><ArrowRight className="w-3 h-3 text-text-muted" /><span className="text-green font-semibold">{log.risk_score_after}</span><TrendingDown className="w-3 h-3 text-green" /></div>)}
              {log.cost_impact_usd != null && <span className={log.cost_impact_usd > 0 ? 'text-red' : 'text-green'}>Cost: {log.cost_impact_usd > 0 ? '+' : ''}{log.cost_impact_usd?.toLocaleString()} USD</span>}
              {log.carbon_impact_kg != null && <span className={log.carbon_impact_kg > 0 ? 'text-red' : 'text-green'}>Carbon: {log.carbon_impact_kg > 0 ? '+' : ''}{log.carbon_impact_kg} kg</span>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
