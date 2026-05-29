# StudyRoom

A collaborative study room platform with realtime chat, server-authoritative session
tracking, and presence awareness.

Built as a technical assessment for Jaypee Brothers Medical Publishers.

## Tech Stack

- Backend: FastAPI (async), SQLAlchemy (async), asyncpg, Alembic
- Auth: JWT via python-jose, bcrypt via passlib
- Database: Supabase PostgreSQL
- Realtime: FastAPI native WebSockets
- Frontend: React, Vite, Tailwind CSS
- Deployment: Azure App Service (backend), Vercel (frontend)

## Live URLs

- Frontend: [add after deploy]
- Backend API: [add after deploy]
- API Docs: [backend-url]/docs

## Local Setup

### Prerequisites

- Python 3.11+
- Node 18+
- A Supabase project (free tier works)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in your Supabase connection string and JWT secret in .env

alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set VITE_API_URL and VITE_WS_URL in .env.local

npm run dev
```

## Architecture

### Backend Structure

```
backend/app/
  core/         settings, database engine, JWT utilities
  models/       SQLAlchemy ORM models
  schemas/      Pydantic request/response models and WS event models
  routes/       FastAPI route handlers (thin, delegate to services)
  services/     Business logic classes (RoomService, SessionService, UserService)
  ws/           ConnectionManager class and WebSocket endpoint
  main.py       App factory, router registration, CORS config
```

### Key Design Decisions

1. In-memory ConnectionManager with documented Redis upgrade path (see DECISIONS.md ADR-003)
2. Server-authoritative session timer via UTC start_time broadcast (see ADR-004)
3. All WebSocket messages typed as Pydantic models, never raw dicts (see ADR-007)
4. Service layer separates business logic from route handlers (see ADR-006)

## Features

- User registration and login with JWT auth
- Create study rooms with unique 6-character room codes
- Join rooms via room code
- Realtime presence: see who is in the room
- Realtime chat with message persistence
- Session timer: server-authoritative start/end with elapsed time broadcast
- Activity log per room
- User session history dashboard

## WebSocket Protocol

See WS_PROTOCOL.md for the full typed message contract.

## Environment Variables

See `.env.example` for all required variables and descriptions.

## Security Notes

- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens expire after 60 minutes
- WebSocket auth via query parameter (documented limitation, V2 mitigation described in DECISIONS.md ADR-005)
- CORS restricted to frontend origin in production
- No secrets committed. All config via environment variables.

## Behavior Notes

These are intentional design decisions, not bugs. Documented here to avoid confusion.

### Session auto-end on creator disconnect

When the room creator closes their tab or navigates away, any active session is automatically
ended by the backend (`session_service.end` is called in the WebSocket cleanup block). This
prevents orphaned sessions that would sit as `status = "active"` forever and become invisible
in dashboard aggregations.

### Session tracking is creator-scoped

The dashboard tracks study time for sessions **you started** (`started_by == user_id`). Other
users joining your room do not receive independent study time credit. The system has no concept
of per-participant session attribution -- only the creator who ran the session is credited.
This is a deliberate scope decision for v1 and is consistent with the assessment requirements.

### Chat and session are independent

Ending a session stops the study timer and writes `duration_seconds` to the DB. It does not
disconnect users or clear chat. After ending a session, participants remain in the room and
can continue chatting. This is intentional -- the session represents a focused study block;
the chat is persistent room infrastructure.

### How to verify dashboard study time

1. Create a room
2. Join it
3. Click **Start Session** (creator only)
4. Wait a minute
5. Click **End Session**
6. Navigate to Dashboard

The "Study Time" stat will reflect the session duration. Sessions abandoned without clicking
End Session are counted in `session_count` (any status) but contribute `0` to `total_study_seconds`
(ended-only sum), which is the correct behavior -- incomplete sessions are acknowledged but
not credited as study time.

