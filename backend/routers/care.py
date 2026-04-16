"""GET /care/{identification_id} — synthesize and return plant care instructions."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db import get_db
from backend.models import CareProfile, Identification
from backend.services.openai_service import get_care_instructions

router = APIRouter(prefix="/care", tags=["care"])


class SeasonalCare(BaseModel):
    spring: str | None = None
    summer: str | None = None
    autumn: str | None = None
    winter: str | None = None


class CareResponse(BaseModel):
    scientific_name: str
    common_name: str
    # Quick-reference fields (top of card)
    watering_frequency: str | None
    sunlight: str | None
    soil_type: str | None
    humidity: str | None
    temperature_range: str | None
    fertilizing: str | None
    # Extended sections — raw dicts forwarded from GPT
    light_requirements: dict | None = None
    watering_guide: dict | None = None
    soil_and_potting: dict | None = None
    feeding: dict | None = None
    pruning_and_maintenance: dict | None = None
    propagation: dict | None = None
    common_problems: list | None = None
    best_practices: list | None = None
    growth_info: dict | None = None
    environment: dict | None = None
    seasonal_care: SeasonalCare | None = None


@router.get("/{identification_id}", response_model=CareResponse)
async def get_care(
    identification_id: int,
    db: AsyncSession = Depends(get_db),
) -> CareResponse:
    # Load identification record
    result = await db.execute(
        select(Identification).where(Identification.id == identification_id)
    )
    ident = result.scalar_one_or_none()
    if ident is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Identification {identification_id} not found.",
        )

    # Check cache
    cached = await db.execute(
        select(CareProfile).where(CareProfile.scientific_name == ident.scientific_name)
    )
    profile = cached.scalar_one_or_none()

    if profile is None:
        # Synthesize via GPT-4
        try:
            data = await get_care_instructions(ident.scientific_name, ident.common_name)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Care synthesis failed: {exc}",
            )

        extended = {
            k: data.get(k)
            for k in (
                "light_requirements", "watering_guide", "soil_and_potting",
                "feeding", "pruning_and_maintenance", "propagation",
                "common_problems", "best_practices", "growth_info", "environment",
            )
        }

        profile = CareProfile(
            scientific_name=ident.scientific_name,
            watering_frequency=data.get("watering_frequency"),
            sunlight=data.get("sunlight"),
            soil_type=data.get("soil_type"),
            humidity=data.get("humidity"),
            temperature_range=data.get("temperature_range"),
            fertilizing=data.get("fertilizing"),
            additional_tips=None,
            seasonal_care=data.get("seasonal_care", {}),
            extended_care=extended,
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    seasonal = profile.seasonal_care or {}
    ext = profile.extended_care or {}

    return CareResponse(
        scientific_name=profile.scientific_name,
        common_name=ident.common_name,
        watering_frequency=profile.watering_frequency,
        sunlight=profile.sunlight,
        soil_type=profile.soil_type,
        humidity=profile.humidity,
        temperature_range=profile.temperature_range,
        fertilizing=profile.fertilizing,
        light_requirements=ext.get("light_requirements"),
        watering_guide=ext.get("watering_guide"),
        soil_and_potting=ext.get("soil_and_potting"),
        feeding=ext.get("feeding"),
        pruning_and_maintenance=ext.get("pruning_and_maintenance"),
        propagation=ext.get("propagation"),
        common_problems=ext.get("common_problems"),
        best_practices=ext.get("best_practices"),
        growth_info=ext.get("growth_info"),
        environment=ext.get("environment"),
        seasonal_care=SeasonalCare(**{k: seasonal.get(k) for k in SeasonalCare.model_fields}),
    )
