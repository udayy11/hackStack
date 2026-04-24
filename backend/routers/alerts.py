"""
Alerts API — real-time alert management.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from database.connection import get_db
from database.models import Alert
from typing import Optional

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("")
async def list_alerts(
    severity: Optional[str] = None,
    category: Optional[str] = None,
    resolved: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List alerts with filtering."""
    query = select(Alert)

    if severity:
        query = query.where(Alert.severity == severity)
    if category:
        query = query.where(Alert.category == category)
    if resolved is not None:
        query = query.where(Alert.is_resolved == resolved)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Alert.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    alerts = result.scalars().all()

    return {
        "alerts": [
            {
                "id": a.id,
                "shipment_id": a.shipment_id,
                "title": a.title,
                "message": a.message,
                "severity": a.severity,
                "category": a.category,
                "is_read": a.is_read,
                "is_resolved": a.is_resolved,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in alerts
        ],
        "total": total,
        "page": page,
    }


@router.put("/{alert_id}/read")
async def mark_alert_read(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Mark an alert as read."""
    await db.execute(update(Alert).where(Alert.id == alert_id).values(is_read=True))
    return {"status": "ok"}


@router.put("/{alert_id}/resolve")
async def resolve_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Resolve an alert."""
    await db.execute(
        update(Alert).where(Alert.id == alert_id).values(is_resolved=True, is_read=True)
    )
    return {"status": "ok"}
