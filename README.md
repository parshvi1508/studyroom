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
