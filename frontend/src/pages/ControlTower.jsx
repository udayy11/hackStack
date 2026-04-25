/**
 * Control Tower — Live shipment tracking map with Leaflet.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Clock, Shield } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import StatusBadge from '../components/StatusBadge';
import { getShipmentMap } from '../services/api';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const riskColors = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#EF4444',
};

// Custom marker component
function ShipmentMarker({ shipment, isSelected, onClick }) {
  const color = riskColors[shipment.risk_level] || riskColors.low;

  // Create custom icon
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        border: 2px solid #0B0F19;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        box-shadow: 0 0 10px ${color}66;
        ${shipment.risk_score > 70 ? 'animation: pulse 2s infinite;' : ''}
      "></div>
    `,
    iconSize: [16, 16],
    className: 'leaflet-marker',
  });

  return (
    <Marker
      position={[shipment.current_lat, shipment.current_lng]}
      icon={icon}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Popup>
        <div className="text-xs space-y-1">
          <p className="font-semibold">{shipment.tracking_id}</p>
          <p>{shipment.carrier}</p>
          <p style={{ color }}>Risk: {shipment.risk_score}</p>
        </div>
      </Popup>
    </Marker>
  );
}

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

  if (loading) 
    return (
      <div className="flex items-center justify-center h-96">
        <div className="skeleton w-full h-full rounded-2xl" />
      </div>
    );

  // Calculate map center from shipments
  const center = shipments.length > 0
    ? [
        shipments.reduce((sum, s) => sum + s.current_lat, 0) / shipments.length,
        shipments.reduce((sum, s) => sum + s.current_lng, 0) / shipments.length,
      ]
    : [20, 0]; // Default to world center

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Control Tower</h1>
          <p className="text-sm text-text-muted mt-1">Live shipment tracking & risk visualization</p>
        </div>
        <div className="flex items-center gap-3">
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
          className="lg:col-span-3 glass-card overflow-hidden rounded-2xl"
          style={{ height: '600px' }}
        >
          <MapContainer
            center={center}
            zoom={3}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {shipments.map(s => (
              <ShipmentMarker
                key={s.id}
                shipment={s}
                isSelected={selected?.id === s.id}
                onClick={() => setSelected(s)}
              />
            ))}
          </MapContainer>
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
                <button 
                  onClick={() => setSelected(null)} 
                  className="text-text-muted hover:text-text-primary text-xs cursor-pointer"
                >
                  ✕
                </button>
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