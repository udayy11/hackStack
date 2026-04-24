"""
Action Engine — executes automated responses to high-risk situations.

Actions:
1. Reroute shipment
2. Switch supplier
3. Rebalance stock
4. Auto-create purchase order
5. Carbon-optimized alternatives
"""

import random
from datetime import datetime
from typing import Dict, List
from ai.route_optimization import route_optimizer


class ActionEngine:
    """
    Executes automated supply chain actions when risk exceeds thresholds.
    Each action is logged with before/after metrics for the learning loop.
    """

    def __init__(self):
        self.execution_log = []

    async def execute_actions(self, decision: Dict, shipment: Dict) -> List[Dict]:
        """
        Execute all recommended actions from the decision engine.

        Args:
            decision: Output from DecisionEngine.evaluate_shipment()
            shipment: The shipment data dict

        Returns:
            List of executed action results
        """
        actions = decision.get("decision", {}).get("automated_actions", [])
        if not actions:
            return []

        results = []
        for action in actions:
            if isinstance(action, str):
                # Simple monitoring actions
                results.append({
                    "action": action,
                    "status": "executed",
                    "timestamp": datetime.utcnow().isoformat(),
                })
            elif isinstance(action, dict):
                action_type = action.get("type", "")
                if action_type == "reroute":
                    result = await self._reroute_shipment(shipment)
                elif action_type == "switch_supplier":
                    result = await self._switch_supplier(shipment)
                elif action_type == "rebalance_stock":
                    result = await self._rebalance_stock(shipment)
                elif action_type == "create_purchase_order":
                    result = await self._create_purchase_order(shipment)
                else:
                    result = {"action": action_type, "status": "unknown_action"}

                result["priority"] = action.get("priority", "medium")
                results.append(result)

        self.execution_log.extend(results)
        return results

    async def _reroute_shipment(self, shipment: Dict) -> Dict:
        """Find and apply optimal alternative route."""
        origin = (shipment.get("origin_lat", 31.23), shipment.get("origin_lng", 121.47))
        dest = (shipment.get("dest_lat", 51.92), shipment.get("dest_lng", 4.48))

        routes = route_optimizer.find_routes(origin, dest, shipment.get("weight_kg", 1000))
        best = routes[0] if routes else {}

        return {
            "action": "reroute",
            "status": "executed",
            "description": f"Rerouted via {best.get('name', 'alternative')} corridor",
            "new_route": best,
            "estimated_savings_hours": random.randint(6, 48),
            "risk_reduction": random.randint(15, 35),
            "cost_impact_usd": round(random.uniform(-2000, 5000), 2),
            "carbon_impact_kg": round(random.uniform(-200, 300), 1),
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def _switch_supplier(self, shipment: Dict) -> Dict:
        """Switch to a backup supplier with better reliability."""
        backup_suppliers = [
            {"name": "EuroParts GmbH", "reliability": 94.2, "lead_time": 4},
            {"name": "Pacific Components", "reliability": 91.8, "lead_time": 6},
            {"name": "AmeriSource Inc", "reliability": 96.1, "lead_time": 3},
            {"name": "Nordic Supply AS", "reliability": 93.5, "lead_time": 5},
        ]
        chosen = random.choice(backup_suppliers)

        return {
            "action": "switch_supplier",
            "status": "executed",
            "description": f"Switched to backup supplier: {chosen['name']}",
            "new_supplier": chosen,
            "risk_reduction": random.randint(20, 40),
            "cost_impact_usd": round(random.uniform(500, 3000), 2),
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def _rebalance_stock(self, shipment: Dict) -> Dict:
        """Transfer inventory from nearest warehouse to cover shortage."""
        transfer_qty = random.randint(100, 500)

        return {
            "action": "rebalance_stock",
            "status": "executed",
            "description": f"Transferred {transfer_qty} units from nearest hub",
            "source_warehouse": "WH-EU-01 (Europe Distribution Center)",
            "destination_warehouse": "WH-NA-01 (North America Hub)",
            "quantity_transferred": transfer_qty,
            "risk_reduction": random.randint(10, 25),
            "cost_impact_usd": round(random.uniform(200, 1500), 2),
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def _create_purchase_order(self, shipment: Dict) -> Dict:
        """Auto-generate emergency purchase order."""
        po_number = f"PO-{random.randint(10000, 99999)}"
        qty = random.randint(500, 2000)
        unit_price = round(random.uniform(10, 100), 2)

        return {
            "action": "create_purchase_order",
            "status": "executed",
            "description": f"Auto-created {po_number} for {qty} units",
            "po_number": po_number,
            "quantity": qty,
            "unit_price_usd": unit_price,
            "total_usd": round(qty * unit_price, 2),
            "supplier": random.choice(["TechParts Global", "AmeriSource Inc"]),
            "expected_delivery_days": random.randint(3, 10),
            "risk_reduction": random.randint(20, 35),
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def suggest_eco_actions(self, shipment: Dict) -> Dict:
        """
        Carbon Optimization Mode — suggest eco-friendly alternatives.
        """
        origin = (shipment.get("origin_lat", 31.23), shipment.get("origin_lng", 121.47))
        dest = (shipment.get("dest_lat", 51.92), shipment.get("dest_lng", 4.48))

        routes = route_optimizer.find_routes(origin, dest, shipment.get("weight_kg", 1000), prefer_eco=True)
        current_carbon = shipment.get("carbon_kg", 500)
        eco_route = routes[0] if routes else {}
        eco_carbon = eco_route.get("carbon_kg", current_carbon * 0.7)

        return {
            "current_carbon_kg": current_carbon,
            "eco_route": eco_route,
            "carbon_savings_kg": round(current_carbon - eco_carbon, 1),
            "carbon_savings_pct": round((1 - eco_carbon / max(current_carbon, 1)) * 100, 1),
            "extra_time_hours": round(random.uniform(6, 48), 1),
            "extra_cost_usd": round(random.uniform(-500, 1000), 2),
            "recommendation": "Switch to eco-friendly rail+ocean route",
            "alternatives": routes,
        }

    def get_execution_log(self, limit: int = 50) -> List[Dict]:
        """Get recent action execution history."""
        return self.execution_log[-limit:]


# ── Singleton ──
action_engine = ActionEngine()
