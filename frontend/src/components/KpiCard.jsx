/**
 * KPI Card — animated stat card with icon, value, and trend.
 */
import { motion } from 'framer-motion';

export default function KpiCard({ icon: Icon, label, value, suffix = '', trend, color = 'cyan', delay = 0 }) {
  const colorMap = {
    cyan: { bg: 'bg-cyan/10', text: 'text-cyan', border: 'border-cyan/20' },
    purple: { bg: 'bg-purple/10', text: 'text-purple', border: 'border-purple/20' },
    green: { bg: 'bg-green/10', text: 'text-green', border: 'border-green/20' },
    amber: { bg: 'bg-amber/10', text: 'text-amber', border: 'border-amber/20' },
    red: { bg: 'bg-red/10', text: 'text-red', border: 'border-red/20' },
  };

  const c = colorMap[color] || colorMap.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4 }}
      className={`glass-card p-5 border ${c.border}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-2xl font-bold ${c.text} kpi-value`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-base font-normal ml-1">{suffix}</span>}
          </p>
          {trend !== undefined && (
            <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green' : 'text-red'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
      </div>
    </motion.div>
  );
}
