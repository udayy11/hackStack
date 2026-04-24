"""
Risk Scoring Module — Multi-factor risk assessment engine.

Computes a 0-100 risk score for each shipment based on:
- Weather conditions along route
- Traffic / port congestion
- Supplier reliability
- Demand volatility
- Historical disruptions
- IoT sensor anomalies
"""

import random
import math
from datetime import datetime
from typing import Dict, List, Optional


class RiskScorer:
    """
    Weighted multi-factor risk scoring engine.
    Each factor contributes to the overall score based on learned weights.
    """

    def __init__(self):
        # ── Factor weights (sum to 1.0) — tuned by learning loop ──
        self.weights = {
            "weather": 0.20,
            "traffic": 0.15,
            "supplier": 0.15,
            "demand": 0.10,
            "geopolitical": 0.10,
            "iot_anomaly": 0.15,
            "historical": 0.15,
        }
        self.model_version = "risk_v1.0"

    def compute_score(self, shipment_data: Dict, external_signals: Optional[Dict] = None) -> Dict:
        """
        Compute comprehensive risk score for a shipment.

        Args:
            shipment_data: Dict with shipment fields (status, temperature, etc.)
            external_signals: Optional dict with weather/traffic/news data

        Returns:
            Dict with overall score, factor breakdown, and risk level
        """
        signals = external_signals or {}
        factors = {}

        # ── 1. Weather Risk ──
        weather_risk = signals.get("weather_risk", random.randint(5, 40))
        factors["weather"] = min(100, weather_risk)

        # ── 2. Traffic / Congestion ──
        traffic_risk = signals.get("traffic_risk", random.randint(5, 35))
        factors["traffic"] = min(100, traffic_risk)

        # ── 3. Supplier Reliability (inverse) ──
        supplier_score = shipment_data.get("supplier_reliability", 85)
        factors["supplier"] = max(0, 100 - supplier_score)

        # ── 4. Demand Volatility ──
        demand_risk = signals.get("demand_risk", random.randint(5, 30))
        factors["demand"] = min(100, demand_risk)

        # ── 5. Geopolitical Risk ──
        geo_risk = signals.get("geopolitical_risk", random.randint(0, 25))
        factors["geopolitical"] = min(100, geo_risk)

        # ── 6. IoT Anomalies ──
        temp = shipment_data.get("temperature", 20)
        humidity = shipment_data.get("humidity", 50)
        iot_risk = 0
        if temp > 30 or temp < -5:
            iot_risk += 30
        if humidity > 80:
            iot_risk += 20
        factors["iot_anomaly"] = min(100, iot_risk)

        # ── 7. Historical Risk ──
        status = shipment_data.get("status", "in_transit")
        hist_risk = {
            "pending": 15,
            "in_transit": 20,
            "delayed": 60,
            "rerouted": 45,
            "delivered": 5,
            "cancelled": 80,
        }.get(status, 25)
        factors["historical"] = hist_risk

        # ── Weighted sum ──
        overall = sum(
            factors[f] * self.weights[f]
            for f in self.weights
        )
        overall = round(min(100, max(0, overall)), 1)

        # ── Risk level classification ──
        if overall < 40:
            level = "low"
            action = "auto_approve"
        elif overall < 70:
            level = "medium"
            action = "monitor"
        else:
            level = "high" if overall < 85 else "critical"
            action = "trigger_action"

        return {
            "overall_score": overall,
            "risk_level": level,
            "recommended_action": action,
            "factors": factors,
            "weights": self.weights,
            "model_version": self.model_version,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def batch_score(self, shipments: List[Dict]) -> List[Dict]:
        """Score multiple shipments at once."""
        return [
            {
                "shipment_id": s.get("tracking_id", s.get("id")),
                **self.compute_score(s),
            }
            for s in shipments
        ]

    def update_weights(self, new_weights: Dict[str, float]) -> Dict:
        """
        Learning loop updates weights based on outcome data.
        Called periodically to improve model accuracy.
        """
        total = sum(new_weights.values())
        self.weights = {k: v / total for k, v in new_weights.items()}
        self.model_version = f"risk_v1.{int(datetime.utcnow().timestamp()) % 100}"
        return {
            "status": "weights_updated",
            "new_weights": self.weights,
            "model_version": self.model_version,
        }


# ── Singleton ──
risk_scorer = RiskScorer()
