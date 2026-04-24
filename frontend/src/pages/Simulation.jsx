/**
 * Simulation Page — What-If scenario engine + demand forecasting.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Beaker, Play, Clock, DollarSign, Leaf, ArrowRight, TrendingUp } from 'lucide-react';
import { runSimulation, getDisruptionTypes, getForecast, getShipments } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function Simulation() {
  const [shipments, setShipments] = useState([]);
  const [disruptionTypes, setDisruptionTypes] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState('');
  const [selectedDisruption, setSelectedDisruption] = useState('route_blocked');
  const [result, setResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [forecastData, setForecastData] = useState([]);
  const [forecastCat, setForecastCat] = useState('Electronics');

  useEffect(() => {
    getShipments({ limit: 20 }).then(d => setShipments(d.shipments || [])).catch(() => {});
    getDisruptionTypes().then(d => setDisruptionTypes(d.types || [])).catch(() => {});
    loadForecast('Electronics');
  }, []);

  const loadForecast = async (cat) => {
    setForecastCat(cat);
    try { const d = await getForecast(cat, 30); setForecastData(d.forecasts || []); } catch (e) { console.error(e); }
  };

  const handleSimulate = async () => {
    if (!selectedShipment) return;
    setSimLoading(true);
    try {
      const r = await runSimulation({ shipment_id: parseInt(selectedShipment), disruption_type: selectedDisruption });
      setResult(r);
    } catch (e) { console.error(e); }
    setSimLoading(false);
  };

  const categories = ['Electronics', 'Automotive Parts', 'Pharmaceuticals', 'Textiles', 'Raw Materials', 'Consumer Goods'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">What-If Simulation</h1>
        <p className="text-sm text-text-muted mt-1">Simulate disruptions and explore alternatives</p>
      </div>
      {/* Simulation Panel */}
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-text-muted mb-1 block">Shipment</label>
            <select value={selectedShipment} onChange={e => setSelectedShipment(e.target.value)} className="w-full bg-bg-primary border border-border rounded-xl px-3 py-2 text-sm text-text-primary outline-none focus:border-cyan">
              <option value="">Select shipment...</option>
              {shipments.map(s => <option key={s.id} value={s.id}>{s.tracking_id} — {s.origin} → {s.destination}</option>)}
            </select>
          </div>
          <div className="min-w-[200px]">
            <label className="text-xs text-text-muted mb-1 block">Disruption</label>
            <select value={selectedDisruption} onChange={e => setSelectedDisruption(e.target.value)} className="w-full bg-bg-primary border border-border rounded-xl px-3 py-2 text-sm text-text-primary outline-none focus:border-cyan">
              {disruptionTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <button onClick={handleSimulate} disabled={simLoading || !selectedShipment} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan/15 text-cyan hover:bg-cyan/25 disabled:opacity-40 transition-colors cursor-pointer font-medium text-sm">
            <Play className="w-4 h-4" /> {simLoading ? 'Running...' : 'Simulate'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Impact Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-4 text-center">
              <Clock className="w-5 h-5 text-amber mx-auto mb-2" />
              <p className="text-xs text-text-muted">Delay Added</p>
              <p className="text-2xl font-bold text-amber">{result.delay_hours}h</p>
            </div>
            <div className="glass-card p-4 text-center">
              <DollarSign className="w-5 h-5 text-red mx-auto mb-2" />
              <p className="text-xs text-text-muted">Cost Increase</p>
              <p className="text-2xl font-bold text-red">+{result.cost_increase_pct}%</p>
            </div>
            <div className="glass-card p-4 text-center">
              <ArrowRight className="w-5 h-5 text-green mx-auto mb-2" />
              <p className="text-xs text-text-muted">Recommendation</p>
              <p className="text-sm font-bold text-green">{result.recommendation}</p>
            </div>
          </div>
          {/* Route Alternatives */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Alternative Routes</h3>
            <div className="space-y-3">
              {(result.alternative_routes || []).map((r, i) => (
                <div key={i} className={`p-4 rounded-xl border transition-colors ${r.is_recommended ? 'border-cyan/30 bg-cyan/5' : 'border-border bg-bg-primary/30'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-text-primary text-sm">{r.name}</h4>
                      {r.is_recommended && <span className="text-xs px-2 py-0.5 rounded-full bg-cyan/15 text-cyan">Recommended</span>}
                    </div>
                    <span className="text-xs text-text-muted">{r.mode}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-xs">
                    <div><span className="text-text-muted">Time</span><p className="font-semibold text-text-primary">{r.duration_days}d</p></div>
                    <div><span className="text-text-muted">Cost</span><p className="font-semibold text-text-primary">${r.cost_usd?.toLocaleString()}</p></div>
                    <div><span className="text-text-muted">Carbon</span><p className="font-semibold text-green">{r.carbon_kg} kg</p></div>
                    <div><span className="text-text-muted">Risk</span><p className={`font-semibold ${r.risk_score > 30 ? 'text-amber' : 'text-green'}`}>{r.risk_score}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {result.savings_vs_disrupted && (
            <div className="glass-card p-4 border-l-3 border-l-green">
              <p className="text-sm text-green font-semibold">💡 Switching to recommended route saves {result.savings_vs_disrupted.time_saved_hours}h and ${Math.abs(result.savings_vs_disrupted.cost_saved_usd).toLocaleString()}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Demand Forecast */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Demand Forecast (LSTM)</h3>
          <div className="flex gap-2">
            {categories.map(c => (
              <button key={c} onClick={() => loadForecast(c)} className={`text-xs px-2 py-1 rounded-lg transition-colors cursor-pointer ${forecastCat === c ? 'bg-purple/15 text-purple' : 'text-text-muted hover:text-text-primary'}`}>{c.split(' ')[0]}</button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData.slice(0, 30).map(f => ({ ...f, day: new Date(f.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) }))}>
              <defs>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#121826', border: '1px solid #1e293b', borderRadius: '12px', color: '#F1F5F9' }} />
              <Area type="monotone" dataKey="upper_bound" stroke="transparent" fill="#7C3AED" fillOpacity={0.08} />
              <Area type="monotone" dataKey="lower_bound" stroke="transparent" fill="transparent" />
              <Area type="monotone" dataKey="predicted_demand" stroke="#7C3AED" fill="url(#colorDemand)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
