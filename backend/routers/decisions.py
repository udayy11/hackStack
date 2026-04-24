"""
Decision API — AI decision engine endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.connection import get_db
from database.models import Shipment
from services.decision_engine import decision_engine

router = APIRouter(prefix="/api/decision", tags=["Decision"])


@router.get("/evaluate/{shipment_id}")
async def evaluate_shipment(shipment_id: int, db: AsyncSession = Depends(get_db)):
    """Run AI decision engine on a specific shipment."""
    result = await db.execute(select(Shipment).where(Shipment.id == shipment_id))
    shipment = result.scalar_one_or_none()
    if not shipment:
        return {"error": "Shipment not found"}

    shipment_data = {
        "tracking_id": shipment.tracking_id,
        "status": shipment.status,
        "temperature": shipment.temperature,
        "humidity": shipment.humidity,
        "origin_lat": shipment.origin_lat,
        "origin_lng": shipment.origin_lng,
        "dest_lat": shipment.dest_lat,
        "dest_lng": shipment.dest_lng,
        "weight_kg": shipment.weight_kg,
        "carbon_kg": shipment.carbon_kg,
    }

    return await decision_engine.evaluate_shipment(shipment_data)


@router.get("/recent")
async def get_recent_decisions():
    """Get recent AI decisions."""
    return {"decisions": decision_engine.get_recent_decisions()}
