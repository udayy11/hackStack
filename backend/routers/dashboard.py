"""
Dashboard API — aggregated KPIs, risk overview, and system health.
This is the first thing the frontend loads on app startup.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database.connection import get_db
from database.models import Shipment, Alert, ActionLog, Supplier, Inventory
from datetime import datetime

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """
    Returns all dashboard KPIs in a single call for fast initial load.
    """
    # ── Shipment stats ──
    total_result = await db.execute(select(func.count(Shipment.id)))
    total_shipments = total_result.scalar() or 0

    in_transit_result = await db.execute(
        select(func.count(Shipment.id)).where(Shipment.status == "in_transit")
    )
    in_transit = in_transit_result.scalar() or 0

    delivered_result = await db.execute(
        select(func.count(Shipment.id)).where(Shipment.status == "delivered")
    )
    delivered = delivered_result.scalar() or 0

    delayed_result = await db.execute(
        select(func.count(Shipment.id)).where(Shipment.status == "delayed")
    )
    delayed = delayed_result.scalar() or 0

    # ── OTIF (On-Time In-Full) ──
    otif = round((delivered / max(total_shipments, 1)) * 100, 1)

    # ── Average risk score ──
    avg_risk_result = await db.execute(select(func.avg(Shipment.risk_score)))
    avg_risk = round(avg_risk_result.scalar() or 0, 1)

    # ── Total cost ──
    total_cost_result = await db.execute(select(func.sum(Shipment.value_usd)))
    total_cost = round(total_cost_result.scalar() or 0, 2)

    # ── Carbon footprint ──
    total_carbon_result = await db.execute(select(func.sum(Shipment.carbon_kg)))
    total_carbon = round(total_carbon_result.scalar() or 0, 1)

    # ── Active alerts ──
    active_alerts_result = await db.execute(
        select(func.count(Alert.id)).where(Alert.is_resolved == False)
    )
    active_alerts = active_alerts_result.scalar() or 0

    critical_alerts_result = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.severity == "critical",
            Alert.is_resolved == False
        )
    )
    critical_alerts = critical_alerts_result.scalar() or 0

    # ── Recent alerts (last 5) ──
    recent_alerts_result = await db.execute(
        select(Alert).order_by(Alert.created_at.desc()).limit(5)
    )
    recent_alerts = [
        {
            "id": a.id,
            "title": a.title,
            "message": a.message,
            "severity": a.severity,
            "category": a.category,
            "shipment_id": a.shipment_id,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "is_read": a.is_read,
        }
        for a in recent_alerts_result.scalars().all()
    ]

    # ── Recent actions ──
    recent_actions_result = await db.execute(
        select(ActionLog).order_by(ActionLog.created_at.desc()).limit(5)
    )
    recent_actions = [
        {
            "id": a.id,
            "action_type": a.action_type,
            "description": a.description,
            "auto_approved": a.auto_approved,
            "success": a.success,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in recent_actions_result.scalars().all()
    ]

    # ── High risk shipments for map preview ──
    high_risk_result = await db.execute(
        select(Shipment).where(Shipment.risk_score > 60).order_by(Shipment.risk_score.desc()).limit(10)
    )
    high_risk_shipments = [
        {
            "id": s.id,
            "tracking_id": s.tracking_id,
            "origin": s.origin,
            "destination": s.destination,
            "current_lat": s.current_lat,
            "current_lng": s.current_lng,
            "risk_score": s.risk_score,
            "risk_level": s.risk_level,
            "status": s.status,
        }
        for s in high_risk_result.scalars().all()
    ]

    return {
        "kpis": {
            "otif_percentage": otif,
            "total_shipments": total_shipments,
            "in_transit": in_transit,
            "delivered": delivered,
            "delayed": delayed,
            "average_risk_score": avg_risk,
            "total_cost_usd": total_cost,
            "total_carbon_kg": total_carbon,
            "active_alerts": active_alerts,
            "critical_alerts": critical_alerts,
        },
        "recent_alerts": recent_alerts,
        "recent_actions": recent_actions,
        "high_risk_shipments": high_risk_shipments,
        "last_updated": datetime.utcnow().isoformat(),
    }
