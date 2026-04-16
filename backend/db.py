from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.config import DATABASE_URL
from backend.models import Base

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def init_db() -> None:
    """Create all tables and apply any additive column migrations."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Additive migrations — safe to run repeatedly (IF NOT EXISTS).
        migrations = [
            "ALTER TABLE identifications ADD COLUMN IF NOT EXISTS toxicity_severity_pets VARCHAR(16) DEFAULT 'none'",
            "ALTER TABLE identifications ADD COLUMN IF NOT EXISTS toxicity_severity_children VARCHAR(16) DEFAULT 'none'",
            "ALTER TABLE care_profiles ADD COLUMN IF NOT EXISTS extended_care JSONB",
        ]
        for sql in migrations:
            await conn.execute(__import__("sqlalchemy").text(sql))


async def get_db() -> AsyncSession:  # type: ignore[return]
    """FastAPI dependency: yields a database session."""
    async with AsyncSessionLocal() as session:
        yield session
