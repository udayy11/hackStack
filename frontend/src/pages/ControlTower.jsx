/**
 * Control Tower — Live shipment tracking map with risk-colored markers.
 * Uses Google Maps (or a static map fallback if no API key).
 */
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Clock, Shield, Maximize2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getShipmentMap } from '../services/api';

// ── Map marker colors ──
const riskColors = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#EF4444',
};

const statusIcons = {
  in_transit: '🚢',
  pending: '📦',
  delivered: '✅',
  delayed: '⚠️',
  rerouted: '🔄',
};

export default function ControlTower() {
  const [shipments, setShipments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShipmentMap()
      .then(d => setShipments(d.shipments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="skeleton w-full h-full rounded-2xl" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Control Tower</h1>
          <p className="text-sm text-text-muted mt-1">Live shipment tracking & risk visualization</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green" /> Safe</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber" /> Medium</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red" /> High Risk</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:col-span-3 glass-card overflow-hidden"
          style={{ height: '600px' }}
        >
          {/* World Map Visualization (CSS-based) */}
          <div className="relative w-full h-full bg-bg-primary"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 50%, rgba(0, 229, 255, 0.03) 0%, transparent 50%),
                radial-gradient(circle at 80% 30%, rgba(124, 58, 237, 0.03) 0%, transparent 50%)
              `,
            }}
          >
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(0,229,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.1) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
            />

            {/* Shipment markers positioned on a mercator-like projection */}
            {shipments.map((s) => {
              // Convert lat/lng to x/y percentages (rough mercator)
              const x = ((s.current_lng + 180) / 360) * 100;
              const y = ((90 - s.current_lat) / 180) * 100;
              const color = riskColors[s.risk_level] || riskColors.low;

              return (
                <motion.div
                  key={s.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: s.id * 0.02 }}
                  className="absolute cursor-pointer group"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                  onClick={() => setSelected(s)}
                >
                  {/* Pulse ring for high-risk */}
                  {s.risk_score > 70 && (
                    <span
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ backgroundColor: `${color}33` }}
                    />
                  )}

                  {/* Marker dot */}
                  <div
                    className="relative w-4 h-4 rounded-full border-2 transition-transform hover:scale-150"
                    style={{
                      backgroundColor: color,
                      borderColor: '#0B0F19',
                      boxShadow: `0 0 10px ${color}66`,
                    }}
                  />

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="glass-card px-3 py-2 text-xs whitespace-nowrap">
                      <p className="font-semibold text-text-primary">{s.tracking_id}</p>
                      <p className="text-text-muted">{s.carrier}</p>
                      <p style={{ color }}>Risk: {s.risk_score}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Route lines for selected shipment */}
            {selected && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                <line
                  x1={`${((selected.origin_lng + 180) / 360) * 100}%`}
                  y1={`${((90 - selected.origin_lat) / 180) * 100}%`}
                  x2={`${((selected.current_lng + 180) / 360) * 100}%`}
                  y2={`${((90 - selected.current_lat) / 180) * 100}%`}
                  stroke="#00E5FF"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                  opacity="0.6"
                />
                <line
                  x1={`${((selected.current_lng + 180) / 360) * 100}%`}
                  y1={`${((90 - selected.current_lat) / 180) * 100}%`}
                  x2={`${((selected.dest_lng + 180) / 360) * 100}%`}
                  y2={`${((90 - selected.dest_lat) / 180) * 100}%`}
                  stroke="#7C3AED"
                  strokeWidth="2"
                  strokeDasharray="6 3"
                  opacity="0.4"
                />
              </svg>
            )}

            {/* Map watermark */}
            <div className="absolute bottom-4 left-4 text-xs text-text-muted/40">
              Live Tracking — {shipments.length} shipments
            </div>
          </div>
        </motion.div>

        {/* Shipment Details Panel */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {selected ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary">{selected.tracking_id}</h3>
                <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-primary text-xs cursor-pointer">✕</button>
              </div>
              <StatusBadge status={selected.status} />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <MapPin className="w-4 h-4 text-cyan" />
                  <span>{selected.origin}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Navigation className="w-4 h-4 text-purple" />
                  <span>{selected.destination}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock className="w-4 h-4 text-amber" />
                  <span>ETA: {selected.eta ? new Date(selected.eta).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${selected.risk_score > 70 ? 'text-red' : selected.risk_score > 40 ? 'text-amber' : 'text-green'}`} />
                  <span className="font-semibold" style={{ color: riskColors[selected.risk_level] }}>
                    Risk Score: {selected.risk_score}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-border text-xs text-text-muted">
                Carrier: {selected.carrier}
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-4 text-center text-text-muted text-sm">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Click a marker to view details
            </div>
          )}

          {/* Shipment list */}
          <div className="space-y-2">
            {shipments.slice(0, 15).map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${
                  selected?.id === s.id ? 'bg-cyan/10 border border-cyan/30' : 'bg-bg-card hover:bg-bg-card-hover border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">{s.tracking_id}</p>
                    <p className="text-xs text-text-muted truncate">{s.origin} → {s.destination}</p>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full shrink-0 ml-2"
                    style={{ backgroundColor: riskColors[s.risk_level], boxShadow: `0 0 6px ${riskColors[s.risk_level]}55` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
