"""
Dummy data generator — creates realistic sample data for the entire system.
Run once at startup to populate the database with demo-ready content.
"""

import random
from datetime import datetime, timedelta
from database.models import (
    Shipment, Supplier, Alert, ActionLog, Inventory,
    DemandForecast, RiskHistory, ShipmentStatus, RiskLevel, AlertSeverity
)

# ── Realistic locations with coordinates ──
LOCATIONS = [
    {"city": "Shanghai", "country": "China", "lat": 31.2304, "lng": 121.4737},
    {"city": "Los Angeles", "country": "USA", "lat": 33.9425, "lng": -118.4081},
    {"city": "Rotterdam", "country": "Netherlands", "lat": 51.9244, "lng": 4.4777},
    {"city": "Singapore", "country": "Singapore", "lat": 1.3521, "lng": 103.8198},
    {"city": "Dubai", "country": "UAE", "lat": 25.2048, "lng": 55.2708},
    {"city": "Mumbai", "country": "India", "lat": 19.0760, "lng": 72.8777},
    {"city": "Hamburg", "country": "Germany", "lat": 53.5511, "lng": 9.9937},
    {"city": "Tokyo", "country": "Japan", "lat": 35.6762, "lng": 139.6503},
    {"city": "New York", "country": "USA", "lat": 40.7128, "lng": -74.0060},
    {"city": "São Paulo", "country": "Brazil", "lat": -23.5505, "lng": -46.6333},
    {"city": "London", "country": "UK", "lat": 51.5074, "lng": -0.1278},
    {"city": "Sydney", "country": "Australia", "lat": -33.8688, "lng": 151.2093},
]

CARRIERS = [
    "Maersk Line", "MSC", "CMA CGM", "COSCO", "Hapag-Lloyd",
    "FedEx Freight", "DHL Express", "UPS Supply Chain", "Evergreen Marine"
]

SUPPLIERS = [
    {"name": "TechParts Global", "location": "Shenzhen, China", "lat": 22.5431, "lng": 114.0579},
    {"name": "EuroParts GmbH", "location": "Munich, Germany", "lat": 48.1351, "lng": 11.5820},
    {"name": "Pacific Components", "location": "Osaka, Japan", "lat": 34.6937, "lng": 135.5023},
    {"name": "AmeriSource Inc", "location": "Chicago, USA", "lat": 41.8781, "lng": -87.6298},
    {"name": "IndoMaterials Ltd", "location": "Jakarta, Indonesia", "lat": -6.2088, "lng": 106.8456},
    {"name": "BrazilSteel SA", "location": "São Paulo, Brazil", "lat": -23.5505, "lng": -46.6333},
    {"name": "UAE Logistics Co", "location": "Dubai, UAE", "lat": 25.2048, "lng": 55.2708},
    {"name": "Nordic Supply AS", "location": "Oslo, Norway", "lat": 59.9139, "lng": 10.7522},
]

WAREHOUSES = [
    {"id": "WH-NA-01", "name": "North America Hub", "lat": 41.8781, "lng": -87.6298},
    {"id": "WH-EU-01", "name": "Europe Distribution Center", "lat": 51.9244, "lng": 4.4777},
    {"id": "WH-AP-01", "name": "Asia Pacific Hub", "lat": 1.3521, "lng": 103.8198},
    {"id": "WH-ME-01", "name": "Middle East Hub", "lat": 25.2048, "lng": 55.2708},
]

PRODUCT_CATEGORIES = [
    "Electronics", "Automotive Parts", "Pharmaceuticals",
    "Textiles", "Raw Materials", "Consumer Goods"
]

ALERT_TEMPLATES = [
    {"title": "Severe Weather Alert", "cat": "weather", "sev": AlertSeverity.CRITICAL,
     "msg": "Typhoon warning along Pacific shipping route. Expect 48-72hr delays."},
    {"title": "Port Congestion", "cat": "traffic", "sev": AlertSeverity.WARNING,
     "msg": "Port of Shanghai experiencing heavy congestion. Average wait time: 36hrs."},
    {"title": "Supplier Delay", "cat": "supplier", "sev": AlertSeverity.WARNING,
     "msg": "Supplier reported production line maintenance. Shipment may be delayed 5 days."},
    {"title": "Demand Spike Detected", "cat": "demand", "sev": AlertSeverity.INFO,
     "msg": "AI model detected 23% demand increase in Electronics category for next month."},
    {"title": "Temperature Exceedance", "cat": "iot", "sev": AlertSeverity.CRITICAL,
     "msg": "Cold-chain breach detected. Container temp exceeded 8°C threshold."},
    {"title": "Route Disruption", "cat": "traffic", "sev": AlertSeverity.CRITICAL,
     "msg": "Major highway closure detected on route. Estimated 12hr detour required."},
    {"title": "Customs Hold", "cat": "regulatory", "sev": AlertSeverity.WARNING,
     "msg": "Shipment held at customs for additional documentation. Resolution pending."},
    {"title": "Inventory Low", "cat": "inventory", "sev": AlertSeverity.WARNING,
     "msg": "Inventory for Automotive Parts below reorder point at Europe DC."},
]


def _random_tracking_id():
    return f"SL-{random.randint(100000, 999999)}"


def _interpolate_position(origin, dest, progress):
    """Simulate current position between origin and destination."""
    lat = origin["lat"] + (dest["lat"] - origin["lat"]) * progress
    lng = origin["lng"] + (dest["lng"] - origin["lng"]) * progress
    return lat, lng


def generate_shipments(count=25):
    """Generate realistic shipment records."""
    shipments = []
    statuses_pool = [
        (ShipmentStatus.IN_TRANSIT, 0.45),
        (ShipmentStatus.PENDING, 0.15),
        (ShipmentStatus.DELIVERED, 0.20),
        (ShipmentStatus.DELAYED, 0.15),
        (ShipmentStatus.REROUTED, 0.05),
    ]

    for i in range(count):
        origin = random.choice(LOCATIONS)
        dest = random.choice([l for l in LOCATIONS if l != origin])
        # Weighted random status
        status = random.choices(
            [s[0] for s in statuses_pool],
            [s[1] for s in statuses_pool]
        )[0]

        # Progress along route
        progress = random.uniform(0.1, 0.95) if status == ShipmentStatus.IN_TRANSIT else (
            1.0 if status == ShipmentStatus.DELIVERED else random.uniform(0, 0.5)
        )
        curr_lat, curr_lng = _interpolate_position(origin, dest, progress)

        # Risk scoring
        risk = random.randint(5, 95)
        risk_level = (
            RiskLevel.LOW if risk < 40
            else RiskLevel.MEDIUM if risk < 70
            else RiskLevel.HIGH if risk < 85
            else RiskLevel.CRITICAL
        )

        days_ago = random.randint(0, 14)
        eta_days = random.randint(1, 21)

        shipments.append(Shipment(
            tracking_id=_random_tracking_id(),
            origin=f"{origin['city']}, {origin['country']}",
            destination=f"{dest['city']}, {dest['country']}",
            origin_lat=origin["lat"],
            origin_lng=origin["lng"],
            dest_lat=dest["lat"],
            dest_lng=dest["lng"],
            current_lat=curr_lat,
            current_lng=curr_lng,
            status=status.value,
            carrier=random.choice(CARRIERS),
            weight_kg=round(random.uniform(100, 25000), 1),
            value_usd=round(random.uniform(5000, 500000), 2),
            temperature=round(random.uniform(-5, 35), 1),
            humidity=round(random.uniform(20, 90), 1),
            eta=datetime.utcnow() + timedelta(days=eta_days),
            actual_delivery=(
                datetime.utcnow() - timedelta(days=random.randint(0, 3))
                if status == ShipmentStatus.DELIVERED else None
            ),
            risk_score=risk,
            risk_level=risk_level.value,
            carbon_kg=round(random.uniform(50, 5000), 1),
            created_at=datetime.utcnow() - timedelta(days=days_ago),
        ))

    return shipments


def generate_suppliers():
    """Generate supplier scorecard data."""
    return [
        Supplier(
            name=s["name"],
            location=s["location"],
            lat=s["lat"],
            lng=s["lng"],
            reliability_score=round(random.uniform(60, 98), 1),
            lead_time_days=round(random.uniform(2, 15), 1),
            cost_rating=round(random.uniform(2, 5), 1),
            quality_rating=round(random.uniform(3, 5), 1),
            carbon_rating=round(random.uniform(2, 5), 1),
            total_orders=random.randint(50, 500),
            on_time_deliveries=random.randint(40, 480),
            defect_rate=round(random.uniform(0.005, 0.08), 3),
            is_active=True,
        )
        for s in SUPPLIERS
    ]


def generate_alerts(shipment_ids):
    """Generate sample alerts linked to shipments."""
    alerts = []
    for _ in range(15):
        template = random.choice(ALERT_TEMPLATES)
        alerts.append(Alert(
            shipment_id=random.choice(shipment_ids) if shipment_ids else None,
            title=template["title"],
            message=template["msg"],
            severity=template["sev"].value,
            category=template["cat"],
            is_read=random.choice([True, False]),
            is_resolved=random.choice([True, False, False]),
            created_at=datetime.utcnow() - timedelta(hours=random.randint(0, 72)),
        ))
    return alerts


def generate_action_logs(shipment_ids):
    """Generate sample automated action history."""
    action_types = [
        ("reroute", "Shipment rerouted to avoid weather disruption on Pacific corridor"),
        ("switch_supplier", "Switched to backup supplier EuroParts GmbH due to delay"),
        ("rebalance_stock", "Transferred 500 units from NA Hub to EU DC to meet demand"),
        ("create_purchase_order", "Auto-created PO #4521 for 1000 units of Electronics"),
        ("alert_only", "Monitoring increased — risk score rose above threshold"),
    ]
    logs = []
    for _ in range(12):
        action, desc = random.choice(action_types)
        before = random.randint(50, 95)
        logs.append(ActionLog(
            shipment_id=random.choice(shipment_ids) if shipment_ids else None,
            action_type=action,
            description=desc,
            reason=f"AI Engine detected risk score {before} exceeding threshold. "
                   f"Probability of delay: {random.randint(60, 95)}%",
            risk_score_before=before,
            risk_score_after=max(10, before - random.randint(15, 40)),
            cost_impact_usd=round(random.uniform(-5000, 15000), 2),
            carbon_impact_kg=round(random.uniform(-200, 500), 1),
            auto_approved=random.choice([True, True, False]),
            success=random.choice([True, True, True, False]),
            created_at=datetime.utcnow() - timedelta(hours=random.randint(0, 168)),
        ))
    return logs


def generate_inventory():
    """Generate warehouse inventory records."""
    items = []
    for wh in WAREHOUSES:
        for cat in PRODUCT_CATEGORIES:
            qty = random.randint(50, 900)
            items.append(Inventory(
                warehouse_id=wh["id"],
                warehouse_name=wh["name"],
                product_category=cat,
                quantity=qty,
                reorder_point=random.randint(80, 200),
                max_capacity=1000,
                lat=wh["lat"],
                lng=wh["lng"],
            ))
    return items


def generate_demand_forecasts():
    """Generate 30-day demand forecasts per category."""
    forecasts = []
    for cat in PRODUCT_CATEGORIES:
        for day_offset in range(30):
            base_demand = random.uniform(100, 800)
            forecasts.append(DemandForecast(
                product_category=cat,
                region=random.choice(["North America", "Europe", "Asia Pacific", "Middle East"]),
                forecast_date=datetime.utcnow() + timedelta(days=day_offset),
                predicted_demand=round(base_demand, 1),
                confidence=round(random.uniform(0.7, 0.98), 2),
                model_version="lstm_v1.0",
            ))
    return forecasts


async def seed_database(session):
    """Main seeding function — call on first startup."""
    from sqlalchemy import select

    # Check if data already exists
    result = await session.execute(select(Shipment).limit(1))
    if result.scalar_one_or_none():
        print("[INFO] Database already seeded - skipping.")
        return

    print("[SEED] Seeding database with demo data...")

    # 1. Shipments
    shipments = generate_shipments(25)
    session.add_all(shipments)
    await session.flush()  # Get IDs

    shipment_ids = [s.id for s in shipments]

    # 2. Suppliers
    session.add_all(generate_suppliers())

    # 3. Alerts
    session.add_all(generate_alerts(shipment_ids))

    # 4. Action logs
    session.add_all(generate_action_logs(shipment_ids))

    # 5. Inventory
    session.add_all(generate_inventory())

    # 6. Demand forecasts
    session.add_all(generate_demand_forecasts())

    # 7. Add risk history for each shipment
    for s in shipments:
        for h in range(random.randint(3, 8)):
            session.add(RiskHistory(
                shipment_id=s.id,
                risk_score=max(0, min(100, s.risk_score + random.randint(-20, 20))),
                risk_factors={
                    "weather": random.randint(0, 30),
                    "traffic": random.randint(0, 25),
                    "supplier": random.randint(0, 20),
                    "demand": random.randint(0, 15),
                    "geopolitical": random.randint(0, 10),
                },
                timestamp=datetime.utcnow() - timedelta(hours=h * 6),
            ))

    await session.commit()
    print("[OK] Database seeded with 25 shipments, 8 suppliers, alerts, and more!")
