"""GET /history — paginated list of past plant identifications."""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db import get_db
from backend.models import Identification, JournalEntry

router = APIRouter(prefix="/history", tags=["history"])


class HistoryItem(BaseModel):
    id: int
    image_filename: str
    common_name: str
    scientific_name: str
    confidence: float
    created_at: str


class HistoryResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[HistoryItem]


@router.get("", response_model=HistoryResponse)
async def list_history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> HistoryResponse:
    offset = (page - 1) * page_size

    # Only surface identifications that have been saved to the journal
    journaled = (
        select(JournalEntry.identification_id)
        .distinct()
        .scalar_subquery()
    )

    total_result = await db.execute(
        select(func.count()).select_from(Identification).where(Identification.id.in_(journaled))
    )
    total = total_result.scalar_one()

    items_result = await db.execute(
        select(Identification)
        .where(Identification.id.in_(journaled))
        .order_by(Identification.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    records = items_result.scalars().all()

    return HistoryResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[
            HistoryItem(
                id=r.id,
                image_filename=r.image_filename,
                common_name=r.common_name,
                scientific_name=r.scientific_name,
                confidence=r.confidence,
                created_at=r.created_at.isoformat(),
            )
            for r in records
        ],
    )


@router.get("/{identification_id}")
async def get_identification(
    identification_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict:
    from fastapi import HTTPException, status
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Identification)
        .options(selectinload(Identification.journal_entries))
        .where(Identification.id == identification_id)
    )
    ident = result.scalar_one_or_none()
    if ident is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Identification not found.")

    return {
        "id": ident.id,
        "image_filename": ident.image_filename,
        "common_name": ident.common_name,
        "scientific_name": ident.scientific_name,
        "family": ident.family,
        "genus": ident.genus,
        "description": ident.description,
        "confidence": ident.confidence,
        "precision": ident.precision,
        "recall": ident.recall,
        "f1": ident.f1,
        "alternatives": ident.alternatives,
        "diseases": ident.diseases,
        "toxic_to_pets": ident.toxic_to_pets,
        "toxic_to_children": ident.toxic_to_children,
        "toxicity_details": ident.toxicity_details,
        "created_at": ident.created_at.isoformat(),
        "journal_entries": [
            {
                "id": j.id,
                "notes": j.notes,
                "hardiness_zone": j.hardiness_zone,
                "created_at": j.created_at.isoformat(),
            }
            for j in ident.journal_entries
        ],
    }
