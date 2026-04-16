"""Journal endpoints — save notes and optional location for an identification."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db import get_db
from backend.models import Identification, JournalEntry
from backend.services.usda_service import get_hardiness_zone

router = APIRouter(prefix="/journal", tags=["journal"])


class JournalCreateRequest(BaseModel):
    identification_id: int
    notes: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class ReminderItem(BaseModel):
    type: str
    message: str
    next_due_date: str | None = None


class JournalResponse(BaseModel):
    id: int
    identification_id: int
    notes: str | None
    hardiness_zone: str | None
    latitude: float | None
    longitude: float | None
    reminders: list[ReminderItem]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class JournalUpdateRequest(BaseModel):
    notes: str | None = None


def _build_reminders(care_tips: dict | None) -> list[dict]:
    """Generate seasonal reminder stubs from care profile if available."""
    if not care_tips:
        return []
    reminders = []
    for season, tip in care_tips.items():
        if tip:
            reminders.append({"type": f"seasonal_{season}", "message": tip, "next_due_date": None})
    return reminders


@router.post("", response_model=JournalResponse, status_code=status.HTTP_201_CREATED)
async def create_journal_entry(
    body: JournalCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> JournalResponse:
    # Verify identification exists
    result = await db.execute(
        select(Identification).where(Identification.id == body.identification_id)
    )
    ident = result.scalar_one_or_none()
    if ident is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Identification {body.identification_id} not found.",
        )

    # Resolve hardiness zone if coordinates provided
    zone: str | None = None
    if body.latitude is not None and body.longitude is not None:
        zone = await get_hardiness_zone(body.latitude, body.longitude)

    entry = JournalEntry(
        identification_id=body.identification_id,
        notes=body.notes,
        hardiness_zone=zone,
        latitude=body.latitude,
        longitude=body.longitude,
        reminders=[],
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return _to_response(entry)


@router.get("/{entry_id}", response_model=JournalResponse)
async def get_journal_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
) -> JournalResponse:
    result = await db.execute(select(JournalEntry).where(JournalEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found.")
    return _to_response(entry)


@router.patch("/{entry_id}", response_model=JournalResponse)
async def update_journal_entry(
    entry_id: int,
    body: JournalUpdateRequest,
    db: AsyncSession = Depends(get_db),
) -> JournalResponse:
    result = await db.execute(select(JournalEntry).where(JournalEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found.")

    if body.notes is not None:
        entry.notes = body.notes

    await db.commit()
    await db.refresh(entry)
    return _to_response(entry)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_journal_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(JournalEntry).where(JournalEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found.")
    await db.delete(entry)
    await db.commit()


def _to_response(entry: JournalEntry) -> JournalResponse:
    return JournalResponse(
        id=entry.id,
        identification_id=entry.identification_id,
        notes=entry.notes,
        hardiness_zone=entry.hardiness_zone,
        latitude=entry.latitude,
        longitude=entry.longitude,
        reminders=[ReminderItem(**r) for r in (entry.reminders or [])],
        created_at=entry.created_at.isoformat(),
        updated_at=entry.updated_at.isoformat(),
    )
