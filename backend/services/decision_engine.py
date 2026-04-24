"""
Decision Engine — orchestrates AI modules and applies decision logic.

Decision Logic:
  - Risk < 40  → auto approve (no action needed)
  - Risk 40–70 → monitor (increase monitoring frequency)
  - Risk > 70  → trigger action (engage Action Engine)
"""

from typing import Dict, List, Optional
from datetime import datetime
from ai.risk_scoring import risk_scorer
from ai.disruption_detection import disruption_detector
from ai.demand_forecasting import demand_forecaster


class DecisionEngine:
    """
    Central AI decision engine that:
    1. Collects signals from all AI modules
    2. Computes risk scores
    3. Applies decision logic
    4. Returns recommended actions
    """

    def __init__(self):
        self.decision_log = []

    async def evaluate_shipment(self, shipment_data: Dict) -> Dict:
        """
        Full evaluation pipeline for a single shipment.
        Runs disruption detection → risk scoring → decision logic.
        """
        # Step 1: Check for anomalies in sensor data
        anomaly_result = disruption_detector.detect_anomalies(shipment_data)

        # Step 2: Compute risk score with all factors
        external_signals = {
            "weather_risk": anomaly_result.get("risk_increase", 0) * 2,
            "traffic_risk": shipment_data.get("traffic_risk", 15),
        }
        risk_result = risk_scorer.compute_score(shipment_data, external_signals)

        # Step 3: Apply decision logic
        score = risk_result["overall_score"]
        decision = self._apply_decision_logic(score, shipment_data, anomaly_result)

        result = {
            "shipment_id": shipment_data.get("tracking_id", "unknown"),
            "risk_assessment": risk_result,
            "anomaly_detection": anomaly_result,
            "decision": decision,
            "timestamp": datetime.utcnow().isoformat(),
        }

        self.decision_log.append(result)
        return result

    def _apply_decision_logic(self, score: float, shipment: Dict, anomalies: Dict) -> Dict:
        """
        The core decision logic:
          < 40  → auto_approve
          40-70 → monitor
          > 70  → trigger_action
        """
        if score < 40:
            return {
                "action": "auto_approve",
                "level": "low",
                "message": "Risk is low. Shipment proceeding normally.",
                "requires_human": False,
                "automated_actions": [],
            }
        elif score <= 70:
            return {
                "action": "monitor",
                "level": "medium",
                "message": f"Risk score {score:.1f} — increased monitoring activated.",
                "requires_human": False,
                "automated_actions": [
                    "Increase tracking frequency to every 15 minutes",
                    "Alert logistics coordinator",
                    "Prepare contingency routes",
                ],
            }
        else:
            # High risk — determine specific actions
            actions = []
            if anomalies.get("requires_action"):
                actions.append({
                    "type": "reroute",
                    "description": "Reroute shipment to avoid disruption zone",
                    "priority": "high",
                })
            if score > 85:
                actions.extend([
                    {
                        "type": "switch_supplier",
                        "description": "Activate backup supplier for affected inventory",
                        "priority": "high",
                    },
                    {
                        "type": "rebalance_stock",
                        "description": "Transfer stock from nearest warehouse",
                        "priority": "medium",
                    },
                ])
            if score > 90:
                actions.append({
                    "type": "create_purchase_order",
                    "description": "Auto-create emergency purchase order",
                    "priority": "critical",
                })

            return {
                "action": "trigger_action",
                "level": "high" if score < 85 else "critical",
                "message": f"Risk score {score:.1f} — automated actions triggered.",
                "requires_human": score > 90,
                "automated_actions": actions,
            }

    async def evaluate_all(self, shipments: List[Dict]) -> Dict:
        """Evaluate all shipments and return summary."""
        results = []
        for s in shipments:
            result = await self.evaluate_shipment(s)
            results.append(result)

        # Summary stats
        scores = [r["risk_assessment"]["overall_score"] for r in results]
        return {
            "total_evaluated": len(results),
            "average_risk": round(sum(scores) / len(scores), 1) if scores else 0,
            "high_risk_count": sum(1 for s in scores if s > 70),
            "medium_risk_count": sum(1 for s in scores if 40 <= s <= 70),
            "low_risk_count": sum(1 for s in scores if s < 40),
            "actions_triggered": sum(
                1 for r in results if r["decision"]["action"] == "trigger_action"
            ),
            "results": results,
            "timestamp": datetime.utcnow().isoformat(),
        }

    def get_recent_decisions(self, limit: int = 20) -> List[Dict]:
        """Get recent decisions for the action log."""
        return self.decision_log[-limit:]


# ── Singleton ──
decision_engine = DecisionEngine()
