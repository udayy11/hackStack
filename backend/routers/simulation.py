"""
Simulation API — What-If scenario engine.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from database.connection import get_db
from database.models import Shipment
from ai.route_optimization import route_optimizer
from ai.demand_forecasting import demand_forecaster

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])


class SimulationRequest(BaseModel):
    shipment_id: Optional[int] = None
    disruption_type: str = "route_blocked"  # route_blocked, weather, port_closure, strike
    origin_lat: Optional[float] = None
    origin_lng: Optional[float] = None
    dest_lat: Optional[float] = None
    dest_lng: Optional[float] = None
    weight_kg: float = 1000


@router.post("/what-if")
async def run_simulation(req: SimulationRequest, db: AsyncSession = Depends(get_db)):
    """
    Run a what-if simulation: "What if this route fails?"
    Shows alternative routes with cost + time comparison.
    """
    # If shipment_id provided, use its coordinates
    if req.shipment_id:
        result = await db.execute(select(Shipment).where(Shipment.id == req.shipment_id))
        shipment = result.scalar_one_or_none()
        if shipment:
            origin = (shipment.origin_lat or 31.23, shipment.origin_lng or 121.47)
            dest = (shipment.dest_lat or 51.92, shipment.dest_lng or 4.48)
            weight = shipment.weight_kg or 1000
        else:
            return {"error": "Shipment not found"}
    else:
        origin = (req.origin_lat or 31.23, req.origin_lng or 121.47)
        dest = (req.dest_lat or 51.92, req.dest_lng or 4.48)
        weight = req.weight_kg

    simulation = route_optimizer.simulate_disruption(
        origin=origin,
        destination=dest,
        disruption_type=req.disruption_type,
        weight_kg=weight,
    )

    return simulation


@router.get("/forecast/{category}")
async def get_forecast(category: str, days: int = 30):
    """Get demand forecast for a product category."""
    forecasts = demand_forecaster.predict(category, horizon_days=days)
    return {
        "category": category,
        "horizon_days": days,
        "forecasts": forecasts,
        "model_version": demand_forecaster.model_version,
    }


@router.get("/disruption-types")
async def get_disruption_types():
    """List available disruption scenarios for simulation."""
    return {
        "types": [
            {"id": "route_blocked", "name": "Route Blocked", "description": "Major route becomes unavailable"},
            {"id": "weather", "name": "Severe Weather", "description": "Weather disruption along corridor"},
            {"id": "port_closure", "name": "Port Closure", "description": "Destination port closes temporarily"},
            {"id": "strike", "name": "Labor Strike", "description": "Worker strike at key logistics point"},
        ]
    }
