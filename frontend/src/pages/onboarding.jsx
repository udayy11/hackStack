/**
 * Onboarding — Redesigned multi-step setup
 * Industrial-utilitarian aesthetic with Syne + DM Mono typography
 */
import { useState, useEffect } from 'react';
import { savePreferences } from '../services/api';

// ── Design tokens ──────────────────────────────────────────────────────────────
const tokens = {
  ink: '#0f0e0d',
  ink2: '#4a4844',
  ink3: '#9a9790',
  surface: '#faf9f7',
  surface2: '#f1efe9',
  surface3: '#e8e5dc',
  line: '#d8d4c8',
  accent: '#c84b18',
  accentSoft: '#f9ede7',
  accent2: '#1a6b4a',
  accent2Soft: '#e8f4ee',
  dotBlue: '#1a6b8a',
  dotAmber: '#b86a00',
};

// ── Static data ────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Company' },
  { id: 2, label: 'Scope' },
  { id: 3, label: 'Regions' },
  { id: 4, label: 'Locations' },
  { id: 5, label: 'Priorities' },
];

const COMPANY_TYPES = [
  { value: 'manufacturer', label: 'Manufacturer', desc: 'Produce goods for downstream distribution' },
  { value: 'retailer',     label: 'Retailer',     desc: 'Sell goods directly to end customers' },
  { value: '3pl',          label: '3PL Provider', desc: 'Manage logistics on behalf of clients' },
  { value: 'distributor',  label: 'Distributor',  desc: 'Wholesale distribution and fulfillment' },
];

const SUPPLY_TYPES = [
  { value: 'international', label: 'International', desc: 'Multi-country, cross-border operations' },
  { value: 'regional',      label: 'Regional',      desc: 'Focused on one or two geographic regions' },
  { value: 'domestic',      label: 'Domestic',      desc: 'Single country operations' },
];

const REGIONS = [
  { id: 'na',   name: 'North America' },
  { id: 'eu',   name: 'Europe' },
  { id: 'apac', name: 'Asia Pacific' },
  { id: 'latam', name: 'Latin America' },
  { id: 'mea',  name: 'Middle East & Africa' },
];

const PRIORITIES = [
  { id: 'cost',           icon: '💰', label: 'Cost optimization', desc: 'Minimize logistics spend' },
  { id: 'speed',          icon: '⚡', label: 'Speed & delivery',  desc: 'Maintain fast on-time delivery' },
  { id: 'risk',           icon: '🛡️', label: 'Risk mitigation',   desc: 'Reduce operational disruptions' },
  { id: 'sustainability', icon: '🌱', label: 'Sustainability',     desc: 'Reduce carbon footprint' },
];

const PIN_NAMES = ['Shanghai', 'Rotterdam', 'Chicago', 'Singapore', 'Los Angeles', 'Hamburg', 'Mumbai', 'Dubai'];

