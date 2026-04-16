# LeafLens

A full-stack plant identification web app powered by GPT-4o Vision.

Upload a photo of any plant to get:
- Species identification (common name, scientific name, family, genus)
- Classification metrics (confidence, precision, recall, F1)
- Disease and pest detection
- Toxicity warnings for pets and children
- AI-synthesized care instructions (watering, sunlight, soil, humidity, temperature, fertilizing)
- Seasonal care reminders
- USDA hardiness zone detection from your location
- A plant journal to save notes and past identifications

---

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python 3.12) |
| Frontend | React 18 + Vite |
| Database | PostgreSQL 16 (SQLAlchemy async) |
| AI | OpenAI GPT-4o Vision |
| Hardiness Zone | USDA via phzmapi.org |

---

## Quick Start (local dev)

### Prerequisites

- Python 3.12+
- Node 20+
- PostgreSQL 16 running locally (or use Docker Compose)
- An OpenAI API key

### 1. Clone and configure

```bash
git clone https://github.com/ysuraphel1/leaflens.git
cd leaflens
cp .env.example .env
# Edit .env and set OPENAI_API_KEY
```

### 2. Start PostgreSQL (easiest via Docker)

```bash
docker compose up db -d
```

Or point `DATABASE_URL` in `.env` at an existing PostgreSQL instance.

### 3. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run the API server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

Tables are created automatically on first startup.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app is now at `http://localhost:5173`.

---

## Docker Compose (full stack)

```bash
cp .env.example .env
# Set OPENAI_API_KEY in .env

docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## API Reference

### `POST /identify`

Upload a plant image and receive species identification.

**Request:** `multipart/form-data` with field `file` (JPEG, PNG, WebP, BMP — max 10 MB)

**Response:**
```json
{
  "id": 42,
  "common_name": "Monstera",
  "scientific_name": "Monstera deliciosa",
  "family": "Araceae",
  "genus": "Monstera",
  "description": "Iconic tropical houseplant with distinctive split leaves.",
  "confidence": 0.94,
  "precision": 0.91,
  "recall": 0.88,
  "f1": 0.895,
  "alternatives": [
    {"common_name": "Philodendron", "scientific_name": "Philodendron hederaceum", "confidence": 0.04}
  ],
  "diseases": [],
  "toxic_to_pets": true,
  "toxic_to_children": true,
  "toxicity_details": "Contains calcium oxalate crystals; causes oral irritation."
}
```

### `GET /care/{identification_id}`

Synthesize care instructions for an identified plant. Results are cached in the database.

### `POST /journal`

Save a journal entry for an identification with optional notes and GPS coordinates.

**Body:**
```json
{
  "identification_id": 42,
  "notes": "Found this in my backyard",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### `PATCH /journal/{id}`

Update journal entry notes.

### `DELETE /journal/{id}`

Delete a journal entry.

### `GET /history?page=1&page_size=20`

Paginated list of past identifications.

### `GET /history/{id}`

Full detail for one identification including journal entries.

---

## Project Structure

```
leaflens/
├── backend/
│   ├── main.py               # FastAPI app, CORS, lifespan
│   ├── config.py             # Settings from environment
│   ├── db.py                 # Async SQLAlchemy engine + session
│   ├── models/
│   │   └── database.py       # Identification, JournalEntry, CareProfile
│   ├── routers/
│   │   ├── identify.py       # POST /identify
│   │   ├── care.py           # GET /care/{id}
│   │   ├── journal.py        # CRUD /journal
│   │   └── history.py        # GET /history
│   ├── services/
│   │   ├── openai_service.py # GPT-4o Vision + care synthesis
│   │   └── usda_service.py   # USDA hardiness zone lookup
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api.js            # Axios API client
│   │   ├── App.jsx           # Router + nav
│   │   ├── index.css         # Design system
│   │   └── components/
│   │       ├── UploadView.jsx
│   │       ├── ResultsView.jsx
│   │       └── JournalPage.jsx
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Migrated From

This project was transformed from the [Animal Image Classifier](animal-image-classifier-main/) (PyTorch ResNet-18 + Streamlit).

**Reused:**
- Project layout concept (src/ utilities pattern)
- Metrics format (precision, recall, F1 per-class reporting)

**Replaced:**
- Streamlit → React + Vite SPA
- PyTorch ResNet-18 local model → OpenAI GPT-4o Vision API
- Flask/Streamlit → FastAPI with async endpoints
- No persistence → PostgreSQL with SQLAlchemy ORM

---

## License

MIT
