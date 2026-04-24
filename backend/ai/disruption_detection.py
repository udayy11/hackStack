"""
Disruption Detection Module — NLP + Anomaly Detection.

Simulates two AI capabilities:
1. NLP: Analyzes text (news, reports) to detect supply chain disruptions
2. Anomaly Detection: Monitors sensor/telemetry data for outliers
"""

import random
import math
from datetime import datetime
from typing import List, Dict, Optional


class DisruptionDetector:
    """
    Combines NLP text analysis and statistical anomaly detection
    to identify supply chain disruptions before they escalate.
    """

    def __init__(self):
        # ── NLP keyword patterns (simulates transformer classification) ──
        self.disruption_keywords = {
            "weather": {
                "keywords": ["storm", "typhoon", "hurricane", "flood", "earthquake",
                             "tsunami", "blizzard", "wildfire", "tornado"],
                "severity_weight": 0.9,
            },
            "geopolitical": {
                "keywords": ["sanctions", "embargo", "war", "conflict", "tariff",
                             "trade war", "blockade", "protest", "coup"],
                "severity_weight": 0.85,
            },
            "operational": {
                "keywords": ["strike", "shutdown", "bankruptcy", "recall", "shortage",
                             "congestion", "closure", "accident", "fire"],
                "severity_weight": 0.7,
            },
            "demand": {
                "keywords": ["surge", "spike", "shortage", "panic buying", "stockout",
                             "viral", "trending", "seasonal peak"],
                "severity_weight": 0.6,
            },
        }

        # ── Anomaly detection thresholds ──
        self.thresholds = {
            "temperature": {"min": -10, "max": 30, "critical_max": 40},
            "humidity": {"min": 20, "max": 80, "critical_max": 95},
            "delay_hours": {"warning": 12, "critical": 48},
            "cost_variance_pct": {"warning": 15, "critical": 30},
        }

    def analyze_text(self, text: str) -> Dict:
        """
        NLP disruption detection — analyzes text for supply chain risk signals.
        In production: would use a fine-tuned transformer (BERT/GPT).
        """
        text_lower = text.lower()
        detections = []
        max_severity = 0

        for category, config in self.disruption_keywords.items():
            matched = [kw for kw in config["keywords"] if kw in text_lower]
            if matched:
                severity = config["severity_weight"] * (1 + 0.1 * len(matched))
                severity = min(severity, 1.0)
                max_severity = max(max_severity, severity)
                detections.append({
                    "category": category,
                    "matched_keywords": matched,
                    "severity": round(severity, 2),
                    "confidence": round(0.7 + 0.3 * random.random(), 2),
                })

        return {
            "text_analyzed": text[:200],
            "disruptions_found": len(detections),
            "detections": detections,
            "overall_severity": round(max_severity, 2),
            "risk_increase": round(max_severity * 25, 1),  # how much to add to risk score
            "timestamp": datetime.utcnow().isoformat(),
        }

    def detect_anomalies(self, shipment_data: Dict) -> Dict:
        """
        Statistical anomaly detection on shipment sensor/telemetry data.
        Checks temperature, humidity, delay, cost variance.
        """
        anomalies = []

        # Temperature check
        temp = shipment_data.get("temperature")
        if temp is not None:
            if temp > self.thresholds["temperature"]["critical_max"]:
                anomalies.append({
                    "type": "temperature_critical",
                    "value": temp,
                    "threshold": self.thresholds["temperature"]["critical_max"],
                    "severity": "critical",
                    "message": f"Temperature {temp}°C exceeds critical threshold",
                })
            elif temp > self.thresholds["temperature"]["max"]:
                anomalies.append({
                    "type": "temperature_warning",
                    "value": temp,
                    "threshold": self.thresholds["temperature"]["max"],
                    "severity": "warning",
                    "message": f"Temperature {temp}°C above normal range",
                })
            elif temp < self.thresholds["temperature"]["min"]:
                anomalies.append({
                    "type": "temperature_low",
                    "value": temp,
                    "threshold": self.thresholds["temperature"]["min"],
                    "severity": "warning",
                    "message": f"Temperature {temp}°C below minimum threshold",
                })

        # Humidity check
        humidity = shipment_data.get("humidity")
        if humidity is not None:
            if humidity > self.thresholds["humidity"]["critical_max"]:
                anomalies.append({
                    "type": "humidity_critical",
                    "value": humidity,
                    "severity": "critical",
                    "message": f"Humidity {humidity}% critically high",
                })

        # Delay check
        delay_hrs = shipment_data.get("delay_hours", 0)
        if delay_hrs > self.thresholds["delay_hours"]["critical"]:
            anomalies.append({
                "type": "delay_critical",
                "value": delay_hrs,
                "severity": "critical",
                "message": f"Shipment delayed {delay_hrs}hrs — critical threshold exceeded",
            })
        elif delay_hrs > self.thresholds["delay_hours"]["warning"]:
            anomalies.append({
                "type": "delay_warning",
                "value": delay_hrs,
                "severity": "warning",
                "message": f"Shipment delayed {delay_hrs}hrs — monitoring closely",
            })

        risk_delta = sum(
            15 if a["severity"] == "critical" else 8
            for a in anomalies
        )

        return {
            "shipment_id": shipment_data.get("tracking_id", "unknown"),
            "anomalies_found": len(anomalies),
            "anomalies": anomalies,
            "risk_increase": min(risk_delta, 40),
            "requires_action": any(a["severity"] == "critical" for a in anomalies),
            "timestamp": datetime.utcnow().isoformat(),
        }

    def scan_news_feed(self) -> List[Dict]:
        """
        Simulates scanning real-time news feeds for disruptions.
        In production: would call Google News API or RSS feeds.
        """
        fake_headlines = [
            "Typhoon Megi approaches major shipping lanes in the Pacific Ocean",
            "US-China tariff tensions escalate, new sanctions announced",
            "Major port strike at Rotterdam disrupts European supply chains",
            "Semiconductor shortage worsens, panic buying intensifies",
            "Record heatwave causes wildfire near key logistics corridors",
            "Normal trading conditions expected across Asian markets",
            "New trade agreement signed between EU and Japan, tariffs reduced",
            "Flash flooding closes key highway connecting industrial zones",
        ]
        results = []
        for headline in random.sample(fake_headlines, min(4, len(fake_headlines))):
            analysis = self.analyze_text(headline)
            if analysis["disruptions_found"] > 0:
                results.append({
                    "headline": headline,
                    "analysis": analysis,
                })
        return results


# ── Singleton ──
disruption_detector = DisruptionDetector()
