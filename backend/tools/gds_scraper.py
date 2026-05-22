import datetime
import cloudscraper
from datetime import date
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

LOCATION_ID = "615f4f93a9f13a32678e5feb"


def resolve_date(date_str: str) -> str:
    if date_str == "today":
        return str(date.today())
    if date_str == "tomorrow":
        return str(date.today() + datetime.timedelta(days=1))
    return date_str


@router.get("/menu")
def get_menu(
    date_str: str = Query(default="today", alias="date"),
    meal: str = Query(..., description="breakfast, lunch, or dinner"),
):
    resolved_date = resolve_date(date_str)
    scraper = cloudscraper.create_scraper()

    # Fetch available periods for the day
    periods_url = (
        f"https://apiv4.dineoncampus.com/locations/{LOCATION_ID}/periods"
        f"?platform=0&date={resolved_date}"
    )

    try:
        response = scraper.get(periods_url)
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail=f"DineOnCampus error: {response.status_code}")
        data = response.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach DineOnCampus: {e}")

    # Match requested meal to a period ID
    period_id = None
    available = []
    for period in data.get("periods", []):
        available.append(period["name"])
        if period["name"].lower() == meal.lower():
            period_id = period["id"]
            break

    if not period_id:
        raise HTTPException(
            status_code=404,
            detail=f"'{meal}' not found for {resolved_date}. Available: {available}",
        )

    # Fetch the menu for that period
    menu_url = (
        f"https://apiv4.dineoncampus.com/locations/{LOCATION_ID}/menu"
        f"?date={resolved_date}&period={period_id}"
    )
    menu_response = scraper.get(menu_url)
    menu_data = menu_response.json()

    # Extract categories
    categories = menu_data.get("menu", {}).get("periods", {}).get("categories", [])
    if not categories:
        categories = menu_data.get("period", {}).get("categories", [])

    # Filter to The Daily Plate / Carved & Crafted (same logic as original script)
    results = []
    for category in categories:
        name = category["name"]
        if meal.lower() == "breakfast":
            if name == "The Daily Plate":
                results.append({
                    "category": name,
                    "items": [item["name"] for item in category["items"]],
                })
                break
        else:
            if name in ("The Daily Plate", "Carved & Crafted"):
                if name == "Carved & Crafted" and len(category["items"]) == 0:
                    break
                results.append({
                    "category": name,
                    "items": [item["name"] for item in category["items"]],
                })

    return {
        "date": resolved_date,
        "meal": meal,
        "menu": results,
    }
