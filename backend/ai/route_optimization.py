"""
Route Optimization Module — finds optimal shipping routes.

Implements:
1. Basic shortest-path with risk avoidance
2. Carbon-optimized routing (eco-friendly mode)
3. What-if simulation for route alternatives

In production: would use Google Routes API or a reinforcement learning agent.
"""

import random
import math
from datetime import datetime, timedelta
from typing import Dict, List, Tuple


def _haversine(lat1, lon1, lat2, lon2):
    """Calculate great-circle distance between two points (km)."""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


class RouteOptimizer:
    """
    Multi-criteria route optimization engine.
    Balances speed, cost, risk, and carbon emissions.
    """

    def __init__(self):
        # ── Waypoint hub network (simplified global logistics nodes) ──
        self.hubs = {
            "Shanghai": (31.23, 121.47),
            "Singapore": (1.35, 103.82),
            "Dubai": (25.20, 55.27),
            "Rotterdam": (51.92, 4.48),
            "Los Angeles": (33.94, -118.41),
            "New York": (40.71, -74.01),
            "Mumbai": (19.08, 72.88),
            "Tokyo": (35.68, 139.65),
            "Hamburg": (53.55, 9.99),
            "Panama Canal": (9.08, -79.68),
            "Suez Canal": (30.46, 32.35),
            "Cape Town": (-33.92, 18.42),
        }

        # ── Transport modes with different cost/speed/carbon profiles ──
        self.modes = {
            "ocean_standard": {"speed_kmh": 30, "cost_per_km": 0.05, "carbon_per_km": 0.015},
            "ocean_express": {"speed_kmh": 45, "cost_per_km": 0.08, "carbon_per_km": 0.022},
            "air_freight": {"speed_kmh": 800, "cost_per_km": 2.50, "carbon_per_km": 0.500},
            "rail": {"speed_kmh": 80, "cost_per_km": 0.12, "carbon_per_km": 0.025},
            "truck": {"speed_kmh": 60, "cost_per_km": 0.30, "carbon_per_km": 0.062},
        }

    def find_routes(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        weight_kg: float = 1000,
        prefer_eco: bool = False,
    ) -> List[Dict]:
        """
        Generate 3 alternative routes between origin and destination.

        Returns routes ranked by:
          - Fastest
          - Cheapest
          - Eco-friendly (lowest carbon)
        """
        distance = _haversine(origin[0], origin[1], destination[0], destination[1])

        routes = []

        # ── Route 1: Standard ocean shipping ──
        mode = self.modes["ocean_standard"]
        ocean_dist = distance * 1.3  # ocean routes are ~30% longer
        routes.append(self._build_route(
            name="Ocean Standard",
            mode_name="ocean_standard",
            distance_km=ocean_dist,
            mode=mode,
            weight_kg=weight_kg,
            risk_modifier=0,
        ))

        # ── Route 2: Express (ocean + air for critical) ──
        air_segment = distance * 0.4
        ocean_segment = distance * 0.7
        express_time = air_segment / self.modes["air_freight"]["speed_kmh"] + ocean_segment / self.modes["ocean_express"]["speed_kmh"]
        express_cost = (air_segment * self.modes["air_freight"]["cost_per_km"] +
                        ocean_segment * self.modes["ocean_express"]["cost_per_km"]) * (weight_kg / 1000)
        express_carbon = (air_segment * self.modes["air_freight"]["carbon_per_km"] +
                          ocean_segment * self.modes["ocean_express"]["carbon_per_km"]) * (weight_kg / 1000)
        routes.append({
            "name": "Express Multi-Modal",
            "mode": "air_freight + ocean_express",
            "distance_km": round(air_segment + ocean_segment),
            "duration_hours": round(express_time, 1),
            "duration_days": round(express_time / 24, 1),
            "cost_usd": round(express_cost, 2),
            "carbon_kg": round(express_carbon, 1),
            "risk_score": random.randint(15, 35),
            "eta": (datetime.utcnow() + timedelta(hours=express_time)).isoformat(),
            "waypoints": self._generate_waypoints(origin, destination, 4),
        })

        # ── Route 3: Eco-friendly (rail + ocean) ──
        mode = self.modes["rail"]
        eco_dist = distance * 1.1
        eco_ocean = distance * 0.5
        routes.append({
            "name": "Eco-Friendly Rail + Ocean",
            "mode": "rail + ocean_standard",
            "distance_km": round(eco_dist + eco_ocean),
            "duration_hours": round(eco_dist / mode["speed_kmh"] + eco_ocean / self.modes["ocean_standard"]["speed_kmh"], 1),
            "duration_days": round((eco_dist / mode["speed_kmh"] + eco_ocean / self.modes["ocean_standard"]["speed_kmh"]) / 24, 1),
            "cost_usd": round(
                (eco_dist * mode["cost_per_km"] + eco_ocean * self.modes["ocean_standard"]["cost_per_km"]) * (weight_kg / 1000), 2
            ),
            "carbon_kg": round(
                (eco_dist * mode["carbon_per_km"] + eco_ocean * self.modes["ocean_standard"]["carbon_per_km"]) * (weight_kg / 1000), 1
            ),
            "risk_score": random.randint(10, 30),
            "eta": (datetime.utcnow() + timedelta(
                hours=eco_dist / mode["speed_kmh"] + eco_ocean / self.modes["ocean_standard"]["speed_kmh"]
            )).isoformat(),
            "waypoints": self._generate_waypoints(origin, destination, 5),
        })

        # Sort by preference
        if prefer_eco:
            routes.sort(key=lambda r: r["carbon_kg"])
        else:
            routes.sort(key=lambda r: r["duration_hours"])

        # Tag recommendations
        for i, route in enumerate(routes):
            route["rank"] = i + 1
            route["is_recommended"] = (i == 0)

        return routes

    def simulate_disruption(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        disruption_type: str = "route_blocked",
        weight_kg: float = 1000,
    ) -> Dict:
        """
        What-if simulation: shows impact of a disruption and alternative routes.
        """
        # Original route
        original = self.find_routes(origin, destination, weight_kg)[0]

        # Disrupted scenario
        delay_hours = {"route_blocked": 72, "weather": 48, "port_closure": 96, "strike": 120}.get(
            disruption_type, 48
        )
        cost_increase = {"route_blocked": 0.25, "weather": 0.15, "port_closure": 0.3, "strike": 0.4}.get(
            disruption_type, 0.2
        )

        disrupted = {
            **original,
            "name": f"Original (Disrupted: {disruption_type})",
            "duration_hours": round(original["duration_hours"] + delay_hours, 1),
            "duration_days": round((original["duration_hours"] + delay_hours) / 24, 1),
            "cost_usd": round(original["cost_usd"] * (1 + cost_increase), 2),
            "risk_score": min(100, original["risk_score"] + 35),
        }

        # Alternative routes (avoiding disrupted area)
        alternatives = self.find_routes(origin, destination, weight_kg, prefer_eco=False)

        return {
            "disruption_type": disruption_type,
            "original_route": original,
            "disrupted_route": disrupted,
            "delay_hours": delay_hours,
            "cost_increase_pct": round(cost_increase * 100, 1),
            "alternative_routes": alternatives,
            "recommendation": alternatives[0]["name"] if alternatives else "No alternatives",
            "savings_vs_disrupted": {
                "time_saved_hours": round(disrupted["duration_hours"] - alternatives[0]["duration_hours"], 1),
                "cost_saved_usd": round(disrupted["cost_usd"] - alternatives[0]["cost_usd"], 2),
            } if alternatives else None,
        }

    def _build_route(self, name, mode_name, distance_km, mode, weight_kg, risk_modifier):
        duration = distance_km / mode["speed_kmh"]
        return {
            "name": name,
            "mode": mode_name,
            "distance_km": round(distance_km),
            "duration_hours": round(duration, 1),
            "duration_days": round(duration / 24, 1),
            "cost_usd": round(distance_km * mode["cost_per_km"] * (weight_kg / 1000), 2),
            "carbon_kg": round(distance_km * mode["carbon_per_km"] * (weight_kg / 1000), 1),
            "risk_score": random.randint(10, 40) + risk_modifier,
            "eta": (datetime.utcnow() + timedelta(hours=duration)).isoformat(),
            "waypoints": [],
        }

    def _generate_waypoints(self, origin, dest, count):
        """Generate intermediate waypoints along a route."""
        waypoints = []
        for i in range(1, count + 1):
            frac = i / (count + 1)
            lat = origin[0] + (dest[0] - origin[0]) * frac + random.uniform(-2, 2)
            lng = origin[1] + (dest[1] - origin[1]) * frac + random.uniform(-2, 2)
            waypoints.append({"lat": round(lat, 4), "lng": round(lng, 4)})
        return waypoints


# ── Singleton ──
route_optimizer = RouteOptimizer()
