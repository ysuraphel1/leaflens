"""USDA Plant Hardiness Zone lookup via phzmapi.org."""

import httpx

from backend.config import USDA_ZONE_API_URL


async def get_hardiness_zone(lat: float, lon: float) -> str | None:
    """Return the USDA hardiness zone string for a lat/lon coordinate, or None on failure."""
    url = USDA_ZONE_API_URL.format(lat=round(lat, 4), lon=round(lon, 4))
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            # API returns {"zone": "7b", "temperature_range": "...", ...}
            return data.get("zone") or data.get("Zone")
    except Exception:
        return None