// ── Shared styles (CSS-in-JS objects) ─────────────────────────────────────────
const s = {
  shell: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: tokens.surface,
    color: tokens.ink,
    fontFamily: "'Syne', sans-serif",
  },
  // Header
  header: {
    borderBottom: `1.5px solid ${tokens.line}`,
    padding: '24px 32px 20px',
    background: tokens.surface,
  },
  headerTop: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.12em',
    color: tokens.ink3,
    textTransform: 'uppercase',
  },
  stepCounter: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: tokens.ink3,
    letterSpacing: '0.06em',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: tokens.ink,
    lineHeight: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    color: tokens.ink3,
  },
  // Progress track
  track: {
    display: 'flex',
    gap: 3,
    marginTop: 20,
    paddingBottom: 22,
  },
  // Body
  body: {
    flex: 1,
    padding: '40px 32px',
    overflow: 'auto',
  },
  // Step head
  stepNum: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: tokens.accent,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: '-0.04em',
    lineHeight: 1.1,
    color: tokens.ink,
    marginBottom: 8,
  },
  stepDesc: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: tokens.ink3,
    lineHeight: 1.6,
    maxWidth: 480,
    marginBottom: 28,
  },
  // Grid
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  // Card
  card: (selected, green = false) => ({
    border: `1.5px solid ${selected ? (green ? tokens.accent2 : tokens.accent) : tokens.line}`,
    borderRadius: 3,
    padding: 20,
    background: selected ? (green ? tokens.accent2Soft : tokens.accentSoft) : tokens.surface,
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
    textAlign: 'left',
  }),
  cardLabel: {
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    color: tokens.ink,
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDesc: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: tokens.ink3,
    lineHeight: 1.5,
  },
  dot: (selected, green = false) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: `1.5px solid ${selected ? (green ? tokens.accent2 : tokens.accent) : tokens.line}`,
    background: selected ? (green ? tokens.accent2 : tokens.accent) : 'transparent',
    flexShrink: 0,
    transition: 'all 0.15s',
  }),
  checkbox: (selected) => ({
    width: 14,
    height: 14,
    border: `1.5px solid ${selected ? tokens.accent2 : tokens.line}`,
    borderRadius: 2,
    background: selected ? tokens.accent2 : 'transparent',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    color: '#fff',
    fontSize: 9,
    fontWeight: 700,
  }),
  priIcon: (selected) => ({
    width: 32,
    height: 32,
    border: `1.5px solid ${selected ? tokens.accent2 : tokens.line}`,
    borderRadius: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    marginBottom: 12,
    transition: 'border-color 0.15s',
  }),
  // Summary strip
  summary: {
    marginTop: 24,
    border: `1.5px solid ${tokens.line}`,
    borderRadius: 3,
    padding: '14px 18px',
    background: tokens.surface2,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  summaryLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: tokens.ink3,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    flexShrink: 0,
  },
  summaryVal: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: tokens.ink,
  },
  // Map
  mapLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 180px',
    gap: 10,
  },
  map: {
    border: `1.5px solid ${tokens.line}`,
    borderRadius: 3,
    background: tokens.surface2,
    height: 340,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
    cursor: 'crosshair',
  },
  mapGridBg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `linear-gradient(${tokens.line} 1px, transparent 1px), linear-gradient(90deg, ${tokens.line} 1px, transparent 1px)`,
    backgroundSize: '36px 36px',
    opacity: 0.4,
    pointerEvents: 'none',
  },
  mapLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: tokens.ink3,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    zIndex: 1,
  },
  mapSub: {
    fontSize: 13,
    fontWeight: 600,
    color: tokens.ink2,
    zIndex: 1,
  },
  // Legend
  legend: {
    border: `1.5px solid ${tokens.line}`,
    borderRadius: 3,
    padding: 18,
    background: tokens.surface,
  },
  legendTitle: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: tokens.ink3,
    marginBottom: 14,
  },
  radioRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 2,
    cursor: 'pointer',
    marginBottom: 4,
  },
  locTag: (type) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 10px',
    borderRadius: 2,
    marginBottom: 4,
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    background: type === 'origin' ? 'rgba(26,107,138,0.08)' : tokens.accent2Soft,
    color: type === 'origin' ? tokens.dotBlue : tokens.accent2,
  }),
  // Footer
  footer: {
    borderTop: `1.5px solid ${tokens.line}`,
    padding: '20px 32px',
    background: tokens.surface,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btn: (variant, disabled) => ({
    fontFamily: "'Syne', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: '0.01em',
    padding: '9px 20px',
    borderRadius: 3,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '1.5px solid',
    opacity: disabled ? 0.35 : 1,
    transition: 'all 0.12s',
    ...(variant === 'ghost' && {
      background: 'transparent',
      borderColor: tokens.line,
      color: tokens.ink2,
    }),
    ...(variant === 'primary' && {
      background: tokens.ink,
      borderColor: tokens.ink,
      color: tokens.surface,
    }),
    ...(variant === 'complete' && {
      background: tokens.accent2,
      borderColor: tokens.accent2,
      color: '#fff',
    }),
  }),
  pip: (state) => ({
    width: 24,
    height: 24,
    borderRadius: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    border: `1.5px solid ${state === 'active' ? tokens.ink : state === 'done' ? tokens.accent2 : tokens.line}`,
    background: state === 'active' ? tokens.ink : state === 'done' ? tokens.accent2 : 'transparent',
    color: state === 'active' || state === 'done' ? '#fff' : tokens.ink3,
    transition: 'all 0.2s',
  }),
  seg: (state) => ({
    flex: 1,
    height: 3,
    background: state === 'done' ? tokens.accent2 : state === 'active' ? tokens.accent : tokens.surface3,
    position: 'relative',
    transition: 'background 0.4s ease',
  }),
  segLabel: (state) => ({
    position: 'absolute',
    top: 8,
    left: 0,
    fontFamily: "'DM Mono', monospace",
    fontSize: 10,
    color: state === 'active' ? tokens.accent : state === 'done' ? tokens.accent2 : tokens.ink3,
    whiteSpace: 'nowrap',
    letterSpacing: '0.04em',
  }),
  // Complete screen
  completeWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
    gap: 12,
    animation: 'fadeUp 0.3s ease both',
  },
  completeBadge: {
    width: 44,
    height: 44,
    borderRadius: 3,
    background: tokens.accent2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 22,
    fontWeight: 700,
  },
};

// ── Segment component ──────────────────────────────────────────────────────────
function Seg({ label, state: segState }) {
  return (
    <div style={s.seg(segState)}>
      <span style={s.segLabel(segState)}>{label}</span>
    </div>
  );
}

// ── Step 1: Company type ───────────────────────────────────────────────────────
function Step1({ value, onChange }) {
  return (
    <div>
      <div style={s.stepNum}>Step 01 — Company type</div>
      <div style={s.stepTitle}>What kind of company are you?</div>
      <div style={s.stepDesc}>Tailors your metric priorities and default alert thresholds.</div>
      <div style={s.grid2}>
        {COMPANY_TYPES.map((t) => (
          <button key={t.value} style={s.card(value === t.value)} onClick={() => onChange(t.value)}>
            <div style={s.cardLabel}>
              {t.label}
              <div style={s.dot(value === t.value)} />
            </div>
            <div style={s.cardDesc}>{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: Geographic scope ───────────────────────────────────────────────────
function Step2({ value, onChange }) {
  return (
    <div>
      <div style={s.stepNum}>Step 02 — Geographic scope</div>
      <div style={s.stepTitle}>How far does your network reach?</div>
      <div style={s.stepDesc}>Determines which disruption feeds and routing logic we apply.</div>
      <div style={s.grid3}>
        {SUPPLY_TYPES.map((t) => (
          <button key={t.value} style={s.card(value === t.value)} onClick={() => onChange(t.value)}>
            <div style={s.cardLabel}>
              {t.label}
              <div style={s.dot(value === t.value)} />
            </div>
            <div style={s.cardDesc}>{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 3: Regions ────────────────────────────────────────────────────────────
function Step3({ selected, onToggle }) {
  const names = REGIONS.filter((r) => selected.includes(r.id)).map((r) => r.name).join(', ') || 'None selected';
  return (
    <div>
      <div style={s.stepNum}>Step 03 — Regions</div>
      <div style={s.stepTitle}>Where do you operate?</div>
      <div style={s.stepDesc}>Filters alerts, routes, and supplier data to your active regions.</div>
      <div style={s.grid3}>
        {REGIONS.map((r) => {
          const sel = selected.includes(r.id);
          return (
            <button key={r.id} style={s.card(sel, true)} onClick={() => onToggle(r.id)}>
              <div style={s.cardLabel}>
                {r.name}
                <div style={s.checkbox(sel)}>{sel && '✓'}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div style={s.summary}>
        <span style={s.summaryLabel}>Selected</span>
        <span style={s.summaryVal}>{names}</span>
      </div>
    </div>
  );
}

// ── Step 4: Locations ──────────────────────────────────────────────────────────
function Step4({ locations, onUpdate }) {
  const [locType, setLocType] = useState('origin');
  const [pins, setPins] = useState([]);
  const pinIdx = { current: 0 };

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const name = PIN_NAMES[pinIdx.current++ % PIN_NAMES.length];

    const newPin = { x, y, type: locType, name };
    setPins((prev) => [...prev, newPin]);

    if (locType === 'origin') {
      onUpdate({ ...locations, origins: [...locations.origins, { id: Date.now(), city: name }] });
    } else if (locType === 'destination') {
      onUpdate({ ...locations, destinations: [...locations.destinations, { id: Date.now(), city: name }] });
    } else {
      onUpdate({ ...locations, suppliers: [...(locations.suppliers || []), { id: Date.now(), city: name }] });
    }
  };

  const removeOrigin = (idx) => {
    onUpdate({ ...locations, origins: locations.origins.filter((_, i) => i !== idx) });
  };
  const removeDest = (idx) => {
    onUpdate({ ...locations, destinations: locations.destinations.filter((_, i) => i !== idx) });
  };

  const dotColor = { origin: tokens.dotBlue, destination: tokens.accent2, supplier: tokens.dotAmber };
  const o = locations.origins.length;
  const d = locations.destinations.length;
  const statusText = `${o} origin${o !== 1 ? 's' : ''}, ${d} destination${d !== 1 ? 's' : ''} — ${o > 0 && d > 0 ? 'ready to continue' : 'add at least one of each'}`;

  return (
    <div>
      <div style={s.stepNum}>Step 04 — Key locations</div>
      <div style={s.stepTitle}>Pin your origins & destinations</div>
      <div style={s.stepDesc}>At minimum one origin and one destination required.</div>

      <div style={s.mapLayout}>
        {/* Map */}
        <div style={s.map} onClick={handleMapClick}>
          <div style={s.mapGridBg} />
          <div style={s.mapSub}>Interactive map</div>
          <div style={s.mapLabel}>Click to add locations</div>
          {pins.map((pin, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: pin.x - 5,
                top: pin.y - 5,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: dotColor[pin.type],
                border: '2px solid #fff',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={s.legend}>
          <div style={s.legendTitle}>Add as</div>
          {[
            { value: 'origin', color: tokens.dotBlue, label: 'Origin' },
            { value: 'destination', color: tokens.accent2, label: 'Destination' },
            { value: 'supplier', color: tokens.dotAmber, label: 'Supplier' },
          ].map((lt) => (
            <label key={lt.value} style={s.radioRow}>
              <input
                type="radio"
                name="locType"
                value={lt.value}
                checked={locType === lt.value}
                onChange={() => setLocType(lt.value)}
                style={{ accentColor: tokens.accent }}
              />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: lt.color, flexShrink: 0 }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: tokens.ink2 }}>{lt.label}</span>
            </label>
          ))}

          <div style={{ marginTop: 16, borderTop: `1px solid ${tokens.line}`, paddingTop: 14 }}>
            <div style={s.legendTitle}>Origins</div>
            {locations.origins.length === 0
              ? <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: tokens.ink3 }}>None yet</div>
              : locations.origins.map((loc, i) => (
                  <div key={loc.id} style={s.locTag('origin')}>
                    {loc.city}
                    <button
                      onClick={() => removeOrigin(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 14, padding: 0, opacity: 0.6 }}
                    >×</button>
                  </div>
                ))}

            <div style={{ ...s.legendTitle, marginTop: 12 }}>Destinations</div>
            {locations.destinations.length === 0
              ? <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: tokens.ink3 }}>None yet</div>
              : locations.destinations.map((loc, i) => (
                  <div key={loc.id} style={s.locTag('destination')}>
                    {loc.city}
                    <button
                      onClick={() => removeDest(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 14, padding: 0, opacity: 0.6 }}
                    >×</button>
                  </div>
                ))}
          </div>
        </div>
      </div>

      <div style={s.summary}>
        <span style={s.summaryLabel}>Status</span>
        <span style={s.summaryVal}>{statusText}</span>
      </div>
    </div>
  );
}

// ── Step 5: Priorities ─────────────────────────────────────────────────────────
function Step5({ selected, onToggle }) {
  return (
    <div>
      <div style={s.stepNum}>Step 05 — Priorities</div>
      <div style={s.stepTitle}>What matters most?</div>
      <div style={s.stepDesc}>Select at least 2. Highlights the most relevant metrics in your dashboard.</div>
      <div style={s.grid2}>
        {PRIORITIES.map((p) => {
          const sel = selected.includes(p.id);
          return (
            <button key={p.id} style={s.card(sel, true)} onClick={() => onToggle(p.id)}>
              <div style={s.priIcon(sel)}>{p.icon}</div>
              <div style={s.cardLabel}>
                {p.label}
                <div style={s.checkbox(sel)}>{sel && '✓'}</div>
              </div>
              <div style={s.cardDesc}>{p.desc}</div>
            </button>
          );
        })}
      </div>
      <div style={s.summary}>
        <span style={s.summaryLabel}>Selected</span>
        <span style={s.summaryVal}>
          {selected.length}/4 — {selected.length >= 2 ? 'Ready to continue' : 'Select at least 2'}
        </span>
      </div>
    </div>
  );
}

// ── Complete screen ────────────────────────────────────────────────────────────
function CompleteScreen() {
  return (
    <div style={s.completeWrap}>
      <div style={s.completeBadge}>✓</div>
      <div style={s.stepTitle}>Setup complete</div>
      <div style={s.stepDesc}>Your dashboard is being configured. Redirecting you now…</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [formData, setFormData] = useState({
    companyType: null,
    supplyChainType: null,
    regions: [],
    locations: { origins: [], destinations: [], suppliers: [] },
    priorities: [],
  });

  // Inject fonts once
  useEffect(() => {
    if (!document.getElementById('ob-fonts')) {
      const link = document.createElement('link');
      link.id = 'ob-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById('ob-keyframes')) {
      const style = document.createElement('style');
      style.id = 'ob-keyframes';
      style.textContent = `@keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`;
      document.head.appendChild(style);
    }
  }, []);

  const updateForm = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const toggleRegion = (id) => {
    setFormData((prev) => ({
      ...prev,
      regions: prev.regions.includes(id) ? prev.regions.filter((r) => r !== id) : [...prev.regions, id],
    }));
  };

  const togglePriority = (id) => {
    setFormData((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(id) ? prev.priorities.filter((p) => p !== id) : [...prev.priorities, id],
    }));
  };

  const canProceed = () => {
    if (step === 1) return !!formData.companyType;
    if (step === 2) return !!formData.supplyChainType;
    if (step === 3) return formData.regions.length > 0;
    if (step === 4) return formData.locations.origins.length > 0 && formData.locations.destinations.length > 0;
    if (step === 5) return formData.priorities.length >= 2;
    return false;
  };

  const handleNext = () => { if (canProceed() && step < 5) setStep((s) => s + 1); };
  const handlePrev = () => { if (step > 1) setStep((s) => s - 1); };

  const handleComplete = async () => {
    try {
      await savePreferences(formData);
      localStorage.setItem('userPreferences', JSON.stringify(formData));
      setDone(true);
      setTimeout(() => { window.location.href = '/'; }, 1800);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      alert('Error saving preferences. Please try again.');
    }
  };

  const segState = (id) => (id < step ? 'done' : id === step ? 'active' : 'idle');
  const pipState = (id) => (id < step ? 'done' : id === step ? 'active' : 'idle');

  return (
    <div style={s.shell}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <span style={s.logo}>Chainview — Setup</span>
          <span style={s.stepCounter}>Step {step} of 5</span>
        </div>
        <div style={s.title}>Configure your supply chain</div>
        <div style={s.subtitle}>Personalize your dashboard in a few steps</div>
        <div style={s.track}>
          {STEPS.map((seg) => (
            <Seg key={seg.id} label={seg.label} state={segState(seg.id)} />
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={s.body}>
        <div style={{ animation: 'fadeUp 0.25s ease both' }} key={step}>
          {done ? (
            <CompleteScreen />
          ) : step === 1 ? (
            <Step1 value={formData.companyType} onChange={(v) => updateForm('companyType', v)} />
          ) : step === 2 ? (
            <Step2 value={formData.supplyChainType} onChange={(v) => updateForm('supplyChainType', v)} />
          ) : step === 3 ? (
            <Step3 selected={formData.regions} onToggle={toggleRegion} />
          ) : step === 4 ? (
            <Step4 locations={formData.locations} onUpdate={(locs) => updateForm('locations', locs)} />
          ) : (
            <Step5 selected={formData.priorities} onToggle={togglePriority} />
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      {!done && (
        <div style={s.footer}>
          <button style={s.btn('ghost', step === 1)} disabled={step === 1} onClick={handlePrev}>
            ← Previous
          </button>

          <div style={{ display: 'flex', gap: 6 }}>
            {STEPS.map((p) => (
              <div key={p.id} style={s.pip(pipState(p.id))}>
                {pipState(p.id) === 'done' ? '✓' : p.id}
              </div>
            ))}
          </div>

          {step === 5 ? (
            <button style={s.btn('complete', !canProceed())} disabled={!canProceed()} onClick={handleComplete}>
              Complete setup ✓
            </button>
          ) : (
            <button style={s.btn('primary', !canProceed())} disabled={!canProceed()} onClick={handleNext}>
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
