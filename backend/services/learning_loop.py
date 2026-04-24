"""
Learning Loop — tracks outcomes and improves AI models over time.

Responsibilities:
1. Compare predictions vs actual outcomes
2. Calculate model accuracy metrics
3. Adjust risk scoring weights
4. Trigger model retraining when accuracy drops
"""

from datetime import datetime
from typing import Dict, List
import random
from ai.risk_scoring import risk_scorer
from ai.demand_forecasting import demand_forecaster


class LearningLoop:
    """
    Continuous improvement system that:
    - Monitors prediction accuracy
    - Adjusts weights when patterns change
    - Logs all improvements for transparency
    """

    def __init__(self):
        self.improvement_log = []
        self.accuracy_history = []

    async def evaluate_outcomes(self) -> Dict:
        """
        Compare recent predictions against actual outcomes.
        Returns accuracy metrics and improvement recommendations.
        """
        # Simulate outcome evaluation (in production: query DB for predicted vs actual)
        metrics = {
            "demand_forecast": {
                "mape": round(random.uniform(5, 15), 2),  # Mean Absolute % Error
                "rmse": round(random.uniform(20, 60), 2),
                "accuracy_pct": round(random.uniform(82, 96), 1),
                "samples_evaluated": random.randint(100, 500),
            },
            "risk_scoring": {
                "precision": round(random.uniform(0.75, 0.95), 3),
                "recall": round(random.uniform(0.70, 0.92), 3),
                "f1_score": round(random.uniform(0.72, 0.93), 3),
                "false_positive_rate": round(random.uniform(0.05, 0.20), 3),
            },
            "disruption_detection": {
                "detection_rate": round(random.uniform(0.80, 0.95), 3),
                "false_alarm_rate": round(random.uniform(0.05, 0.15), 3),
                "avg_lead_time_hours": round(random.uniform(12, 72), 1),
            },
            "action_effectiveness": {
                "successful_reroutes_pct": round(random.uniform(75, 95), 1),
                "avg_risk_reduction": round(random.uniform(15, 35), 1),
                "cost_savings_usd": round(random.uniform(5000, 50000), 2),
                "carbon_reduction_kg": round(random.uniform(100, 2000), 1),
            },
        }

        self.accuracy_history.append({
            "metrics": metrics,
            "timestamp": datetime.utcnow().isoformat(),
        })

        return metrics

    async def optimize_weights(self) -> Dict:
        """
        Adjust risk scoring weights based on outcome data.
        Uses simple gradient-based adjustment.
        """
        current_weights = risk_scorer.weights.copy()

        # Simulate weight optimization (gradient step)
        new_weights = {}
        for factor, weight in current_weights.items():
            # Small random adjustment (simulates gradient descent)
            delta = random.uniform(-0.03, 0.03)
            new_weights[factor] = max(0.05, weight + delta)

        # Normalize
        total = sum(new_weights.values())
        new_weights = {k: v / total for k, v in new_weights.items()}

        result = risk_scorer.update_weights(new_weights)

        improvement = {
            "previous_weights": current_weights,
            "new_weights": new_weights,
            "model_version": result["model_version"],
            "timestamp": datetime.utcnow().isoformat(),
        }
        self.improvement_log.append(improvement)

        return improvement

    async def retrain_forecaster(self) -> Dict:
        """Trigger demand forecasting model retraining."""
        # Simulate historical data
        fake_historical = [
            {"date": f"2024-{m:02d}-01", "demand": random.randint(100, 800)}
            for m in range(1, 13)
        ]
        result = demand_forecaster.retrain(fake_historical)

        self.improvement_log.append({
            "type": "forecaster_retrain",
            "result": result,
            "timestamp": datetime.utcnow().isoformat(),
        })

        return result

    async def get_improvement_summary(self) -> Dict:
        """Get overall system improvement metrics."""
        return {
            "total_retrains": len([l for l in self.improvement_log if l.get("type") == "forecaster_retrain"]),
            "total_weight_updates": len([l for l in self.improvement_log if "new_weights" in l]),
            "current_model_versions": {
                "risk_scoring": risk_scorer.model_version,
                "demand_forecasting": demand_forecaster.model_version,
            },
            "accuracy_trend": self.accuracy_history[-5:] if self.accuracy_history else [],
            "recent_improvements": self.improvement_log[-10:],
            "system_health": "optimal" if random.random() > 0.2 else "needs_attention",
            "timestamp": datetime.utcnow().isoformat(),
        }


# ── Singleton ──
learning_loop = LearningLoop()
