/**
 * Supplier Scorecard — ranked supplier performance dashboard.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Star, Clock, Leaf, Shield, TrendingUp } from 'lucide-react';
import { getSuppliers } from '../services/api';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSuppliers()
      .then(d => setSuppliers(d.suppliers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const ratingStars = (rating) => {
    const stars = Math.round(rating);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Supplier Scorecard</h1>
        <p className="text-sm text-text-muted mt-1">Performance rankings & reliability metrics</p>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)
        ) : suppliers.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-5 hover:border-cyan/20"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-text-primary">{s.name}</h3>
                <p className="text-xs text-text-muted mt-0.5">{s.location}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                i === 0 ? 'bg-amber/15 text-amber' : i === 1 ? 'bg-text-secondary/15 text-text-secondary' : i === 2 ? 'bg-amber/10 text-amber/70' : 'bg-bg-elevated text-text-muted'
              }`}>
                #{i + 1}
              </div>
            </div>

            {/* Reliability Score Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-muted flex items-center gap-1"><Shield className="w-3 h-3" /> Reliability</span>
                <span className={`font-bold ${s.reliability_score > 80 ? 'text-green' : s.reliability_score > 60 ? 'text-amber' : 'text-red'}`}>
                  {s.reliability_score}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-bg-primary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.reliability_score}%` }}
                  transition={{ delay: i * 0.1, duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{
                    background: s.reliability_score > 80
                      ? 'linear-gradient(90deg, #22C55E, #4ADE80)'
                      : s.reliability_score > 60
                        ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                        : 'linear-gradient(90deg, #EF4444, #F87171)',
                  }}
                />
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-primary/50 rounded-xl p-2.5">
                <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
                  <Clock className="w-3 h-3" /> Lead Time
                </div>
                <p className="text-sm font-semibold text-text-primary">{s.lead_time_days} days</p>
              </div>
              <div className="bg-bg-primary/50 rounded-xl p-2.5">
                <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
                  <TrendingUp className="w-3 h-3" /> OTIF
                </div>
                <p className="text-sm font-semibold text-green">{s.otif_percentage}%</p>
              </div>
              <div className="bg-bg-primary/50 rounded-xl p-2.5">
                <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
                  <Star className="w-3 h-3" /> Quality
                </div>
                <p className="text-sm font-semibold text-amber">{ratingStars(s.quality_rating)}</p>
              </div>
              <div className="bg-bg-primary/50 rounded-xl p-2.5">
                <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
                  <Leaf className="w-3 h-3" /> Carbon
                </div>
                <p className="text-sm font-semibold text-green">{ratingStars(s.carbon_rating)}</p>
              </div>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-xs text-text-muted">
              <span>{s.total_orders} orders</span>
              <span>Defect rate: {(s.defect_rate * 100).toFixed(1)}%</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
