# STORE STING — Product Requirements Document (PRD)

## 1. Product Vision & Brand Identity
- **Brand**: **STORE STING**
- **Tagline**: **Shopping, reimagined.**
- **Era / Tone**: Set in circa 2050 — calm, intelligent, minimalist, human-centric, ultra-efficient.
- **Visual Direction**: **LIGHT UI ONLY**. Warm Ivory (`#F7F4EE`), Pure White (`#FFFFFF`), Soft Mist (`#EEF2F0`), Pearl (`#E6EAE6`), Sage (`#B9C9B8`), Mint Aqua (`#A9DED2`), Soft Coral (`#F2B7A5`), Soft Lime (`#D8E878`), Deep Ink (`#1E2925`).
- **Core Principle**: Advanced multi-agent technology underneath; clean, effortless shopping experience on top.

---

## 2. Target Users & Personas
1. **The Consumer**: Desires fast discovery, natural-language search ("lightweight laptop for coding under ₹70,000"), factual side-by-side product comparisons, one-click checkout, and instant status tracking without jargon.
2. **The Operations / Store Manager**: Needs internal monitoring of order orchestration stages, inventory confidence, payment simulation scenarios, delivery partner handoffs, and background job health.

---

## 3. Functional Requirements

### 3.1 Consumer Storefront (Level 1 & 2)
1. **Adaptive Navigation & Header**:
   - Clean, sticky header with STORE STING branding, category links, intelligent search bar, wishlist counter, live cart drawer trigger, and customer account menu.
   - Dedicated mobile navigation (Home, Discover, Cart, Orders, Profile).
2. **Intelligent Natural Language Search**:
   - Supports keyword queries and natural conversational prompts (budget, intent, category, attributes).
   - Generates visual match indicators (e.g., "94% match", "Great for coding", "Under your budget").
3. **Goal-Based Discovery & Curated Collections**:
   - Pre-curated collections: "For Students", "For Creators", "For Gamers", "For Your Workspace", "Travel Essentials", "Everyday Essentials".
   - Contextual discovery blocks: "Your picks", "Trending now", "New arrivals", "Because you viewed...".
4. **Product Detail Pages (PDP)**:
   - High-fidelity imagery, specs breakdown, "Why you'll like it", "Best for", real-time warehouse availability, customer reviews with verified purchase tags, and instant comparison trigger.
5. **Intelligent Product Comparison**:
   - Compare up to 4 items on price, performance, dimensions, battery, rating, and stock with factual summaries ("Best for battery life", "Lowest price").
6. **Cart & Setup Completion**:
   - Subtotal, discounts, shipping, dynamic "Complete your setup" recommendations.
7. **Streamlined 4-Step Checkout**:
   - Delivery Address -> Payment Method Selection (UPI, Card, Wallet, COD simulation) -> Review -> Instant Confirmation.
8. **Real-Time Order Tracking**:
   - Live SSE stream (`GET /api/orders/{id}/stream`) with stages: Confirmed -> Inventory Reserved -> Payment Authorized -> Packed -> Shipped -> Out for Delivery -> Delivered.
9. **Personal Space ("My Space")**:
   - Recently viewed items, saved collections, orders history, active shipments, and buy-again items.

### 3.2 Backend Commerce Engine & Operations (Level 3 & 4)
1. **Multi-Agent Orchestrator**:
   - `OrderAgent`: Verifies incoming order payload, calculates backend-authoritative pricing.
   - `InventoryAgent`: Checks stock confidence, reserves inventory with row locks.
   - `PaymentAgent`: Simulates payment authorization, evaluates fraud risk, supports retry policies.
   - `FulfillmentAgent`: Packs order items, generates warehouse manifest.
   - `DeliveryAgent`: Assigns carrier (FedEx, UPS, Drone Express), estimates delivery SLA.
2. **PostgreSQL Jobs Worker**:
   - Standalone background runner claiming tasks with `SELECT ... FOR UPDATE SKIP LOCKED`.
   - Zero Redis / Docker / Celery required.
3. **Scenario Engine**:
   - Deterministic test scenarios: `SUCCESS`, `LOW_STOCK`, `PAYMENT_RETRY`, `PAYMENT_FAILURE`, `FRAUD_REJECTION`, `DELIVERY_RETRY`, `DELIVERY_FAILURE`.
4. **Operations Monitoring Dashboard**:
   - Separate protected view displaying queue depth, worker health, active orders, agent transition logs, and system metrics.
