/**
 * API service — centralized HTTP client for all backend calls.
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API call failed: ${endpoint}`, err);
    throw err;
  }
}

// ── Dashboard ──
export const getDashboard = () => request('/dashboard');

export const getDashboardPersonalized = (preferences) => {
  const params = new URLSearchParams();
  
  // Only add params if they have values
  if (preferences?.priorities && preferences.priorities.length > 0) {
    params.append('priorities', preferences.priorities.join(','));
  }
  if (preferences?.regions && preferences.regions.length > 0) {
    params.append('regions', preferences.regions.join(','));
  }
  
  const query = params.toString();
  console.log('Dashboard API call with params:', query); // Debug logging
  
  return request(`/dashboard${query ? '?' + query : ''}`);
};

export const savePreferences = (preferences) => {
  return request('/dashboard/preferences', {
    method: 'POST',
    body: JSON.stringify(preferences),
  });
};

export const getPreferences = () => {
  return request('/dashboard/preferences');
};

// ── Shipments ──
export const getShipments = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/shipments${qs ? '?' + qs : ''}`);
};
export const getShipmentMap = () => request('/shipments/map');
export const getShipment = (id) => request(`/shipments/${id}`);

// ── Risk ──
export const getRiskOverview = () => request('/risk/overview');
export const getRiskScore = (id) => request(`/risk/score/${id}`);
export const getRiskHistory = (id) => request(`/risk/history/${id}`);
export const evaluateAllRisks = () => request('/risk/evaluate', { method: 'POST' });

// ── Decision ──
export const evaluateShipment = (id) => request(`/decision/evaluate/${id}`);
export const getRecentDecisions = () => request('/decision/recent');

// ── Actions ──
export const executeActions = (id) => request(`/actions/execute/${id}`, { method: 'POST' });
export const getEcoAlternatives = (id) => request(`/actions/eco/${id}`);
export const getActionLog = () => request('/actions/log');

// ── Alerts ──
export const getAlerts = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/alerts${qs ? '?' + qs : ''}`);
};
export const markAlertRead = (id) => request(`/alerts/${id}/read`, { method: 'PUT' });
export const resolveAlert = (id) => request(`/alerts/${id}/resolve`, { method: 'PUT' });

// ── Suppliers ──
export const getSuppliers = () => request('/suppliers');
export const getSupplier = (id) => request(`/suppliers/${id}`);

// ── Simulation ──
export const runSimulation = (data) => request('/simulation/what-if', {
  method: 'POST',
  body: JSON.stringify(data),
});
export const getForecast = (category, days = 30) => request(`/simulation/forecast/${category}?days=${days}`);
export const getDisruptionTypes = () => request('/simulation/disruption-types');

// ── Chat ──
export const sendChatMessage = (message, context = null) => request('/chat', {
  method: 'POST',
  body: JSON.stringify({ message, context }),
});
export const getChatSuggestions = () => request('/chat/suggestions');

// ── Learning ──
export const getLearningMetrics = () => request('/learning/metrics');
export const optimizeWeights = () => request('/learning/optimize-weights', { method: 'POST' });
export const retrainModels = () => request('/learning/retrain', { method: 'POST' });
export const getLearningSum = () => request('/learning/summary');
