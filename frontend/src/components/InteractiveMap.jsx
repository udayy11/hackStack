/**
 * InteractiveMap — Leaflet-based clickable map for adding locations during onboarding
 * Users can click on the map to add origins, destinations, and suppliers with real geographic coordinates
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Trash2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker component
function LocationMarker({ location, color, onDelete }) {
  const icon = L.divIcon({
    className: 'custom-location-marker',
    html: `
      <div style="
        background-color: ${color};
        border: 3px solid #0B0F19;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        box-shadow: 0 0 12px ${color}88;
      "></div>
    `,
    iconSize: [20, 20],
  });

  return (
    <Marker position={[location.lat, location.lng]} icon={icon}>
      <Popup>
        <div className="text-xs space-y-2">
          <p className="font-semibold text-text-primary capitalize">{location.type}</p>
          <p className="text-text-secondary">{location.city || 'Unnamed Location'}</p>
          <p className="text-text-muted text-xs">{location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°</p>
          <button
            onClick={() => onDelete(location.id)}
            className="mt-2 w-full px-2 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-xs flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

// Map click handler using useMapEvents hook
function MapClickHandler({ selectedType, onLocationAdd }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationAdd({
        id: `${selectedType}-${Date.now()}`,
        lat,
        lng,
        city: 'New Location',
        type: selectedType,
      });
    },
  });
  return null;
}

export default function InteractiveMap({ locations, onUpdate, mode = 'setup' }) {
  const [selectedType, setSelectedType] = useState('origin');

  const handleLocationAdd = (newLocation) => {
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

  const handleDeleteLocation = (id) => {
    const updatedLocations = { ...locations };
    updatedLocations.origins = updatedLocations.origins.filter(loc => loc.id !== id);
    updatedLocations.destinations = updatedLocations.destinations.filter(loc => loc.id !== id);
    updatedLocations.suppliers = updatedLocations.suppliers.filter(loc => loc.id !== id);
    onUpdate(updatedLocations);
  };

  const getColor = (type) => {
    if (type === 'origin') return '#0EA5E9';
    if (type === 'destination') return '#10B981';
    if (type === 'supplier') return '#F59E0B';
    return '#6366F1';
  };

  // Calculate map center from all locations
  const allLocations = [...locations.origins, ...locations.destinations, ...locations.suppliers];
  const mapCenter = allLocations.length > 0
    ? [
        allLocations.reduce((sum, loc) => sum + loc.lat, 0) / allLocations.length,
        allLocations.reduce((sum, loc) => sum + loc.lng, 0) / allLocations.length,
      ]
    : [20, 0]; // Default to world center

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedType('origin')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            selectedType === 'origin'
              ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
              : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          Add Origin
        </button>
        <button
          onClick={() => setSelectedType('destination')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            selectedType === 'destination'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
              : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          Add Destination
        </button>
        <button
          onClick={() => setSelectedType('supplier')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            selectedType === 'supplier'
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
              : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          Add Supplier
        </button>
      </div>

      {/* Map container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full rounded-xl overflow-hidden border border-zinc-800 shadow-2xl"
        style={{ height: '480px' }}
      >
        <MapContainer
          center={mapCenter}
          zoom={3}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <MapClickHandler selectedType={selectedType} onLocationAdd={handleLocationAdd} />
          
          {/* Render all location markers */}
          {locations.origins.map((loc) => (
            <LocationMarker
              key={loc.id}
              location={loc}
              color={getColor('origin')}
              onDelete={handleDeleteLocation}
            />
          ))}
          {locations.destinations.map((loc) => (
            <LocationMarker
              key={loc.id}
              location={loc}
              color={getColor('destination')}
              onDelete={handleDeleteLocation}
            />
          ))}
          {locations.suppliers.map((loc) => (
            <LocationMarker
              key={loc.id}
              location={loc}
              color={getColor('supplier')}
              onDelete={handleDeleteLocation}
            />
          ))}
        </MapContainer>
      </motion.div>

      {/* Help text and stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-white/5 border border-white/10 rounded-lg text-xs text-zinc-300"
        >
          <p className="font-semibold text-white mb-1">💡 How to use</p>
          <p>Select a location type above, then click anywhere on the map to add it.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-3 bg-white/5 border border-white/10 rounded-lg"
        >
          <p className="text-xs font-semibold text-white mb-2">📍 Locations Added</p>
          <div className="space-y-1 text-xs text-zinc-300">
            {allLocations.length === 0 ? (
              <p className="text-zinc-500">No locations yet</p>
            ) : (
              <>
                {locations.origins.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>{locations.origins.length} origin{locations.origins.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                {locations.destinations.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{locations.destinations.length} destination{locations.destinations.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                {locations.suppliers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>{locations.suppliers.length} supplier{locations.suppliers.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}