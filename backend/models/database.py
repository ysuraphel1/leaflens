from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Identification(Base):
    __tablename__ = "identifications"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    image_filename = Column(String(512), nullable=False)

    # Taxonomy
    common_name = Column(String(256), nullable=False)
    scientific_name = Column(String(256), nullable=False)
    family = Column(String(128), nullable=True)
    genus = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)

    # Classification metrics
    confidence = Column(Float, nullable=False)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1 = Column(Float, nullable=True)

    # Top-N alternatives stored as JSONB list
    # [{"common_name": ..., "scientific_name": ..., "confidence": ...}]
    alternatives = Column(JSONB, nullable=True, default=list)

    # Disease / pest findings
    # [{"name": ..., "description": ..., "severity": ...}]
    diseases = Column(JSONB, nullable=True, default=list)

    # Toxicity flags and severity levels (none / mild / moderate / severe)
    toxic_to_pets = Column(Boolean, nullable=True)
    toxic_to_children = Column(Boolean, nullable=True)
    toxicity_severity_pets = Column(String(16), nullable=True, default="none")
    toxicity_severity_children = Column(String(16), nullable=True, default="none")
    toxicity_details = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    journal_entries = relationship(
        "JournalEntry", back_populates="identification", cascade="all, delete-orphan"
    )


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    identification_id = Column(
        BigInteger,
        ForeignKey("identifications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    notes = Column(Text, nullable=True)
    hardiness_zone = Column(String(16), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Care reminders — JSONB list of {type, message, next_due_date}
    reminders = Column(JSONB, nullable=True, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    identification = relationship("Identification", back_populates="journal_entries")


class CareProfile(Base):
    __tablename__ = "care_profiles"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    scientific_name = Column(String(256), nullable=False, unique=True, index=True)

    watering_frequency = Column(String(256), nullable=True)
    sunlight = Column(String(256), nullable=True)
    soil_type = Column(String(256), nullable=True)
    humidity = Column(String(256), nullable=True)
    temperature_range = Column(String(256), nullable=True)
    fertilizing = Column(String(256), nullable=True)
    additional_tips = Column(Text, nullable=True)

    # Seasonal care keyed by season name
    seasonal_care = Column(JSONB, nullable=True, default=dict)

    # All extended care sections returned by the expanded GPT prompt
    extended_care = Column(JSONB, nullable=True, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
