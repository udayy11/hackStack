"""
Dashboard API — aggregated KPIs, risk overview, and system health.
This is the first thing the frontend loads on app startup.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from database.connection import get_db
from database.models import Shipment, Alert, ActionLog, Supplier, Inventory, UserPreferences, RiskLevel, AlertSeverity, ShipmentStatus
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import random

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
    """Save user preferences from onboarding and create user-specific shipments/alerts"""
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
    
    # ── Create user-specific shipments from origins to destinations ──
    shipments_created = 0
    alerts_created = 0
    
    if prefs.locations.get("origins") and prefs.locations.get("destinations"):
        origins = prefs.locations["origins"]
        destinations = prefs.locations["destinations"]
        
        # Create shipments between each origin-destination pair
        for origin in origins:
            for destination in destinations:
                try:
                    # Calculate risk based on priorities
                    risk_score = random.randint(20, 85)
                    if "risk" in prefs.priorities:
                        risk_score = random.randint(60, 95)  # Higher risk focus
                    elif "speed" in prefs.priorities:
                        risk_score = random.randint(40, 70)  # Delay-related risks
                    elif "cost" in prefs.priorities:
                        risk_score = random.randint(30, 60)  # Cost-related risks
                    
                    risk_level = (
                        RiskLevel.CRITICAL if risk_score >= 85
                        else RiskLevel.HIGH if risk_score >= 70
                        else RiskLevel.MEDIUM if risk_score >= 40
                        else RiskLevel.LOW
                    )
                    
                    # Interpolate current position
                    progress = random.uniform(0.2, 0.8)
                    curr_lat = origin["lat"] + (destination["lat"] - origin["lat"]) * progress
                    curr_lng = origin["lng"] + (destination["lng"] - origin["lng"]) * progress
                    
                    shipment = Shipment(
                        tracking_id=f"USR-{user_id[:3].upper()}-{random.randint(100000, 999999)}",
                        origin=origin.get("city", "Origin"),
                        destination=destination.get("city", "Destination"),
                        origin_lat=origin["lat"],
                        origin_lng=origin["lng"],
                        dest_lat=destination["lat"],
                        dest_lng=destination["lng"],
                        current_lat=curr_lat,
                        current_lng=curr_lng,
                        status=ShipmentStatus.IN_TRANSIT,
                        carrier=random.choice(["Maersk Line", "MSC", "FedEx", "DHL", "UPS"]),
                        weight_kg=round(random.uniform(100, 10000), 1),
                        value_usd=round(random.uniform(5000, 250000), 2),
                        temperature=round(random.uniform(5, 25), 1),
                        humidity=round(random.uniform(30, 80), 1),
                        eta=datetime.utcnow() + timedelta(days=random.randint(5, 15)),
                        risk_score=risk_score,
                        risk_level=risk_level.value,
                        carbon_kg=round(random.uniform(100, 2000), 1),
                    )
                    db.add(shipment)
                    shipments_created += 1
                except Exception as e:
                    print(f"Error creating shipment: {e}")
        
        await db.flush()  # Flush to get shipment IDs
    
    # ── Create priority-based alerts ──
    alert_templates = {
        "risk": [{"title": "High Risk Shipment Detected", "msg": "Risk score exceeds threshold for selected shipment", "sev": AlertSeverity.CRITICAL}],
        "speed": [{"title": "Potential Delivery Delay", "msg": "Weather conditions may impact delivery timeline", "sev": AlertSeverity.WARNING}],
        "cost": [{"title": "Fuel Price Surge", "msg": "Carrier fuel surcharge increased - cost optimization recommended", "sev": AlertSeverity.WARNING}],
        "sustainability": [{"title": "Carbon Emissions High", "msg": "Current route has higher carbon footprint - consider alternatives", "sev": AlertSeverity.INFO}],
    }
    
    for priority in prefs.priorities:
        if priority in alert_templates:
            for template in alert_templates[priority]:
                alert = Alert(
                    title=template["title"],
                    message=template["msg"],
                    severity=template["sev"].value,
                    category=priority,
                    is_read=False,
                    is_resolved=False,
                    created_at=datetime.utcnow(),
                )
                db.add(alert)
                alerts_created += 1
    
    await db.commit()
    
    return {
        "status": "saved",
        "preferences": prefs,
        "created": {
            "shipments": shipments_created,
            "alerts": alerts_created,
        }
    }


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
        Alert.is_resolved == False
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
