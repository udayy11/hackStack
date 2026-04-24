"""
Demand Forecasting Module — LSTM-based time-series prediction.

In production, this would use a trained TensorFlow/Keras LSTM model.
For the demo, we use a lightweight statistical approach that mimics
LSTM behavior (trend + seasonality + noise) so it runs without GPU.
"""

import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict
import math


class DemandForecaster:
    """
    Simulates LSTM demand forecasting with realistic patterns.
    The model captures:
      - Base trend (linear growth)
      - Weekly seasonality
      - Monthly seasonality
      - Random noise (uncertainty)
    """

    def __init__(self):
        self.model_version = "lstm_v1.0"
        self.is_trained = False
        # Learned parameters (would come from training in production)
        self.params = {
            "Electronics": {"base": 450, "trend": 2.1, "weekly_amp": 50, "monthly_amp": 80},
            "Automotive Parts": {"base": 320, "trend": 1.5, "weekly_amp": 30, "monthly_amp": 60},
            "Pharmaceuticals": {"base": 280, "trend": 3.0, "weekly_amp": 20, "monthly_amp": 40},
            "Textiles": {"base": 200, "trend": 0.8, "weekly_amp": 40, "monthly_amp": 70},
            "Raw Materials": {"base": 550, "trend": 1.2, "weekly_amp": 60, "monthly_amp": 90},
            "Consumer Goods": {"base": 380, "trend": 2.5, "weekly_amp": 45, "monthly_amp": 65},
        }

    def predict(self, category: str, horizon_days: int = 30) -> List[Dict]:
        """
        Generate demand forecast for the next `horizon_days` days.

        Returns a list of dicts with:
          - date: forecast date
          - predicted_demand: expected demand
          - lower_bound: 95% CI lower
          - upper_bound: 95% CI upper
          - confidence: model confidence (0-1)
        """
        params = self.params.get(category, self.params["Consumer Goods"])
        forecasts = []

        for day in range(horizon_days):
            t = day  # time step
            date = datetime.utcnow() + timedelta(days=day)

            # ── LSTM-like components ──
            # 1. Base + linear trend
            base = params["base"] + params["trend"] * t

            # 2. Weekly seasonality (day-of-week effect)
            weekly = params["weekly_amp"] * math.sin(2 * math.pi * t / 7)

            # 3. Monthly seasonality
            monthly = params["monthly_amp"] * math.sin(2 * math.pi * t / 30)

            # 4. Noise (uncertainty increases with horizon)
            noise_std = 10 + 2 * t  # growing uncertainty
            noise = np.random.normal(0, noise_std)

            # Combine
            demand = max(0, base + weekly + monthly + noise)

            # Confidence decreases with forecast horizon
            confidence = max(0.5, 0.98 - 0.015 * t)

            forecasts.append({
                "date": date.isoformat(),
                "predicted_demand": round(demand, 1),
                "lower_bound": round(max(0, demand - 1.96 * noise_std), 1),
                "upper_bound": round(demand + 1.96 * noise_std, 1),
                "confidence": round(confidence, 3),
            })

        return forecasts

    def retrain(self, historical_data: List[Dict]) -> Dict:
        """
        Simulates model retraining with new data.
        In production: would feed data into TF/Keras LSTM and update weights.
        """
        self.model_version = f"lstm_v1.{int(datetime.utcnow().timestamp()) % 100}"
        self.is_trained = True
        return {
            "status": "retrained",
            "model_version": self.model_version,
            "samples_used": len(historical_data),
            "mape": round(np.random.uniform(5, 12), 2),  # Mean Absolute % Error
            "rmse": round(np.random.uniform(20, 50), 2),
        }


# ── Singleton ──
demand_forecaster = DemandForecaster()
