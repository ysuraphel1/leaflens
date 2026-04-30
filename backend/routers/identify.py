"""POST /identify — upload a plant image and get species identification."""

import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image, ImageOps
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import MAX_UPLOAD_SIZE_MB, UPLOAD_DIR
from backend.db import get_db
from backend.models import Identification
from backend.services.openai_service import identify_plant

router = APIRouter(prefix="/identify", tags=["identify"])

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/bmp"}


class AlternativeSpecies(BaseModel):
    common_name: str
    scientific_name: str
    confidence: float


class DiseaseResult(BaseModel):
    name: str
    description: str
    severity: str


class IdentificationResponse(BaseModel):
    id: int
    image_filename: str
    common_name: str
    scientific_name: str
    family: str | None
    genus: str | None
    description: str | None
    confidence: float
    precision: float
    recall: float
    f1: float
    alternatives: list[AlternativeSpecies]
    diseases: list[DiseaseResult]
    toxic_to_pets: bool | None
    toxic_to_children: bool | None
    toxicity_severity_pets: str | None
    toxicity_severity_children: str | None
    toxicity_details: str | None

    class Config:
        from_attributes = True


@router.post("", response_model=IdentificationResponse, status_code=status.HTTP_201_CREATED)
async def identify(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> IdentificationResponse:
    # Validate MIME type
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {file.content_type}. Allowed: {ALLOWED_MIME}",
        )

    # Save upload to disk
    ext = Path(file.filename or "upload.jpg").suffix or ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / unique_name

    size = 0
    max_bytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    with dest.open("wb") as out:
        while chunk := await file.read(1024 * 256):
            size += len(chunk)
            if size > max_bytes:
                dest.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds {MAX_UPLOAD_SIZE_MB} MB limit.",
                )
            out.write(chunk)

    # Rewrite the file with EXIF orientation baked into the pixels so every
    # downstream consumer (jsPDF, older browsers) sees upright pixel data.
    try:
        with Image.open(dest) as im:
            corrected = ImageOps.exif_transpose(im)
            corrected.save(dest)
    except Exception:
        pass

    # Call OpenAI Vision
    try:
        data = await identify_plant(dest)
    except Exception as exc:
        dest.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Plant identification failed: {exc}",
        )

    # Persist to database
    record = Identification(
        image_filename=unique_name,
        common_name=data.get("common_name", "Unknown"),
        scientific_name=data.get("scientific_name", "Unknown"),
        family=data.get("family"),
        genus=data.get("genus"),
        description=data.get("description"),
        confidence=data.get("confidence", 0.0),
        precision=data.get("precision", 0.0),
        recall=data.get("recall", 0.0),
        f1=data.get("f1", 0.0),
        alternatives=data.get("alternatives", []),
        diseases=data.get("diseases", []),
        toxic_to_pets=data.get("toxic_to_pets"),
        toxic_to_children=data.get("toxic_to_children"),
        toxicity_severity_pets=data.get("toxicity_severity_pets", "none"),
        toxicity_severity_children=data.get("toxicity_severity_children", "none"),
        toxicity_details=data.get("toxicity_details"),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    return IdentificationResponse(
        id=record.id,
        image_filename=record.image_filename,
        common_name=record.common_name,
        scientific_name=record.scientific_name,
        family=record.family,
        genus=record.genus,
        description=record.description,
        confidence=record.confidence,
        precision=record.precision,
        recall=record.recall,
        f1=record.f1,
        alternatives=[AlternativeSpecies(**a) for a in (record.alternatives or [])],
        diseases=[DiseaseResult(**d) for d in (record.diseases or [])],
        toxic_to_pets=record.toxic_to_pets,
        toxic_to_children=record.toxic_to_children,
        toxicity_severity_pets=record.toxicity_severity_pets,
        toxicity_severity_children=record.toxicity_severity_children,
        toxicity_details=record.toxicity_details,
    )
