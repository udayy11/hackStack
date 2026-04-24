/**
 * Shipments Table — filterable, searchable shipment list.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getShipments } from '../services/api';

const STATUS_OPTIONS = ['all', 'in_transit', 'pending', 'delivered', 'delayed', 'rerouted'];

export default function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await getShipments(params);
      setShipments(data.shipments || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Shipments</h1>
        <p className="text-sm text-text-muted mt-1">{total} total shipments</p>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 rounded-xl bg-bg-card border border-border px-3 py-2">
            <Search className="w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tracking ID, origin, destination..."
              className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-cyan/15 text-cyan border border-cyan/30'
                  : 'bg-bg-card text-text-muted hover:text-text-primary border border-transparent'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Carrier</th>
                <th>Risk</th>
                <th>Weight</th>
                <th>Value</th>
                <th>ETA</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j}><div className="skeleton h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : shipments.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-text-muted">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  No shipments found
                </td></tr>
              ) : shipments.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-cyan">{s.tracking_id}</td>
                  <td className="text-text-secondary">{s.origin}</td>
                  <td className="text-text-secondary">{s.destination}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="text-text-secondary text-xs">{s.carrier}</td>
                  <td>
                    <span className={`font-bold ${
                      s.risk_score > 70 ? 'text-red' : s.risk_score > 40 ? 'text-amber' : 'text-green'
                    }`}>{s.risk_score}</span>
                  </td>
                  <td className="text-text-muted text-xs">{s.weight_kg?.toLocaleString()} kg</td>
                  <td className="text-text-muted text-xs">${s.value_usd?.toLocaleString()}</td>
                  <td className="text-text-muted text-xs">{s.eta ? new Date(s.eta).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-text-muted">Page {page} of {pages}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-bg-card hover:bg-bg-elevated disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="p-1.5 rounded-lg bg-bg-card hover:bg-bg-elevated disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
