# Smart Resilient Logistics & Dynamic Supply Chain Optimization System

> AI-powered supply chain command center with real-time tracking, disruption prediction, automated decision-making, and continuous learning.

![Dashboard](https://img.shields.io/badge/Dashboard-Live-00E5FF) ![API](https://img.shields.io/badge/API-FastAPI-22C55E) ![AI](https://img.shields.io/badge/AI-LSTM%20%2B%20NLP-7C3AED)

---

## 🎯 Overview

A complete, production-ready logistics platform featuring:

- **Real-time shipment tracking** with risk-colored map visualization
- **AI Decision Engine** — LSTM demand forecasting, NLP disruption detection, multi-factor risk scoring
- **Automated Actions** — reroute shipments, switch suppliers, rebalance stock, create POs
- **What-If Simulation** — test disruption scenarios before they happen
- **AI Chat Assistant** — ask questions about your supply chain in natural language
- **Carbon Optimization** — eco-friendly route alternatives with CO₂ impact
- **Learning Loop** — tracks prediction accuracy and auto-improves models

---

## 📁 Project Structure

```
smart-logistics/
├── backend/
│   ├── main.py                    # FastAPI application entry point
│   ├── config.py                  # Environment configuration
│   ├── requirements.txt           # Python dependencies
│   ├── Dockerfile                 # Backend container
│   ├── ai/                        # AI/ML modules
│   │   ├── demand_forecasting.py  # LSTM-based demand prediction
│   │   ├── disruption_detection.py# NLP + anomaly detection
│   │   ├── risk_scoring.py        # Multi-factor risk engine (0-100)
│   │   ├── route_optimization.py  # Multi-modal route optimizer
│   │   └── chat_assistant.py      # AI chat Q&A
│   ├── database/
│   │   ├── connection.py          # Async SQLAlchemy engine
│   │   └── models.py              # ORM models (9 tables)
│   ├── data/
│   │   └── seed_data.py           # Demo data generator
│   ├── routers/                   # API endpoints
│   │   ├── dashboard.py           # /api/dashboard
│   │   ├── shipments.py           # /api/shipments
│   │   ├── risk.py                # /api/risk
│   │   ├── decisions.py           # /api/decision
│   │   ├── actions.py             # /api/actions
│   │   ├── alerts.py              # /api/alerts
│   │   ├── suppliers.py           # /api/suppliers
│   │   ├── simulation.py          # /api/simulation
│   │   ├── chat.py                # /api/chat
│   │   └── learning.py            # /api/learning
│   └── services/
│       ├── websocket_manager.py   # Real-time push
│       ├── decision_engine.py     # AI decision orchestrator
│       ├── action_engine.py       # Automated action executor
│       └── learning_loop.py       # Model improvement tracker
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx                # Root + routing
│       ├── index.css              # Dark futuristic theme
│       ├── components/
│       │   ├── Sidebar.jsx        # Navigation
│       │   ├── ChatPanel.jsx      # AI assistant (floating)
│       │   ├── KpiCard.jsx        # Animated stat card
│       │   ├── RiskGauge.jsx      # SVG circular gauge
│       │   └── StatusBadge.jsx    # Color-coded badges
│       ├── pages/
│       │   ├── Dashboard.jsx      # KPIs + risk + alerts
│       │   ├── ControlTower.jsx   # Live map tracking
│       │   ├── Shipments.jsx      # Filterable table
│       │   ├── Alerts.jsx         # Alert management
│       │   ├── Suppliers.jsx      # Supplier scorecard
│       │   ├── ActionLog.jsx      # Action audit trail
│       │   ├── Simulation.jsx     # What-if + forecast
│       │   └── Learning.jsx       # AI metrics + retraining
│       ├── services/
│       │   └── api.js             # API client
│       └── hooks/
│           └── useWebSocket.js    # Real-time hook
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **npm**

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the server (auto-creates DB + seeds demo data)
python -m uvicorn main:app --reload --port 8000
```

The backend will:
- Create SQLite database automatically
- Seed 25 shipments, 8 suppliers, alerts, forecasts, and more
- Start serving at http://localhost:8000
- API docs at http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at http://localhost:5173 with hot-reload.

### 3. Docker (Optional)

```bash
docker-compose up --build
```

---

## 📱 UI Pages

| Page | Description |
|------|-------------|
| **Dashboard** | KPI cards (OTIF, cost, carbon), risk gauge, alerts panel, high-risk shipments |
| **Control Tower** | Live map with risk-colored markers, route lines, shipment detail panel |
| **Shipments** | Searchable/filterable table with status badges, risk scores, pagination |
| **Alerts** | Real-time alert cards with severity filtering, mark-read, resolve actions |
| **Suppliers** | Ranked supplier scorecards with reliability bars, star ratings, OTIF metrics |
| **Action Log** | Timeline of AI-triggered actions with reasoning, risk/cost/carbon impact |
| **Simulation** | What-if disruption engine + LSTM demand forecast chart |
| **AI Learning** | Model accuracy metrics, weight optimization, retraining controls |
| **AI Chat** | Floating assistant (all pages) for natural-language supply chain queries |

---

## 🧠 AI Modules

### 1. Demand Forecasting (LSTM)
- Predicts 30-day demand per product category
- Captures trend, weekly/monthly seasonality
- Confidence intervals that widen with forecast horizon

### 2. Disruption Detection (NLP + Anomaly)
- Text analysis: scans for weather, geopolitical, operational keywords
- Sensor anomaly: monitors temperature, humidity, delay thresholds
- Returns severity scores and risk adjustments

### 3. Risk Scoring (0-100)
- **7 weighted factors**: weather, traffic, supplier, demand, geopolitical, IoT, historical
- Decision thresholds: <40 auto-approve, 40-70 monitor, >70 trigger action
- Weights updated by learning loop

### 4. Route Optimization
- Multi-modal routing: ocean, air, rail, truck
- Carbon-optimized alternatives
- What-if simulation with disruption scenarios

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard` | GET | Aggregated KPIs |
| `/api/shipments` | GET | List shipments (filter, search, paginate) |
| `/api/shipments/map` | GET | Map-optimized shipment data |
| `/api/risk/overview` | GET | System risk summary |
| `/api/risk/score/{id}` | GET | Per-shipment risk breakdown |
| `/api/risk/evaluate` | POST | Batch AI evaluation |
| `/api/decision/evaluate/{id}` | GET | AI decision for a shipment |
| `/api/actions/execute/{id}` | POST | Execute automated actions |
| `/api/actions/eco/{id}` | GET | Carbon-optimized alternatives |
| `/api/actions/log` | GET | Action audit trail |
| `/api/alerts` | GET | List alerts with filters |
| `/api/suppliers` | GET | Supplier scorecards |
| `/api/simulation/what-if` | POST | Run disruption simulation |
| `/api/simulation/forecast/{cat}` | GET | Demand forecast |
| `/api/chat` | POST | AI assistant message |
| `/api/learning/metrics` | GET | Model accuracy metrics |
| `/api/learning/optimize-weights` | POST | Optimize risk weights |
| `/api/learning/retrain` | POST | Retrain forecasting model |
| `/ws` | WebSocket | Real-time updates |

---

## 🎨 Design System

| Element | Color |
|---------|-------|
| Background | `#0B0F19` |
| Card | `#121826` |
| Primary (Cyan) | `#00E5FF` |
| Secondary (Purple) | `#7C3AED` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |

**Features**: Glassmorphism, neon glow effects, smooth animations (Framer Motion), responsive layouts, Inter font.

---

## 🗺️ Google Maps Integration

Set your API key in `backend/.env`:

```
GOOGLE_MAPS_API_KEY=your_key_here
```

The Control Tower currently uses a built-in CSS mercator map visualization that works without an API key. To enable Google Maps, add the `@react-google-maps/api` library (already installed) and replace the CSS map in `ControlTower.jsx`.

---

## ⚙️ Decision Logic

```
Risk < 40   → AUTO APPROVE (shipment proceeds normally)
Risk 40-70  → MONITOR (increase tracking, prepare backups)
Risk > 70   → TRIGGER ACTION (reroute, switch supplier, rebalance, create PO)
```

---

## 📜 License

MIT
