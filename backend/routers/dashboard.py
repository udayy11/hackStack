"""
Dashboard API — aggregated KPIs, risk overview, and system health.
This is the first thing the frontend loads on app startup.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from database.connection import get_db
from database.models import Shipment, Alert, ActionLog, Supplier, Inventory, UserPreferences
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


# ── Pydantic models for request/response ──
class LocationData(BaseModel):
    id: Optional[str] = None
    lat: float
    lng: float
    city: str
    type: str


class UserPreferencesRequest(BaseModel):
    companyType: str
    supplyChainType: str
    regions: list[str]
    locations: dict  # {origins: [], destinations: [], suppliers: []}
    priorities: list[str]


@router.post("/preferences")
async def save_preferences(prefs: UserPreferencesRequest, db: AsyncSession = Depends(get_db)):
    """Save user preferences from onboarding"""
    user_id = "default_user"  # In production, get from auth token
    
    # Check if preferences already exist
    existing = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == user_id)
    )
    user_pref = existing.scalars().first()
    
    if user_pref:
        # Update existing
        user_pref.company_type = prefs.companyType
        user_pref.supply_chain_type = prefs.supplyChainType
        user_pref.regions = prefs.regions
        user_pref.locations = prefs.locations
        user_pref.priorities = prefs.priorities
    else:
        # Create new
        user_pref = UserPreferences(
            user_id=user_id,
            company_type=prefs.companyType,
            supply_chain_type=prefs.supplyChainType,
            regions=prefs.regions,
            locations=prefs.locations,
            priorities=prefs.priorities,
        )
        db.add(user_pref)
    
    await db.commit()
    await db.refresh(user_pref)
    
    return {"status": "saved", "preferences": prefs}


@router.get("/preferences")
async def get_preferences(db: AsyncSession = Depends(get_db)):
    """Get user preferences"""
    user_id = "default_user"
    
    result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == user_id)
    )
    user_pref = result.scalars().first()
    
    if not user_pref:
        return {"preferences": None}
    
    return {
        "preferences": {
            "companyType": user_pref.company_type,
            "supplyChainType": user_pref.supply_chain_type,
            "regions": user_pref.regions,
            "locations": user_pref.locations,
            "priorities": user_pref.priorities,
        }
    }



@router.get("")
async def get_dashboard(
    priorities: Optional[str] = Query(None),
    regions: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns all dashboard KPIs in a single call for fast initial load.
    Optionally filters by priorities and regions from user preferences.
    """
    # Parse query parameters
    priority_list = [p.strip() for p in priorities.split(",")] if priorities else []
    region_list = [r.strip() for r in regions.split(",")] if regions else []
    
    # ── Build shipment filter ──
    # If user prioritizes 'risk', show high-risk shipments
    # If user prioritizes 'cost', show expensive shipments
    # If user prioritizes 'speed', show delayed shipments
    
    query_filter = []
    if "risk" in priority_list:
        query_filter.append(Shipment.risk_score > 60)
    elif "cost" in priority_list:
        # High-value shipments
        query_filter.append(Shipment.value_usd > Shipment.value_usd.op('*')(0.5))
    elif "speed" in priority_list:
        # Delayed or at-risk-of-delayed shipments
        query_filter.append(
            or_(
                Shipment.status == "delayed",
                Shipment.risk_score > 40
            )
        )
    
    # ── Shipment stats ──
    # Build base query
    base_query = select(Shipment)
    if query_filter:
        base_query = base_query.where(and_(*query_filter))
    
    total_result = await db.execute(
        select(func.count(Shipment.id)).where(
            and_(*query_filter) if query_filter else True
        )
    )
    total_shipments = total_result.scalar() or 0

    in_transit_result = await db.execute(
        select(func.count(Shipment.id)).where(
            and_(
                Shipment.status == "in_transit",
                *(query_filter if query_filter else [True])
            )
        )
    )
    in_transit = in_transit_result.scalar() or 0

    delivered_result = await db.execute(
        select(func.count(Shipment.id)).where(
            and_(
                Shipment.status == "delivered",
                *(query_filter if query_filter else [True])
            )
        )
    )
    delivered = delivered_result.scalar() or 0

    delayed_result = await db.execute(
        select(func.count(Shipment.id)).where(
            and_(
                Shipment.status == "delayed",
                *(query_filter if query_filter else [True])
            )
        )
    )
    delayed = delayed_result.scalar() or 0

    # ── OTIF (On-Time In-Full) ──
    otif = round((delivered / max(total_shipments, 1)) * 100, 1)

    # ── Average risk score ──
    avg_risk_result = await db.execute(
        select(func.avg(Shipment.risk_score)).where(
            and_(*query_filter) if query_filter else True
        )
    )
    avg_risk = round(avg_risk_result.scalar() or 0, 1)

    # ── Total cost ──
    total_cost_result = await db.execute(
        select(func.sum(Shipment.value_usd)).where(
            and_(*query_filter) if query_filter else True
        )
    )
    total_cost = round(total_cost_result.scalar() or 0, 2)

    # ── Carbon footprint ──
    total_carbon_result = await db.execute(
        select(func.sum(Shipment.carbon_kg)).where(
            and_(*query_filter) if query_filter else True
        )
    )
    total_carbon = round(total_carbon_result.scalar() or 0, 1)

    # ── Active alerts ──
    alert_filter = []
    if priority_list:
        # Filter alerts by priority categories
        priority_categories = {
            "cost": ["cost", "pricing", "supplier"],
            "speed": ["delay", "weather", "traffic"],
            "risk": ["risk", "disruption", "supplier"],
            "sustainability": ["carbon", "sustainability", "emissions"],
        }
        alert_categories = []
        for p in priority_list:
            if p in priority_categories:
                alert_categories.extend(priority_categories[p])
        if alert_categories:
            alert_filter.append(
                or_(*[Alert.category.ilike(f"%{cat}%") for cat in alert_categories])
            )
    
    active_alerts_result = await db.execute(
        select(func.count(Alert.id)).where(
            and_(
                Alert.is_resolved == False,
                *(alert_filter if alert_filter else [True])
            )
        )
    )
    active_alerts = active_alerts_result.scalar() or 0

    critical_alerts_result = await db.execute(
        select(func.count(Alert.id)).where(
            and_(
                Alert.severity == "critical",
                Alert.is_resolved == False,
                *(alert_filter if alert_filter else [True])
            )
        )
    )
    critical_alerts = critical_alerts_result.scalar() or 0

    # ── Recent alerts (last 4 for cleaner UI) ──
    recent_alerts_query = select(Alert).where(
        and_(
            Alert.is_resolved == False,
            *(alert_filter if alert_filter else [True])
        )
    ).order_by(Alert.created_at.desc()).limit(4)
    
    recent_alerts_result = await db.execute(recent_alerts_query)
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
    high_risk_query = select(Shipment).where(
        and_(
            Shipment.risk_score > 60,
            *(query_filter if query_filter else [True])
        )
    ).order_by(Shipment.risk_score.desc()).limit(10)
    
    high_risk_result = await db.execute(high_risk_query)
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
