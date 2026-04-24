/**
 * Onboarding — Interactive multi-step setup with map integration
 * Users configure their supply chain visually
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, MapPin, Building2, Globe, Zap,
  CheckCircle, Map as MapIcon, Plus, X
} from 'lucide-react';
import InteractiveMap from '../components/InteractiveMap';
import { savePreferences } from '../services/api';

const STEPS = [
  { id: 1, title: 'Company Type', icon: Building2 },
  { id: 2, title: 'Supply Chain Type', icon: Globe },
  { id: 3, title: 'Your Regions', icon: MapIcon },
  { id: 4, title: 'Locations', icon: MapPin },
  { id: 5, title: 'Priorities', icon: Zap },
];

const COMPANY_TYPES = [
  { value: 'manufacturer', label: 'Manufacturer', desc: 'Produce goods' },
  { value: 'retailer', label: 'Retailer', desc: 'Sell to customers' },
  { value: '3pl', label: '3PL Provider', desc: 'Manage logistics' },
  { value: 'distributor', label: 'Distributor', desc: 'Wholesale distribution' },
];

const REGIONS = [
  { id: 'na', name: 'North America', center: { lat: 37, lng: -95 } },
  { id: 'eu', name: 'Europe', center: { lat: 54, lng: 15 } },
  { id: 'apac', name: 'Asia Pacific', center: { lat: 10, lng: 120 } },
  { id: 'latam', name: 'Latin America', center: { lat: -15, lng: -60 } },
  { id: 'mea', name: 'Middle East & Africa', center: { lat: 5, lng: 20 } },
];

const PRIORITIES = [
  { id: 'cost', label: 'Cost Optimization', icon: '💰', desc: 'Minimize logistics costs' },
  { id: 'speed', label: 'Speed & Delivery', icon: '⚡', desc: 'Fast on-time delivery' },
  { id: 'risk', label: 'Risk Mitigation', icon: '🛡️', desc: 'Reduce disruptions' },
  { id: 'sustainability', label: 'Sustainability', icon: '🌱', desc: 'Lower carbon footprint' },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyType: null,
    supplyChainType: null,
    regions: [],
    locations: { origins: [], destinations: [], suppliers: [] },
    priorities: [],
  });

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleRegion = (regionId) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.includes(regionId)
        ? prev.regions.filter(r => r !== regionId)
        : [...prev.regions, regionId],
    }));
  };

  const togglePriority = (priorityId) => {
    setFormData(prev => ({
      ...prev,
      priorities: prev.priorities.includes(priorityId)
        ? prev.priorities.filter(p => p !== priorityId)
        : [...prev.priorities, priorityId],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!formData.companyType;
      case 2: return !!formData.supplyChainType;
      case 3: return formData.regions.length > 0;
      case 4: return formData.locations.origins.length > 0 && formData.locations.destinations.length > 0;
      case 5: return formData.priorities.length >= 2;
      default: return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && step < STEPS.length) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    try {
      // Save to backend
      await savePreferences(formData);
      // Save to localStorage too
      localStorage.setItem('userPreferences', JSON.stringify(formData));
      // Redirect to dashboard
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Error saving preferences. Please try again.');
    }
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-text-primary">Setup Your Supply Chain</h1>
          <p className="text-sm text-text-secondary mt-1">
            Tell us about your operations to get a personalized dashboard
          </p>

          {/* Progress bar */}
          <div className="mt-4 w-full bg-bg-card rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-status-info"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-text-muted mt-2">Step {step} of {STEPS.length}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Step1
                key="step1"
                value={formData.companyType}
                onChange={(v) => updateForm('companyType', v)}
              />
            )}
            {step === 2 && (
              <Step2
                key="step2"
                value={formData.supplyChainType}
                onChange={(v) => updateForm('supplyChainType', v)}
              />
            )}
            {step === 3 && (
              <Step3
                key="step3"
                selected={formData.regions}
                onToggle={toggleRegion}
              />
            )}
            {step === 4 && (
              <Step4
                key="step4"
                locations={formData.locations}
                onUpdate={(locs) => updateForm('locations', locs)}
              />
            )}
            {step === 5 && (
              <Step5
                key="step5"
                selected={formData.priorities}
                onToggle={togglePriority}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-6 bg-bg-elevated">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className={`btn btn-secondary flex items-center gap-2 ${step === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  s.id === step
                    ? 'bg-status-info text-black'
                    : s.id < step
                    ? 'bg-status-success text-white'
                    : 'bg-border text-text-muted'
                }`}
              >
                {s.id < step ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  s.id
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step === STEPS.length ? (
              <button
                onClick={handleComplete}
                className="btn btn-primary flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Complete Setup
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`btn btn-primary flex items-center gap-2 ${!canProceed() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Company Type ──
function Step1({ value, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">What type of company are you?</h2>
        <p className="text-sm text-text-secondary mb-6">
          This helps us tailor metrics and recommendations for your business model.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COMPANY_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            className={`card text-left transition-all ${
              value === type.value ? 'ring-2 ring-status-info' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-text-primary">{type.label}</p>
                <p className="text-xs text-text-secondary mt-1">{type.desc}</p>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  value === type.value
                    ? 'border-status-info bg-status-info'
                    : 'border-border'
                }`}
              >
                {value === type.value && (
                  <div className="w-2 h-2 bg-black rounded-full" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Step 2: Supply Chain Type ──
function Step2({ value, onChange }) {
  const types = [
    { value: 'international', label: 'International', desc: 'Global multi-country operations' },
    { value: 'regional', label: 'Regional', desc: 'Focus on specific regions' },
    { value: 'domestic', label: 'Domestic', desc: 'Single country operations' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">What's your geographic scope?</h2>
        <p className="text-sm text-text-secondary mb-6">
          Help us understand the complexity of your supply network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {types.map((type) => (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            className={`card text-left transition-all ${
              value === type.value ? 'ring-2 ring-status-info' : ''
            }`}
          >
            <p className="font-semibold text-text-primary">{type.label}</p>
            <p className="text-xs text-text-secondary mt-2">{type.desc}</p>
            {value === type.value && (
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-xs font-semibold text-status-info">✓ Selected</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Step 3: Select Regions ──
function Step3({ selected, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Which regions do you operate in?
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          Select all that apply. You can focus alerts and metrics on these areas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REGIONS.map((region) => (
          <button
            key={region.id}
            onClick={() => onToggle(region.id)}
            className={`card transition-all ${
              selected.includes(region.id) ? 'ring-2 ring-status-info' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-text-primary">{region.name}</p>
              <input
                type="checkbox"
                checked={selected.includes(region.id)}
                readOnly
                className="w-5 h-5"
              />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-bg-card border border-border rounded-lg p-4 text-sm text-text-secondary">
        <p className="font-semibold text-text-primary mb-1">You selected:</p>
        <p>
          {selected.length === 0
            ? 'No regions selected yet'
            : REGIONS.filter(r => selected.includes(r.id))
              .map(r => r.name)
              .join(', ')}
        </p>
      </div>
    </motion.div>
  );
}

// ── Step 4: Place Locations on Map ──
function Step4({ locations, onUpdate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Where are your key locations?
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Click on the map to add origins, destinations, and suppliers. At least one origin and destination required.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map - takes up 3 columns */}
        <div className="lg:col-span-3">
          <InteractiveMap
            locations={locations}
            onUpdate={onUpdate}
            mode="setup"
          />
        </div>

        {/* Legend & Controls */}
        <div className="card space-y-4">
          <div>
            <p className="text-sm font-semibold text-text-primary mb-3">Add Locations</p>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-bg-elevated">
                <input type="radio" name="locType" value="origin" />
                <span className="w-3 h-3 rounded-full bg-status-info" />
                <span>Origin</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-bg-elevated">
                <input type="radio" name="locType" value="destination" />
                <span className="w-3 h-3 rounded-full bg-status-success" />
                <span>Destination</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-bg-elevated">
                <input type="radio" name="locType" value="supplier" />
                <span className="w-3 h-3 rounded-full bg-status-warning" />
                <span>Supplier</span>
              </label>
            </div>
          </div>

          <div className="divider" />

          <div>
            <p className="text-xs font-semibold text-text-primary mb-2">Your Locations</p>
            <div className="space-y-2 text-xs">
              {locations.origins.length === 0 && locations.destinations.length === 0 && (
                <p className="text-text-muted">Click on the map to add locations</p>
              )}
              {locations.origins.map((loc) => (
                <div key={`origin-${loc.id}`} className="flex items-center justify-between p-2 rounded bg-status-info/10">
                  <span className="text-text-secondary truncate">{loc.city}</span>
                  <button className="text-status-info hover:text-red">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {locations.destinations.map((loc) => (
                <div key={`dest-${loc.id}`} className="flex items-center justify-between p-2 rounded bg-status-success/10">
                  <span className="text-text-secondary truncate">{loc.city}</span>
                  <button className="text-status-success hover:text-red">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Step 5: Priorities ──
function Step5({ selected, onToggle }) {
  const PRIORITIES_LIST = [
    { id: 'cost', label: 'Cost Optimization', icon: '💰', desc: 'Minimize logistics costs' },
    { id: 'speed', label: 'Speed & Delivery', icon: '⚡', desc: 'Fast on-time delivery' },
    { id: 'risk', label: 'Risk Mitigation', icon: '🛡️', desc: 'Reduce disruptions' },
    { id: 'sustainability', label: 'Sustainability', icon: '🌱', desc: 'Lower carbon footprint' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          What are your top priorities?
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          Choose at least 2. We'll highlight relevant metrics and alerts based on these.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PRIORITIES_LIST.map((priority) => (
          <button
            key={priority.id}
            onClick={() => onToggle(priority.id)}
            className={`card text-left transition-all ${
              selected.includes(priority.id) ? 'ring-2 ring-status-info' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{priority.icon}</span>
                  <p className="font-semibold text-text-primary">{priority.label}</p>
                </div>
                <p className="text-xs text-text-secondary mt-2">{priority.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={selected.includes(priority.id)}
                readOnly
                className="w-5 h-5"
              />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-bg-card border border-border rounded-lg p-4 text-sm">
        <p className="font-semibold text-text-primary mb-2">Summary</p>
        <ul className="space-y-1 text-text-secondary text-xs">
          <li>✓ Priorities selected: {selected.length === 0 ? 'None yet' : selected.length}/4</li>
          <li>✓ Ready to continue: {selected.length >= 2 ? 'Yes ✓' : 'Select at least 2'}</li>
        </ul>
      </div>
    </motion.div>
  );
}