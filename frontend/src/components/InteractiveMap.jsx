/**
 * InteractiveMap — Clickable map for adding locations during onboarding
 * Reuses mercator projection from ControlTower
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin } from 'lucide-react';

export default function InteractiveMap({ locations, onUpdate, mode = 'setup' }) {
  const [selectedType, setSelectedType] = useState('origin');
  const [mapHover, setMapHover] = useState(null);

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Reverse mercator projection
    const lng = x * 360 - 180;
    const lat = 90 - y * 180;

    const newLocation = {
      id: `${selectedType}-${Date.now()}`,
      lat,
      lng,
      city: 'New Location', // Could geocode with API
      type: selectedType,
    };

    const updatedLocations = { ...locations };
    if (selectedType === 'origin') {
      updatedLocations.origins = [...locations.origins, newLocation];
    } else if (selectedType === 'destination') {
      updatedLocations.destinations = [...locations.destinations, newLocation];
    } else if (selectedType === 'supplier') {
      updatedLocations.suppliers = [...locations.suppliers, newLocation];
    }

    onUpdate(updatedLocations);
  };

  const renderMarker = (location, color) => {
    const x = ((location.lng + 180) / 360) * 100;
    const y = ((90 - location.lat) / 180) * 100;

    return (
      <motion.div
        key={location.id}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute cursor-pointer group"
        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      >
        {/* Outer pulse ring */}
        <div className="absolute w-6 h-6 rounded-full" style={{
          left: '-12px',
          top: '-12px',
          border: `2px solid ${color}`,
          animation: 'pulse 2s ease-in-out infinite',
          opacity: 0.5,
        }} />

        {/* Center dot */}
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />

        {/* Hover tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-bg-card border border-border rounded text-xs text-text-secondary whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          {location.city}
        </div>
      </motion.div>
    );
  };

  const getColor = (type) => {
    if (type === 'origin') return '#0EA5E9';
    if (type === 'destination') return '#10B981';
    if (type === 'supplier') return '#F59E0B';
    return '#6366F1';
  };

  return (
    <div className="space-y-3">
      {/* Mode selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedType('origin')}
          className={`btn btn-sm flex items-center gap-2 ${
            selectedType === 'origin' ? 'ring-2 ring-status-info' : ''
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-status-info" />
          Origin
        </button>
        <button
          onClick={() => setSelectedType('destination')}
          className={`btn btn-sm flex items-center gap-2 ${
            selectedType === 'destination' ? 'ring-2 ring-status-success' : ''
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-status-success" />
          Destination
        </button>
        <button
          onClick={() => setSelectedType('supplier')}
          className={`btn btn-sm flex items-center gap-2 ${
            selectedType === 'supplier' ? 'ring-2 ring-status-warning' : ''
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-status-warning" />
          Supplier
        </button>
      </div>

      {/* Map container */}
      <div
        onClick={handleMapClick}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMapHover({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }}
        className="relative w-full rounded-lg overflow-hidden border border-border cursor-crosshair"
        style={{ height: '500px', backgroundColor: '#0a0e1a' }}
      >
        {/* Map background */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(0, 229, 255, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 30%, rgba(124, 58, 237, 0.03) 0%, transparent 50%)
            `,
          }}
        />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,229,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        {/* Render all markers */}
        {locations.origins.map((loc) => renderMarker(loc, getColor('origin')))}
        {locations.destinations.map((loc) => renderMarker(loc, getColor('destination')))}
        {locations.suppliers.map((loc) => renderMarker(loc, getColor('supplier')))}

        {/* Cursor indicator */}
        {mapHover && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: mapHover.x,
              top: mapHover.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-8 h-8 border border-status-info rounded-full opacity-50" />
            <div className="w-1 h-1 bg-status-info rounded-full absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        )}

        {/* Hint text */}
        {locations.origins.length === 0 && locations.destinations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center pointer-events-none">
              <MapPin className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-muted">Click on the map to add {selectedType}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-xs text-text-secondary">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-status-info" />
          Origins: {locations.origins.length}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-status-success" />
          Destinations: {locations.destinations.length}
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-status-warning" />
          Suppliers: {locations.suppliers.length}
        </div>
      </div>
    </div>
  );
}