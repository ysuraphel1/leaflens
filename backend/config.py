import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

OPENAI_API_KEY: str = os.environ["OPENAI_API_KEY"]
OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://leaflens:leaflens@localhost:5432/leaflens",
)

UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", "/tmp/leaflens_uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
TOP_K_ALTERNATIVES: int = int(os.getenv("TOP_K_ALTERNATIVES", "5"))

USDA_ZONE_API_URL: str = "https://phzmapi.org/{lat},{lon}.json"
