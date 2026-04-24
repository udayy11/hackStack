"""
Suppliers API — supplier scorecard and management.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.connection import get_db
from database.models import Supplier

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])


@router.get("")
async def list_suppliers(db: AsyncSession = Depends(get_db)):
    """Get all supplier scorecards."""
    result = await db.execute(select(Supplier).order_by(Supplier.reliability_score.desc()))
    suppliers = result.scalars().all()

    return {
        "suppliers": [
            {
                "id": s.id,
                "name": s.name,
                "location": s.location,
                "lat": s.lat,
                "lng": s.lng,
                "reliability_score": s.reliability_score,
                "lead_time_days": s.lead_time_days,
                "cost_rating": s.cost_rating,
                "quality_rating": s.quality_rating,
                "carbon_rating": s.carbon_rating,
                "total_orders": s.total_orders,
                "on_time_deliveries": s.on_time_deliveries,
                "otif_percentage": round(
                    (s.on_time_deliveries / max(s.total_orders, 1)) * 100, 1
                ),
                "defect_rate": s.defect_rate,
                "is_active": s.is_active,
            }
            for s in suppliers
        ],
        "total": len(suppliers),
    }


@router.get("/{supplier_id}")
async def get_supplier(supplier_id: int, db: AsyncSession = Depends(get_db)):
    """Get detailed supplier info."""
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        return {"error": "Supplier not found"}

    return {
        "id": supplier.id,
        "name": supplier.name,
        "location": supplier.location,
        "reliability_score": supplier.reliability_score,
        "lead_time_days": supplier.lead_time_days,
        "cost_rating": supplier.cost_rating,
        "quality_rating": supplier.quality_rating,
        "carbon_rating": supplier.carbon_rating,
        "total_orders": supplier.total_orders,
        "on_time_deliveries": supplier.on_time_deliveries,
        "defect_rate": supplier.defect_rate,
    }
