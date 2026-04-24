"""
WebSocket Connection Manager — handles real-time push to connected clients.
Broadcasts alerts, shipment updates, and KPI refreshes.
"""

from fastapi import WebSocket
from typing import Dict, List, Set
import json
import asyncio
from datetime import datetime


class ConnectionManager:
    """
    Manages WebSocket connections and broadcasting.
    Supports topic-based subscriptions (alerts, shipments, kpis).
    """

    def __init__(self):
        # All active connections
        self.active_connections: List[WebSocket] = []
        # Topic → set of connections
        self.topics: Dict[str, Set[WebSocket]] = {
            "alerts": set(),
            "shipments": set(),
            "kpis": set(),
            "all": set(),  # receives everything
        }

    async def connect(self, websocket: WebSocket, topics: List[str] = None):
        """Accept connection and register for topics."""
        await websocket.accept()
        self.active_connections.append(websocket)

        # Subscribe to requested topics (default: all)
        sub_topics = topics or ["all"]
        for topic in sub_topics:
            if topic in self.topics:
                self.topics[topic].add(websocket)
            else:
                self.topics[topic] = {websocket}

        print(f"[WS] Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove connection from all topics."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        for topic_subs in self.topics.values():
            topic_subs.discard(websocket)

        print(f"[WS] Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: Dict, topic: str = "all"):
        """Send message to all clients subscribed to a topic."""
        payload = json.dumps({
            "topic": topic,
            "data": message,
            "timestamp": datetime.utcnow().isoformat(),
        })

        # Get subscribers for this topic + "all" topic
        subscribers = self.topics.get(topic, set()) | self.topics.get("all", set())
        dead = []

        for ws in subscribers:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)

        # Clean up dead connections
        for ws in dead:
            self.disconnect(ws)

    async def send_personal(self, websocket: WebSocket, message: Dict):
        """Send a message to a specific client."""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception:
            self.disconnect(websocket)

    async def broadcast_alert(self, alert: Dict):
        """Convenience: broadcast a new alert."""
        await self.broadcast(alert, topic="alerts")

    async def broadcast_shipment_update(self, shipment: Dict):
        """Convenience: broadcast a shipment status change."""
        await self.broadcast(shipment, topic="shipments")

    async def broadcast_kpi_update(self, kpis: Dict):
        """Convenience: broadcast updated KPI data."""
        await self.broadcast(kpis, topic="kpis")


# ── Singleton ──
ws_manager = ConnectionManager()
