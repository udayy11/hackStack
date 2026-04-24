"""
Smart Resilient Logistics & Dynamic Supply Chain Optimization System
====================================================================
Main FastAPI application — connects all modules, starts WebSocket, seeds data.
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database.connection import init_db, async_session
from data.seed_data import seed_database
from services.websocket_manager import ws_manager

# ── Import all routers ──
from routers import dashboard, shipments, risk, decisions, actions, alerts, suppliers, simulation, chat, learning


# ── Lifespan: startup/shutdown ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    """On startup: create tables, seed data. On shutdown: cleanup."""
    print("[START] Starting Smart Logistics AI...")

    # Create database tables
    await init_db()

    # Seed with demo data
    async with async_session() as session:
        await seed_database(session)

    print("[OK] System ready!")
    yield
    print("[STOP] Shutting down...")


# ── Create app ──
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered supply chain optimization with real-time tracking, "
                "disruption prediction, and automated decision-making.",
    lifespan=lifespan,
)

# ── CORS (allow frontend dev server) ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Register all routers ──
app.include_router(dashboard.router)
app.include_router(shipments.router)
app.include_router(risk.router)
app.include_router(decisions.router)
app.include_router(actions.router)
app.include_router(alerts.router)
app.include_router(suppliers.router)
app.include_router(simulation.router)
app.include_router(chat.router)
app.include_router(learning.router)


# ── WebSocket endpoint for real-time updates ──
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket connection for real-time dashboard updates.
    Client can subscribe to topics: alerts, shipments, kpis
    """
    await ws_manager.connect(websocket, topics=["all"])
    try:
        while True:
            # Listen for client messages (e.g., topic subscriptions)
            data = await websocket.receive_text()
            # Echo back as confirmation
            await ws_manager.send_personal(websocket, {"type": "ack", "data": data})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


# ── Health check ──
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# ── Root ──
@app.get("/")
async def root():
    return {
        "message": "Smart Logistics AI is running!",
        "docs": "/docs",
        "version": settings.APP_VERSION,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
