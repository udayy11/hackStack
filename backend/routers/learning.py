"""
Learning Loop API — model improvement endpoints.
"""

from fastapi import APIRouter
from services.learning_loop import learning_loop

router = APIRouter(prefix="/api/learning", tags=["Learning"])


@router.get("/metrics")
async def get_metrics():
    """Get current model accuracy metrics."""
    return await learning_loop.evaluate_outcomes()


@router.post("/optimize-weights")
async def optimize_weights():
    """Trigger risk scoring weight optimization."""
    return await learning_loop.optimize_weights()


@router.post("/retrain")
async def retrain_models():
    """Trigger model retraining."""
    return await learning_loop.retrain_forecaster()


@router.get("/summary")
async def get_summary():
    """Get overall system improvement summary."""
    return await learning_loop.get_improvement_summary()
