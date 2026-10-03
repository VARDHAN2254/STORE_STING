import re
from typing import Dict, Any
from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.database.models import Product
from app.schemas.schemas import ProductResponse

router = APIRouter(prefix="/search", tags=["search"])


def parse_natural_language_query(q: str) -> Dict[str, Any]:
    text = q.lower()
    criteria: Dict[str, Any] = {
        "keywords": [],
        "max_budget": None,
        "category_hints": [],
        "intent_tags": [],
    }

    # Extract budget e.g. "under 70000", "under ₹70,000", "below 50k", "< 80000"
    budget_match = re.search(r'(?:under|below|budget|less than|within|\<)\s*(?:₹|rs\.?|inr)?\s*([0-9,]+)\s*(k)?', text)
    if budget_match:
        val_str = budget_match.group(1).replace(",", "")
        try:
            val = float(val_str)
            if budget_match.group(2) == 'k':
                val *= 1000
            criteria["max_budget"] = Decimal(f"{val:.2f}")
        except Exception:
            pass

    # Category hints
    if any(w in text for w in ["laptop", "computer", "notebook", "pc", "macbook"]):
        criteria["category_hints"].append("computers")
    if any(w in text for w in ["phone", "mobile", "smartphone", "communicator"]):
        criteria["category_hints"].append("mobiles")
    if any(w in text for w in ["earbuds", "earphone", "audio", "headphone", "watch", "wearable"]):
        criteria["category_hints"].append("wearables")
    if any(w in text for w in ["desk", "keyboard", "lamp", "workspace", "monitor", "stand"]):
        criteria["category_hints"].append("workspace")
    if any(w in text for w in ["bag", "backpack", "travel", "carry"]):
        criteria["category_hints"].append("lifestyle")

    # Intent tags
    if any(w in text for w in ["code", "coding", "developer", "programming", "software"]):
        criteria["intent_tags"].append("coding")
    if any(w in text for w in ["student", "college", "school", "study"]):
        criteria["intent_tags"].append("students")
    if any(w in text for w in ["creative", "video", "photo", "creator", "design"]):
        criteria["intent_tags"].append("creators")
    if any(w in text for w in ["game", "gaming", "gamer"]):
        criteria["intent_tags"].append("gamers")
    if any(w in text for w in ["light", "lightweight", "portable", "travel"]):
        criteria["intent_tags"].append("lightweight")
    if any(w in text for w in ["silent", "quiet", "fanless"]):
        criteria["intent_tags"].append("silent")

    # Clean keywords
    cleaned_tokens = [w for w in re.findall(r'\b[a-zA-Z0-9]+\b', text) if len(w) > 2 and w not in [
        "the", "and", "for", "with", "under", "need", "want", "find", "looking", "best", "good", "cheap"
    ]]
    criteria["keywords"] = cleaned_tokens
    return criteria


@router.get("")
async def search_products(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db)
):
    criteria = parse_natural_language_query(q)

    query = select(Product).options(selectinload(Product.images))
    result = await db.execute(query)
    all_products = result.scalars().all()

    scored_results = []
    for prod in all_products:
        score = 50.0  # Base
        match_reasons = []

        prod_text = f"{prod.name} {prod.brand} {prod.description} {prod.best_for}".lower()

        # Keyword matching
        matched_kw = 0
        for kw in criteria["keywords"]:
            if kw in prod_text:
                matched_kw += 1
        if criteria["keywords"]:
            score += (matched_kw / len(criteria["keywords"])) * 25.0

        # Category match
        if criteria["category_hints"]:
            if any(hint in prod.category_id for hint in criteria["category_hints"]):
                score += 15.0
                match_reasons.append("Exact category match")

        # Budget match
        if criteria["max_budget"] is not None:
            if prod.discounted_price <= criteria["max_budget"]:
                score += 15.0
                diff = criteria["max_budget"] - prod.discounted_price
                match_reasons.append(f"Under your budget (Saves ₹{diff:,.0f})")
            else:
                score -= 20.0

        # Intent matching
        for intent in criteria["intent_tags"]:
            if intent in prod_text or (prod.goal_tags and intent in prod.goal_tags):
                score += 10.0
                if intent == "coding":
                    match_reasons.append("Great for coding & dev tools")
                elif intent == "lightweight":
                    match_reasons.append("Ultra-portable lightweight chassis")
                elif intent == "students":
                    match_reasons.append("Top pick for students")
                elif intent == "creators":
                    match_reasons.append("High color accuracy for creators")

        # Clamp score between 65% and 99% if relevant
        if matched_kw > 0 or criteria["category_hints"] or criteria["intent_tags"]:
            final_score = int(min(max(score, 68.0), 98.0))
            if not match_reasons:
                match_reasons.append("Relevant to search terms")

            scored_results.append({
                "product": ProductResponse.model_validate(prod),
                "match_percentage": final_score,
                "match_reasons": match_reasons,
            })

    # Sort by match percentage
    scored_results.sort(key=lambda r: r["match_percentage"], reverse=True)

    return {
        "query": q,
        "interpreted_criteria": {
            "max_budget": str(criteria["max_budget"]) if criteria["max_budget"] else None,
            "category_hints": criteria["category_hints"],
            "intent_tags": criteria["intent_tags"],
        },
        "results_count": len(scored_results),
        "results": scored_results,
    }
