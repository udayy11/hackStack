"""
AI Chat Assistant — Context-aware logistics Q&A.

Uses pattern matching and knowledge base to answer supply chain questions.
In production: would connect to Vertex AI / OpenAI for full LLM capability.
"""

import random
from datetime import datetime
from typing import Dict, List, Optional


class ChatAssistant:
    """
    AI-powered chat assistant for supply chain queries.
    Understands shipment status, risk explanations, and action recommendations.
    """

    def __init__(self):
        # ── Knowledge base: common Q&A patterns ──
        self.patterns = [
            {
                "triggers": ["delayed", "delay", "late", "behind schedule"],
                "category": "delay_inquiry",
                "responses": [
                    "Based on my analysis, the delay is likely caused by {reason}. "
                    "The current risk score is {risk_score}/100. I recommend {action}.",
                ],
            },
            {
                "triggers": ["risk", "risky", "dangerous", "threat"],
                "category": "risk_inquiry",
                "responses": [
                    "The risk assessment shows: Weather ({weather}%), Traffic ({traffic}%), "
                    "Supplier ({supplier}%). Overall risk: {risk_score}/100. {recommendation}",
                ],
            },
            {
                "triggers": ["route", "reroute", "path", "alternative"],
                "category": "route_inquiry",
                "responses": [
                    "I've identified {count} alternative routes. The recommended route via "
                    "{route_name} would save {time_saved} hours and reduce risk by {risk_reduction}%.",
                ],
            },
            {
                "triggers": ["supplier", "vendor", "source"],
                "category": "supplier_inquiry",
                "responses": [
                    "Current supplier reliability: {reliability}%. Lead time: {lead_time} days. "
                    "Alternative suppliers available with {alt_reliability}% reliability.",
                ],
            },
            {
                "triggers": ["carbon", "emission", "eco", "green", "sustainable"],
                "category": "carbon_inquiry",
                "responses": [
                    "Current carbon footprint: {carbon_kg}kg CO₂. An eco-friendly route could "
                    "reduce emissions by {savings}% (saving {saved_kg}kg CO₂). "
                    "This would add approximately {extra_time} hours to delivery.",
                ],
            },
            {
                "triggers": ["cost", "expensive", "budget", "price", "spend"],
                "category": "cost_inquiry",
                "responses": [
                    "Current shipment cost: ${cost}. Route optimization could save "
                    "${savings} ({pct}%). Switching suppliers might save an additional ${supplier_savings}.",
                ],
            },
            {
                "triggers": ["forecast", "predict", "demand", "future"],
                "category": "forecast_inquiry",
                "responses": [
                    "Demand forecast for {category}: {trend} trend expected over the next 30 days. "
                    "Peak demand anticipated around day {peak_day} with {confidence}% confidence.",
                ],
            },
            {
                "triggers": ["status", "where", "track", "location"],
                "category": "status_inquiry",
                "responses": [
                    "Shipment {tracking_id} is currently {status}. "
                    "Location: ({lat}, {lng}). ETA: {eta}. "
                    "Last update: {last_update}.",
                ],
            },
            {
                "triggers": ["help", "what can you", "how to", "capabilities"],
                "category": "help",
                "responses": [
                    "I can help you with:\n"
                    "• 📦 Shipment tracking & status\n"
                    "• ⚠️ Risk analysis & explanations\n"
                    "• 🗺️ Route optimization & alternatives\n"
                    "• 📊 Demand forecasting\n"
                    "• 🏭 Supplier evaluation\n"
                    "• 🌿 Carbon footprint analysis\n"
                    "• 💰 Cost optimization\n\n"
                    "Just ask me anything about your supply chain!",
                ],
            },
        ]

    def respond(self, message: str, context: Optional[Dict] = None) -> Dict:
        """
        Generate a contextual response to a user message.

        Args:
            message: User's question
            context: Optional dict with current shipment/system data

        Returns:
            Dict with response text, category, and suggested actions
        """
        ctx = context or {}
        message_lower = message.lower()

        # ── Find matching pattern ──
        matched_pattern = None
        for pattern in self.patterns:
            if any(trigger in message_lower for trigger in pattern["triggers"]):
                matched_pattern = pattern
                break

        if not matched_pattern:
            # Default response
            return {
                "message": (
                    "I understand you're asking about your supply chain. "
                    "Could you be more specific? I can help with shipment tracking, "
                    "risk analysis, route optimization, demand forecasting, "
                    "supplier evaluation, and carbon analysis."
                ),
                "category": "general",
                "confidence": 0.5,
                "suggested_actions": [
                    "Check shipment status",
                    "View risk analysis",
                    "Explore route alternatives",
                ],
                "timestamp": datetime.utcnow().isoformat(),
            }

        # ── Fill template with context data ──
        template = random.choice(matched_pattern["responses"])
        fill_data = {
            "reason": ctx.get("delay_reason", "port congestion and weather disruptions"),
            "risk_score": ctx.get("risk_score", random.randint(30, 85)),
            "action": ctx.get("recommended_action", "rerouting via alternative corridor"),
            "weather": ctx.get("weather_risk", random.randint(10, 40)),
            "traffic": ctx.get("traffic_risk", random.randint(10, 35)),
            "supplier": ctx.get("supplier_risk", random.randint(5, 25)),
            "recommendation": "Monitoring closely." if random.random() > 0.5 else "Automated reroute recommended.",
            "count": random.randint(2, 4),
            "route_name": random.choice(["Suez Canal", "Cape of Good Hope", "Panama Canal", "Rail Silk Road"]),
            "time_saved": random.randint(12, 72),
            "risk_reduction": random.randint(15, 40),
            "reliability": ctx.get("supplier_reliability", random.randint(70, 95)),
            "lead_time": random.randint(3, 14),
            "alt_reliability": random.randint(80, 98),
            "carbon_kg": ctx.get("carbon_kg", random.randint(100, 3000)),
            "savings": random.randint(15, 40),
            "saved_kg": random.randint(50, 800),
            "extra_time": random.randint(6, 48),
            "cost": ctx.get("cost", random.randint(5000, 50000)),
            "pct": random.randint(8, 25),
            "supplier_savings": random.randint(500, 5000),
            "category": ctx.get("category", "Electronics"),
            "trend": random.choice(["upward", "stable", "seasonal peak"]),
            "peak_day": random.randint(7, 25),
            "confidence": random.randint(75, 95),
            "tracking_id": ctx.get("tracking_id", "SL-" + str(random.randint(100000, 999999))),
            "status": ctx.get("status", "in transit"),
            "lat": ctx.get("lat", round(random.uniform(-30, 50), 2)),
            "lng": ctx.get("lng", round(random.uniform(-120, 140), 2)),
            "eta": ctx.get("eta", "2-3 days"),
            "last_update": "5 minutes ago",
        }

        try:
            response_text = template.format(**fill_data)
        except (KeyError, IndexError):
            response_text = template

        # ── Determine suggested actions ──
        actions_map = {
            "delay_inquiry": ["View shipment timeline", "Check alternative routes", "Contact carrier"],
            "risk_inquiry": ["View risk breakdown", "Run simulation", "Set up alerts"],
            "route_inquiry": ["Compare routes", "Run what-if simulation", "Apply eco route"],
            "supplier_inquiry": ["View supplier scorecard", "Compare alternatives", "Create backup PO"],
            "carbon_inquiry": ["Apply eco route", "View carbon dashboard", "Generate report"],
            "cost_inquiry": ["Optimize routes", "Compare suppliers", "View cost trends"],
            "forecast_inquiry": ["View forecast chart", "Adjust inventory", "Set alerts"],
            "status_inquiry": ["View on map", "Check ETA history", "Set notification"],
            "help": [],
        }

        return {
            "message": response_text,
            "category": matched_pattern["category"],
            "confidence": round(0.7 + 0.3 * random.random(), 2),
            "suggested_actions": actions_map.get(matched_pattern["category"], []),
            "timestamp": datetime.utcnow().isoformat(),
        }


# ── Singleton ──
chat_assistant = ChatAssistant()
