"""
Risk API — risk scoring, assessment, and history.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.connection import get_db
from database.models import Shipment, RiskHistory
from ai.risk_scoring import risk_scorer
from services.decision_engine import decision_engine

router = APIRouter(prefix="/api/risk", tags=["Risk"])


@router.get("/score/{shipment_id}")
async def get_risk_score(shipment_id: int, db: AsyncSession = Depends(get_db)):
    """Get detailed risk breakdown for a shipment."""
    result = await db.execute(select(Shipment).where(Shipment.id == shipment_id))
    shipment = result.scalar_one_or_none()
    if not shipment:
        return {"error": "Shipment not found"}

    shipment_data = {
        "tracking_id": shipment.tracking_id,
        "status": shipment.status,
        "temperature": shipment.temperature,
        "humidity": shipment.humidity,
        "supplier_reliability": 85,
    }

    return risk_scorer.compute_score(shipment_data)


@router.get("/overview")
async def get_risk_overview(db: AsyncSession = Depends(get_db)):
    """Get system-wide risk overview."""
    result = await db.execute(select(Shipment))
    shipments = result.scalars().all()

    shipment_data = [
        {
            "tracking_id": s.tracking_id,
            "id": s.id,
            "status": s.status,
            "temperature": s.temperature,
            "humidity": s.humidity,
            "risk_score": s.risk_score,
        }
        for s in shipments
    ]

    scores = [s["risk_score"] for s in shipment_data]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    return {
        "average_risk_score": avg_score,
        "high_risk_count": sum(1 for s in scores if s > 70),
        "medium_risk_count": sum(1 for s in scores if 40 <= s <= 70),
        "low_risk_count": sum(1 for s in scores if s < 40),
        "risk_distribution": {
            "low": sum(1 for s in scores if s < 40),
            "medium": sum(1 for s in scores if 40 <= s <= 70),
            "high": sum(1 for s in scores if 70 < s <= 85),
            "critical": sum(1 for s in scores if s > 85),
        },
        "total_shipments": len(shipment_data),
    }


@router.get("/history/{shipment_id}")
async def get_risk_history(shipment_id: int, db: AsyncSession = Depends(get_db)):
    """Get risk score history for a shipment."""
    result = await db.execute(
        select(RiskHistory)
        .where(RiskHistory.shipment_id == shipment_id)
        .order_by(RiskHistory.timestamp.desc())
        .limit(20)
    )
    history = result.scalars().all()

    return {
        "shipment_id": shipment_id,
        "history": [
            {
                "risk_score": h.risk_score,
                "risk_factors": h.risk_factors,
                "timestamp": h.timestamp.isoformat() if h.timestamp else None,
            }
            for h in history
        ],
    }


@router.post("/evaluate")
async def evaluate_all_shipments(db: AsyncSession = Depends(get_db)):
    """Run AI evaluation on all active shipments."""
    result = await db.execute(
        select(Shipment).where(Shipment.status.in_(["in_transit", "delayed", "pending"]))
    )
    shipments = result.scalars().all()

    shipment_data = [
        {
            "tracking_id": s.tracking_id,
            "status": s.status,
            "temperature": s.temperature,
            "humidity": s.humidity,
            "origin_lat": s.origin_lat,
            "origin_lng": s.origin_lng,
            "dest_lat": s.dest_lat,
            "dest_lng": s.dest_lng,
            "weight_kg": s.weight_kg,
            "carbon_kg": s.carbon_kg,
        }
        for s in shipments
    ]

    evaluation = await decision_engine.evaluate_all(shipment_data)
    return evaluation
