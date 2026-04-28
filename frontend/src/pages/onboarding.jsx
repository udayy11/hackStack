/**
 * Onboarding — Interactive multi-step setup with map integration
 * Modern SaaS design using Tailwind CSS + Framer Motion
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, CheckCircle, Check, MapPin, Building2, Globe, MapIcon as MapIconLucide, Zap, X
} from 'lucide-react';
import InteractiveMap from '../components/InteractiveMap';
import { savePreferences } from '../services/api';

const STEPS = [
  { id: 1, title: 'Company Type', icon: Building2 },
  { id: 2, title: 'Supply Chain Type', icon: Globe },
  { id: 3, title: 'Your Regions', icon: MapIconLucide },
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
      const response = await savePreferences(formData);
      console.log('Onboarding data saved:', response);
      // Save to localStorage too
      localStorage.setItem('userPreferences', JSON.stringify(formData));
      // Show success message
      alert(`✅ Setup complete!\n\nCreated:\n• ${response.created?.shipments || 0} shipments\n• ${response.created?.alerts || 0} alerts`);
      // Redirect to dashboard
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Error saving preferences. Please try again.');
    }
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-primary to-purple/5 flex flex-col">
      {/* Header with gradient */}
      <div className="relative border-b border-border/50 bg-gradient-to-r from-bg-primary via-cyan/5 to-purple/5 p-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-text-primary">Setup Your Supply Chain</h1>
            <p className="text-base text-text-secondary mt-2">
              Tell us about your operations to get a personalized dashboard
            </p>
          </motion.div>

          {/* Enhanced Progress bar */}
          <div className="mt-6 space-y-2">
            <div className="w-full h-1.5 bg-bg-card rounded-full overflow-hidden backdrop-blur">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan to-purple rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-cyan">Step {step} of {STEPS.length}</p>
              <p className="text-xs text-text-muted">{Math.round(progress)}% Complete</p>
            </div>
          </div>
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

      {/* Footer with enhanced styling */}
      <div className="border-t border-border/50 p-6 bg-gradient-to-t from-bg-elevated/50 to-bg-elevated/30 backdrop-blur">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {STEPS.map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-2"
              >
                <button
                  onClick={() => step > s.id && setStep(s.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    s.id === step
                      ? 'bg-gradient-to-r from-cyan to-purple text-white shadow-lg shadow-cyan/20'
                      : s.id < step
                      ? 'bg-status-success/20 text-status-success hover:bg-status-success/30'
                      : 'bg-border/50 text-text-muted hover:bg-border'
                  }`}
                >
                  {s.id < step ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <span className="w-3.5 h-3.5 flex items-center justify-center text-xs">{s.id}</span>
                  )}
                  <span className="hidden sm:inline">{s.title}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`hidden sm:block h-0.5 w-8 ${s.id < step ? 'bg-status-success' : 'bg-border/50'}`} />
                )}
              </motion.div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={step === 1}
              className={`btn btn-secondary flex items-center gap-2 transition-all ${step === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10'}`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="text-center text-xs text-text-muted">
              Supply Chain Setup
            </div>

            {step === STEPS.length ? (
              <motion.button
                onClick={handleComplete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <CheckCircle className="w-4 h-4" />
                Complete Setup
              </motion.button>
            ) : (
              <motion.button
                onClick={handleNext}
                disabled={!canProceed()}
                whileHover={canProceed() ? { scale: 1.05 } : {}}
                whileTap={canProceed() ? { scale: 0.95 } : {}}
                className={`btn btn-primary flex items-center gap-2 transition-all ${!canProceed() ? 'opacity-40 cursor-not-allowed' : 'bg-gradient-to-r from-cyan to-purple hover:from-cyan/80 hover:to-purple/80'}`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </motion.button>
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
      className="space-y-6 max-w-4xl"
    >
      <div>
        <h2 className="text-3xl font-bold text-text-primary mb-2">What type of company are you?</h2>
        <p className="text-base text-text-secondary">
          This helps us tailor metrics and recommendations for your business model.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COMPANY_TYPES.map((type) => (
          <motion.button
            key={type.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(type.value)}
            className={`p-6 rounded-2xl border-2 transition-all text-left ${
              value === type.value
                ? 'border-cyan bg-cyan/10 shadow-lg shadow-cyan/20'
                : 'border-border/50 bg-bg-card/50 hover:border-border hover:bg-bg-card'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-bold text-lg text-text-primary">{type.label}</p>
                <p className="text-sm text-text-secondary mt-1">{type.desc}</p>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-4 transition-all ${
                  value === type.value
                    ? 'border-cyan bg-cyan'
                    : 'border-border'
                }`}
              >
                {value === type.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-black rounded-full"
                  />
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Step 2: Supply Chain Type ──
function Step2({ value, onChange }) {
  const types = [
    { value: 'international', label: 'International', desc: 'Global multi-country operations', icon: '🌍' },
    { value: 'regional', label: 'Regional', desc: 'Focus on specific regions', icon: '🗺️' },
    { value: 'domestic', label: 'Domestic', desc: 'Single country operations', icon: '🏢' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 max-w-4xl"
    >
      <div>
        <h2 className="text-3xl font-bold text-text-primary mb-2">What's your geographic scope?</h2>
        <p className="text-base text-text-secondary">
          Help us understand the complexity of your supply network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {types.map((type) => (
          <motion.button
            key={type.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(type.value)}
            className={`p-6 rounded-2xl border-2 transition-all text-center ${
              value === type.value
                ? 'border-purple bg-purple/10 shadow-lg shadow-purple/20'
                : 'border-border/50 bg-bg-card/50 hover:border-border hover:bg-bg-card'
            }`}
          >
            <div className="text-3xl mb-3">{type.icon}</div>
            <p className="font-bold text-lg text-text-primary">{type.label}</p>
            <p className="text-sm text-text-secondary mt-2">{type.desc}</p>
            {value === type.value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-4 pt-4 border-t border-purple/30"
              >
                <span className="text-xs font-bold text-purple">✓ Selected</span>
              </motion.div>
            )}
          </motion.button>
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
      className="space-y-6 max-w-4xl"
    >
      <div>
        <h2 className="text-3xl font-bold text-text-primary mb-2">
          Which regions do you operate in?
        </h2>
        <p className="text-base text-text-secondary">
          Select all that apply. You can focus alerts and metrics on these areas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REGIONS.map((region) => (
          <motion.button
            key={region.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onToggle(region.id)}
            className={`p-5 rounded-2xl border-2 transition-all text-left ${
              selected.includes(region.id)
                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                : 'border-border/50 bg-bg-card/50 hover:border-border hover:bg-bg-card'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-text-primary">{region.name}</p>
              <motion.div
                initial={false}
                animate={selected.includes(region.id) ? { scale: 1 } : { scale: 0.8 }}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selected.includes(region.id)
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-border'
                }`}
              >
                {selected.includes(region.id) && (
                  <span className="text-xs text-white font-bold">✓</span>
                )}
              </motion.div>
            </div>
          </motion.button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan/10 border border-emerald-500/30"
      >
        <p className="text-xs font-bold text-text-primary mb-2">📍 Selected Regions:</p>
        <p className="text-sm text-text-secondary">
          {selected.length === 0
            ? 'No regions selected yet'
            : REGIONS.filter(r => selected.includes(r.id))
              .map(r => r.name)
              .join(', ')}
        </p>
      </motion.div>
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
      className="space-y-6 max-w-4xl"
    >
      <div>
        <h2 className="text-3xl font-bold text-text-primary mb-2">
          What are your top priorities?
        </h2>
        <p className="text-base text-text-secondary">
          Choose at least 2. We'll highlight relevant metrics and alerts based on these.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PRIORITIES_LIST.map((priority) => (
          <motion.button
            key={priority.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onToggle(priority.id)}
            className={`p-6 rounded-2xl border-2 transition-all text-left ${
              selected.includes(priority.id)
                ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                : 'border-border/50 bg-bg-card/50 hover:border-border hover:bg-bg-card'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{priority.icon}</span>
                  <p className="font-bold text-lg text-text-primary">{priority.label}</p>
                </div>
                <p className="text-sm text-text-secondary">{priority.desc}</p>
              </div>
              <motion.div
                initial={false}
                animate={selected.includes(priority.id) ? { scale: 1 } : { scale: 0.8 }}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ml-4 ${
                  selected.includes(priority.id)
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-border'
                }`}
              >
                {selected.includes(priority.id) && (
                  <span className="text-xs text-white font-bold">✓</span>
                )}
              </motion.div>
            </div>
          </motion.button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30"
      >
        <p className="text-xs font-bold text-text-primary mb-3">📋 Setup Summary</p>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-center gap-2">
            <span className={selected.length >= 2 ? 'text-emerald-500' : 'text-text-muted'}>
              {selected.length >= 2 ? '✓' : '○'}
            </span>
            Priorities selected: <span className="font-semibold text-text-primary">{selected.length}/4</span>
          </li>
          <li className="flex items-center gap-2">
            <span className={selected.length >= 2 ? 'text-emerald-500' : 'text-text-muted'}>
              {selected.length >= 2 ? '✓' : '○'}
            </span>
            Ready to complete: <span className="font-semibold text-text-primary">{selected.length >= 2 ? 'Yes!' : 'Select at least 2'}</span>
          </li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
