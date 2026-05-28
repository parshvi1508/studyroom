#!/bin/bash
source /home/ubuntu/studyroom/backend/venv/bin/activate
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
