"""
Actions API — action execution, carbon optimization, and action log.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.connection import get_db
from database.models import Shipment, ActionLog
from services.action_engine import action_engine
from services.decision_engine import decision_engine

router = APIRouter(prefix="/api/actions", tags=["Actions"])


@router.post("/execute/{shipment_id}")
async def execute_actions(shipment_id: int, db: AsyncSession = Depends(get_db)):
    """Run decision engine + execute recommended actions for a shipment."""
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

    # Get decision
    decision = await decision_engine.evaluate_shipment(shipment_data)

    # Execute actions
    actions = await action_engine.execute_actions(decision, shipment_data)

    return {
        "shipment_id": shipment_id,
        "decision": decision,
        "executed_actions": actions,
    }


@router.get("/eco/{shipment_id}")
async def get_eco_alternatives(shipment_id: int, db: AsyncSession = Depends(get_db)):
    """Get carbon-optimized alternatives for a shipment."""
    result = await db.execute(select(Shipment).where(Shipment.id == shipment_id))
    shipment = result.scalar_one_or_none()
    if not shipment:
        return {"error": "Shipment not found"}

    shipment_data = {
        "origin_lat": shipment.origin_lat,
        "origin_lng": shipment.origin_lng,
        "dest_lat": shipment.dest_lat,
        "dest_lng": shipment.dest_lng,
        "weight_kg": shipment.weight_kg,
        "carbon_kg": shipment.carbon_kg,
    }

    return await action_engine.suggest_eco_actions(shipment_data)


@router.get("/log")
async def get_action_log(db: AsyncSession = Depends(get_db)):
    """Get all action logs from the database."""
    result = await db.execute(
        select(ActionLog).order_by(ActionLog.created_at.desc()).limit(50)
    )
    logs = result.scalars().all()

    return {
        "logs": [
            {
                "id": l.id,
                "shipment_id": l.shipment_id,
                "action_type": l.action_type,
                "description": l.description,
                "reason": l.reason,
                "risk_score_before": l.risk_score_before,
                "risk_score_after": l.risk_score_after,
                "cost_impact_usd": l.cost_impact_usd,
                "carbon_impact_kg": l.carbon_impact_kg,
                "auto_approved": l.auto_approved,
                "success": l.success,
                "created_at": l.created_at.isoformat() if l.created_at else None,
            }
            for l in logs
        ],
        "total": len(logs),
    }
