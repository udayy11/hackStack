"""
Shipments API — CRUD + real-time tracking data.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database.connection import get_db
from database.models import Shipment
from typing import Optional

router = APIRouter(prefix="/api/shipments", tags=["Shipments"])


@router.get("")
async def list_shipments(
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List all shipments with optional filters."""
    query = select(Shipment)

    if status:
        query = query.where(Shipment.status == status)
    if risk_level:
        query = query.where(Shipment.risk_level == risk_level)
    if search:
        query = query.where(
            Shipment.tracking_id.ilike(f"%{search}%") |
            Shipment.origin.ilike(f"%{search}%") |
            Shipment.destination.ilike(f"%{search}%")
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    query = query.order_by(Shipment.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    shipments = result.scalars().all()

    return {
        "shipments": [_serialize_shipment(s) for s in shipments],
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/map")
async def get_shipments_for_map(db: AsyncSession = Depends(get_db)):
    """Get all shipments with location data for the control tower map."""
    result = await db.execute(
        select(Shipment).where(Shipment.current_lat.isnot(None))
    )
    shipments = result.scalars().all()

    return {
        "shipments": [
            {
                "id": s.id,
                "tracking_id": s.tracking_id,
                "origin": s.origin,
                "destination": s.destination,
                "origin_lat": s.origin_lat,
                "origin_lng": s.origin_lng,
                "dest_lat": s.dest_lat,
                "dest_lng": s.dest_lng,
                "current_lat": s.current_lat,
                "current_lng": s.current_lng,
                "status": s.status,
                "risk_score": s.risk_score,
                "risk_level": s.risk_level,
                "carrier": s.carrier,
                "eta": s.eta.isoformat() if s.eta else None,
            }
            for s in shipments
        ],
        "total": len(shipments),
    }


@router.get("/{shipment_id}")
async def get_shipment(shipment_id: int, db: AsyncSession = Depends(get_db)):
    """Get detailed shipment info."""
    result = await db.execute(select(Shipment).where(Shipment.id == shipment_id))
    shipment = result.scalar_one_or_none()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return _serialize_shipment(shipment)


def _serialize_shipment(s: Shipment) -> dict:
    return {
        "id": s.id,
        "tracking_id": s.tracking_id,
        "origin": s.origin,
        "destination": s.destination,
        "origin_lat": s.origin_lat,
        "origin_lng": s.origin_lng,
        "dest_lat": s.dest_lat,
        "dest_lng": s.dest_lng,
        "current_lat": s.current_lat,
        "current_lng": s.current_lng,
        "status": s.status,
        "carrier": s.carrier,
        "weight_kg": s.weight_kg,
        "value_usd": s.value_usd,
        "temperature": s.temperature,
        "humidity": s.humidity,
        "eta": s.eta.isoformat() if s.eta else None,
        "actual_delivery": s.actual_delivery.isoformat() if s.actual_delivery else None,
        "risk_score": s.risk_score,
        "risk_level": s.risk_level,
        "carbon_kg": s.carbon_kg,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }
