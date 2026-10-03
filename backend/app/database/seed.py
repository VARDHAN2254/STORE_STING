import asyncio
import uuid
from decimal import Decimal
from sqlalchemy import select
from app.database.session import engine, async_session_factory
from app.database.base import Base
from app.database.models import (
    User, Address, Category, Product, ProductImage,
    Inventory, Review
)
from app.core.security import get_password_hash


CATEGORIES_DATA = [
    {
        "id": "cat-computers",
        "slug": "computers",
        "name": "Computers & Laptops",
        "description": "Ultra-light neural laptops, quantum OLED notebooks, and mobile workstations built for high-performance creativity and coding.",
        "icon_name": "Laptop",
        "sort_order": 1,
    },
    {
        "id": "cat-mobiles",
        "slug": "mobiles",
        "name": "Mobiles & Communicators",
        "description": "Holographic-ready pocket communicators, adaptive titanium phones, and neural handheld interfaces.",
        "icon_name": "Smartphone",
        "sort_order": 2,
    },
    {
        "id": "cat-wearables",
        "slug": "wearables",
        "name": "Wearables & Biometrics",
        "description": "Sub-dermal health rings, neural band monitors, and acoustic spatial earbuds tuned for uninterrupted focus.",
        "icon_name": "Watch",
        "sort_order": 3,
    },
    {
        "id": "cat-workspace",
        "slug": "workspace",
        "name": "Workspace & Ergonomics",
        "description": "Floating magnetic stands, haptic tactile keyboards, daylight simulation lamps, and modular desk architecture.",
        "icon_name": "Monitor",
        "sort_order": 4,
    },
    {
        "id": "cat-home",
        "slug": "home",
        "name": "Smart Living & Ambience",
        "description": "Air purification nodes, ambient climate regulators, and invisible acoustic soundscapes for modern living.",
        "icon_name": "Home",
        "sort_order": 5,
    },
    {
        "id": "cat-lifestyle",
        "slug": "lifestyle",
        "name": "Lifestyle & Travel Gear",
        "description": "Self-healing carbon fiber backpacks, weather-adaptive commute coats, and minimalist EDC gear.",
        "icon_name": "Compass",
        "sort_order": 6,
    },
]

PRODUCTS_DATA = [
    {
        "sku": "LAP-ASTRA-01",
        "category_id": "cat-computers",
        "name": "AstraBook Pro 100",
        "slug": "astrabook-pro-100",
        "brand": "Astra",
        "price": Decimal("64990.00"),
        "discount_percent": 12,
        "discounted_price": Decimal("57190.00"),
        "rating": Decimal("4.90"),
        "review_count": 128,
        "stock_status": "In Stock",
        "stock_units": 45,
        "badges": ["96% Match", "Great for coding", "Ultra Lightweight", "Editor's Choice"],
        "best_for": "Software developers, data engineers, and heavy multi-tasking",
        "description": "The AstraBook Pro 100 delivers relentless performance inside a 980g magnesium-aerogel chassis. Featuring a 120Hz Calibrated 3.2K PureOLED display and 24-hour neural battery optimization.",
        "specs": {
            "Processor": "Astra Neural Core X9 (16 Cores)",
            "Memory": "32GB LPDDR5X Unified",
            "Storage": "1TB PCIe Gen 5 NVMe",
            "Display": "14.2-inch PureOLED 3.2K (3200x2000), 120Hz",
            "Battery": "84Wh, up to 24 hours battery life",
            "Weight": "0.98 kg (2.16 lbs)",
            "Ports": "3x Thunderbolt 5, MagFast Power, 3.5mm Hi-Res Audio"
        },
        "features": [
            "Passive zero-noise magnetic fluid cooling architecture",
            "PureOLED 3.2K display with 100% DCI-P3 color fidelity",
            "Instant Wake biometric iris and neural palm authentication",
            "All-day 24h battery life with 65W FastGan charging"
        ],
        "whats_included": [
            "AstraBook Pro 100",
            "65W GaN Compact USB-C Charger",
            "Braided 2m USB4 Cable",
            "Microfiber Screen Cloth",
            "2-Year Global Warranty"
        ],
        "goal_tags": ["students", "creators", "workspace"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80", "is_primary": True, "alt": "AstraBook Pro 100 Front View"},
            {"url": "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80", "is_primary": False, "alt": "AstraBook Pro 100 Angle"},
        ],
    },
    {
        "sku": "LAP-NOVA-02",
        "category_id": "cat-computers",
        "name": "NovaBook Air Pure",
        "slug": "novabook-air-pure",
        "brand": "Nova",
        "price": Decimal("49990.00"),
        "discount_percent": 15,
        "discounted_price": Decimal("42490.00"),
        "rating": Decimal("4.75"),
        "review_count": 94,
        "stock_status": "In Stock",
        "stock_units": 60,
        "badges": ["Top Value", "Best for Students", "Silent Design"],
        "best_for": "Students, writers, and daily productivity champions",
        "description": "Sleek, silent, and effortlessly fast. NovaBook Air Pure is milled from recycled aerospace aluminum, weighing just 890g with whisper-silent passive acoustics.",
        "specs": {
            "Processor": "Nova M3 Quad-Efficiency",
            "Memory": "16GB Low-Latency RAM",
            "Storage": "512GB High-Speed SSD",
            "Display": "13.6-inch Retina ClearView, 400 nits",
            "Battery": "18 hours continuous web & coding",
            "Weight": "0.89 kg",
            "Ports": "2x USB-C, 1x Audio Jack"
        },
        "features": [
            "Featherweight 890g all-aluminum unibody",
            "Silent fanless thermal architecture",
            "Studio-quality quad directional microphone array",
            "Backlit tactile scissor keyboard with ambient glow"
        ],
        "whats_included": ["NovaBook Air", "45W USB-C Charger", "Setup Guide"],
        "goal_tags": ["students", "travel", "workspace"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80", "is_primary": True, "alt": "NovaBook Air Pure Display"},
        ],
    },
    {
        "sku": "LAP-TITAN-03",
        "category_id": "cat-computers",
        "name": "TitanBook Studio Extreme",
        "slug": "titanbook-studio-extreme",
        "brand": "Titan",
        "price": Decimal("129990.00"),
        "discount_percent": 8,
        "discounted_price": Decimal("119590.00"),
        "rating": Decimal("4.95"),
        "review_count": 62,
        "stock_status": "Low Stock",
        "stock_units": 8,
        "badges": ["Peak Performance", "Pro Creators", "Workstation Class"],
        "best_for": "3D visualizers, game developers, ML researchers, and video editors",
        "description": "Uncompromising compute power. Engineered with dual vapor-chamber cooling, discrete neural ray-tracing GPU, and an anti-reflective 4K Mini-LED display.",
        "specs": {
            "Processor": "Titan Max 24-Core Workstation Chip",
            "Memory": "64GB DDR5 ECC-Ready",
            "Storage": "2TB NVMe Dual RAID 0",
            "Display": "16.0-inch 4K Mini-LED 165Hz HDR1000",
            "Battery": "99.9Wh (FAA Airline Approved)",
            "Weight": "1.78 kg",
            "Ports": "4x Thunderbolt 5, Full HDMI 2.1, SD Express 8.0"
        },
        "features": [
            "Dual vapor chamber active cryogenic thermal matrix",
            "4K Mini-LED 1600 nits peak brightness with local dimming",
            "Dedicated 120 TOPS Neural Accelerator for local AI models",
            "SD Express 8.0 full-size reader for 4GB/s media ingest"
        ],
        "whats_included": ["TitanBook Studio Extreme", "140W GaN SuperCharger", "Velvet Travel Sleeve"],
        "goal_tags": ["creators", "gamers", "workspace"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1000&q=80", "is_primary": True, "alt": "TitanBook Studio Extreme Studio"},
        ],
    },
    {
        "sku": "MOB-VERTEX-01",
        "category_id": "cat-mobiles",
        "name": "Vertex One Horizon",
        "slug": "vertex-one-horizon",
        "brand": "Vertex",
        "price": Decimal("54990.00"),
        "discount_percent": 10,
        "discounted_price": Decimal("49490.00"),
        "rating": Decimal("4.85"),
        "review_count": 184,
        "stock_status": "In Stock",
        "stock_units": 40,
        "badges": ["Titanium Grade 5", "Neural Lens", "Satellite Sync"],
        "best_for": "Mobile creators, tech enthusiasts, and international travelers",
        "description": "Forged in brushed grade 5 titanium with an edge-to-edge borderless sapphire glass front. Features computational optics that capture true light in zero lux.",
        "specs": {
            "Processor": "Quantum V2 Bionic",
            "Display": "6.7-inch Super AMOLED 1-120Hz LTPO",
            "Camera": "200MP Main + 50MP Periscope 10x Optical + LiDAR",
            "Battery": "5200mAh with 80W Wireless Charging",
            "Durability": "IP69K Waterproof & Dust Sealed"
        },
        "features": [
            "Zero-border true edge sapphire glass panel",
            "Periscope optical lens with lossless 100x hybrid zoom",
            "Direct Low-Earth-Orbit satellite emergency mesh sync",
            "Bionic haptics with programmable capacitive action button"
        ],
        "whats_included": ["Vertex One Horizon", "FastCharge Dock", "Braided USB-C Cable"],
        "goal_tags": ["creators", "travel"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80", "is_primary": True, "alt": "Vertex One Horizon Phone"},
        ],
    },
    {
        "sku": "WRB-PULSE-01",
        "category_id": "cat-wearables",
        "name": "PulseFit Neuro Spatial Earbuds",
        "slug": "pulsefit-neuro-spatial",
        "brand": "PulseFit",
        "price": Decimal("14990.00"),
        "discount_percent": 20,
        "discounted_price": Decimal("11990.00"),
        "rating": Decimal("4.90"),
        "review_count": 210,
        "stock_status": "In Stock",
        "stock_units": 85,
        "badges": ["Acoustic Master", "EEG Focus Tracking", "Adaptive ANC"],
        "best_for": "Engineers in noisy offices, audiophiles, and deep work sessions",
        "description": "Equipped with micro EEG sensors along the ear tip to measure focus depth and automatically attenuate background distractions in real time.",
        "specs": {
            "Acoustics": "Dual 11mm Beryllium Planar Drivers",
            "Noise Cancellation": "Hybrid Adaptive ANC up to -48dB",
            "Battery Life": "12 hours on single charge, 48 hours with charging capsule",
            "Sensors": "EEG Focus Flow Sensor, Optical Heart Sensor, In-Ear Mic"
        },
        "features": [
            "Real-time focus telemetry synced to your productivity apps",
            "True spatial audio with 6-axis dynamic head tracking",
            "Aero-comfort memory foam tips in 5 custom sizes",
            "IPX7 water & sweat resistance for intense workouts"
        ],
        "whats_included": ["PulseFit Neuro Earbuds", "Wireless Charging Capsule", "5x Ear Tips Set", "USB-C Cable"],
        "goal_tags": ["students", "workspace", "travel"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1000&q=80", "is_primary": True, "alt": "PulseFit Neuro Earbuds"},
        ],
    },
    {
        "sku": "WSP-AURA-01",
        "category_id": "cat-workspace",
        "name": "AuraBeam Daylight Monitor Lamp",
        "slug": "aurabeam-daylight-lamp",
        "brand": "Aura",
        "price": Decimal("8490.00"),
        "discount_percent": 15,
        "discounted_price": Decimal("7190.00"),
        "rating": Decimal("4.80"),
        "review_count": 142,
        "stock_status": "In Stock",
        "stock_units": 50,
        "badges": ["Zero Glare", "Circadian Sync", "Touch Dial"],
        "best_for": "Late night coders, graphic designers, and desk setups",
        "description": "Asymmetric optical path illuminates your desk without a single reflection on your screen. Automatically balances color temperature with the external sun.",
        "specs": {
            "CRI Rating": "Ra98 Ultra True Spectrum",
            "Illuminance": "Up to 1000 Lux @ 45cm",
            "Color Temp": "2700K - 6500K dynamic range",
            "Mount": "Weighted counter-balance clamp for flat & curved displays"
        },
        "features": [
            "Circadian sync adjusts light warmth to match the real-time sky",
            "Wireless aluminum rotary desk dial with haptic clicks",
            "Patented zero-screen-glare lens hood",
            "Ambient back-glow for contrast relief in dark rooms"
        ],
        "whats_included": ["AuraBeam Light Bar", "Wireless Rotary Puck", "Braided USB-C Cable"],
        "goal_tags": ["workspace", "creators"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80", "is_primary": True, "alt": "AuraBeam Lamp"},
        ],
    },
    {
        "sku": "WSP-KEY-01",
        "category_id": "cat-workspace",
        "name": "ZenType Ceramic Tactile Keyboard",
        "slug": "zentype-ceramic-keyboard",
        "brand": "ZenNest",
        "price": Decimal("16990.00"),
        "discount_percent": 10,
        "discounted_price": Decimal("15290.00"),
        "rating": Decimal("4.92"),
        "review_count": 88,
        "stock_status": "In Stock",
        "stock_units": 35,
        "badges": ["Ceramic Keycaps", "Gasket Mount", "Tri-Mode Wireless"],
        "best_for": "Developers seeking the most satisfying, effortless typing acoustic feel",
        "description": "Crafted with pure polished ceramic keycaps and custom lubed magnetic hall-effect switches. Delivers a deep, soothing thock acoustic signature.",
        "specs": {
            "Layout": "75% Compact with CNC Volume Knob",
            "Switch Type": "Hall-Effect Magnetic Switches with Rapid Trigger",
            "Connectivity": "2.4GHz Low-Latency, Bluetooth 5.3, USB-C",
            "Battery": "4000mAh (up to 200 hours typing without backlight)"
        },
        "features": [
            "Cool-to-the-touch polished white ceramic keycaps",
            "Analog magnetic switches with customizable 0.1mm actuation",
            "Custom sound-dampening silicon gasket sandwich",
            "Seamless multi-device switching between Mac, Windows & iPad"
        ],
        "whats_included": ["ZenType Keyboard", "Ceramic Keycap Puller", "Magnetic Wrist Rest", "Coiled Aviator Cable"],
        "goal_tags": ["workspace", "gamers", "creators"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80", "is_primary": True, "alt": "ZenType Ceramic Keyboard"},
        ],
    },
    {
        "sku": "LST-URBAN-01",
        "category_id": "cat-lifestyle",
        "name": "UrbanCarry Carbon Nomad Pack",
        "slug": "urbancarry-carbon-nomad",
        "brand": "UrbanCarry",
        "price": Decimal("11990.00"),
        "discount_percent": 15,
        "discounted_price": Decimal("10190.00"),
        "rating": Decimal("4.88"),
        "review_count": 115,
        "stock_status": "In Stock",
        "stock_units": 70,
        "badges": ["Carbon Weave", "Waterproof YKK", "Fidlock Magnets"],
        "best_for": "Commuters, tech nomads, and weekend city exploration",
        "description": "Constructed from ultra-durable recycled Dyneema composite and carbon fabric. Engineered with an isolated suspended laptop cradle and magnetic Fidlock closures.",
        "specs": {
            "Capacity": "24 Liters Expandable to 28L",
            "Laptop Compartment": "Suspended cradle fits up to 16-inch laptops",
            "Material": "Eco-Dyneema & Carbon Ripstop Weatherproof",
            "Weight": "780g empty"
        },
        "features": [
            "Suspended false-bottom laptop compartment safeguards against drops",
            "Quick-access magnetic Fidlock chest strap and pocket buckles",
            "Hidden passport & travel tracker pocket with RFID protection",
            "Ergonomic airflow back channel with breathable mesh"
        ],
        "whats_included": ["UrbanCarry Carbon Nomad Backpack", "Modular Cable Pouch"],
        "goal_tags": ["travel", "students", "workspace"],
        "images": [
            {"url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80", "is_primary": True, "alt": "UrbanCarry Carbon Nomad Pack"},
        ],
    },
]


async def seed_database():
    print("Connecting to PostgreSQL and creating schema...")
    async with engine.begin() as conn:
        from sqlalchemy import text
        try:
            await conn.execute(text("ALTER TABLE run_events ADD COLUMN IF NOT EXISTS sequence_number INTEGER NOT NULL DEFAULT 1;"))
        except Exception:
            pass
        await conn.run_sync(Base.metadata.create_all)
    print("Schema initialized successfully.")

    async with async_session_factory() as session:
        # Check if already seeded
        result = await session.execute(select(Category))
        existing_cat = result.scalars().first()
        if existing_cat:
            print("Database already contains data. Skipping initial seed.")
            return

        # -------------------------------------------------------------------------
        # LOCAL DEVELOPMENT / DEMO CREDENTIALS ONLY
        # DO NOT USE IN PRODUCTION ENVIRONMENTS.
        # Set real administrative accounts via environment or secure provisioning.
        # -------------------------------------------------------------------------
        print("Seeding Users (Development Sandbox)...")
        admin = User(
            id=str(uuid.uuid4()),
            email="admin@storesting.com",
            hashed_password=get_password_hash("StoreSting2050!"),
            full_name="Operations Lead (STORE STING)",
            role="admin",
            preferences={"theme": "light", "notifications_enabled": True},
        )
        customer = User(
            id="usr-alex-2050",
            email="alex@storesting.com",
            hashed_password=get_password_hash("Customer2050!"),
            full_name="Alex Mercer",
            role="customer",
            preferences={"theme": "light", "budget_currency": "INR", "preferred_category": "computers"},
        )
        session.add_all([admin, customer])

        print("Seeding Customer Address...")
        address = Address(
            id=str(uuid.uuid4()),
            user_id="usr-alex-2050",
            label="Studio",
            recipient_name="Alex Mercer",
            phone="+91 98765 43210",
            street_line1="742 Innovation Way, Indiranagar",
            street_line2="Level 4, Creator Hub",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560038",
            country="India",
            is_default=True,
        )
        session.add(address)

        print("Seeding Categories...")
        for cat_dict in CATEGORIES_DATA:
            cat = Category(**cat_dict)
            session.add(cat)

        print("Seeding Products and Inventory...")
        for p_dict in PRODUCTS_DATA:
            images_data = p_dict.pop("images", [])
            stock_units = p_dict.pop("stock_units", 50)
            
            product = Product(
                id=str(uuid.uuid4()),
                **p_dict,
            )
            session.add(product)
            await session.flush()

            # Add images
            for idx, img in enumerate(images_data):
                p_img = ProductImage(
                    id=str(uuid.uuid4()),
                    product_id=product.id,
                    url=img["url"],
                    alt_text=img.get("alt", product.name),
                    is_primary=img.get("is_primary", idx == 0),
                    sort_order=idx,
                )
                session.add(p_img)

            # Add Inventory
            inv = Inventory(
                id=str(uuid.uuid4()),
                product_id=product.id,
                warehouse="Main Bengaluru Hub",
                stock_units=stock_units,
                reserved_units=0,
                available_units=stock_units,
            )
            session.add(inv)

            # Add sample review
            rev = Review(
                id=str(uuid.uuid4()),
                product_id=product.id,
                user_id="usr-alex-2050",
                rating=Decimal("5.0"),
                title="Astonishing engineering and clean simplicity",
                comment="Exceeded expectations. The build quality feels light-years ahead of everything else on the market.",
                is_verified_purchase=True,
                helpful_votes=14,
            )
            session.add(rev)

        await session.commit()
        print("STORE STING database successfully seeded with Soft Future catalog!")


if __name__ == "__main__":
    asyncio.run(seed_database())
