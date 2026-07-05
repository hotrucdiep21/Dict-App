# Task 001: Project Initialization

This task covers the setup of the development environments, project directories, Docker containerization, and basic workspace configs.

---

## 1. Objectives
*   Initialize backend structure with FastAPI and configuration management.
*   Initialize frontend structure with React, Vite, and TypeScript.
*   Set up Dockerfiles and `docker-compose.yml` for unified development orchestration.

---

## 2. Directory Layout Setup
Create the structural folders:
```text
project-root/
├── backend/
│   ├── api/
│   ├── config/
│   ├── models/
│   ├── repositories/
│   ├── schemas/
│   ├── services/
│   ├── utils/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── views/
│   │   └── main.tsx
├── docker/
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
└── docker-compose.yml
```

---

## 3. Checklist

- [x] **1. Docker Configuration**:
    - [x] Create `docker/backend.Dockerfile` matching Python 3.12-slim. Mount volume for DB and uploads.
    - [x] Create `docker/frontend.Dockerfile` hosting Vite dev server in hot-reload mode.
    - [x] Create root `docker-compose.yml` defining services (`backend`, `frontend`), ports (8000, 5173), and network bridges.
- [x] **2. FastAPI Project Setup**:
    - [x] Create `backend/requirements.txt` listing `fastapi`, `uvicorn`, `pydantic-settings`, `sqlalchemy`, `alembic`, `pytest`.
    - [x] Create `backend/config/settings.py` implementing Pydantic BaseSettings to read environment properties (`DATABASE_URL`, `UPLOAD_DIR`, `ALLOWED_HOSTS`).
    - [x] Create `backend/main.py` containing CORS middlewares, routers routing, and base health check endpoint `/health`.
- [x] **3. React Project Setup**:
    - [x] Run `npm init vite` to instantiate React + TS + Tailwind in `frontend/`.
    - [x] Set up `postcss.config.js` and `tailwind.config.js` with standard color styling guidelines.
    - [x] Install dev dependencies: `tailwindcss`, `postcss`, `autoprefixer`, `@tanstack/react-query`, `zustand`, `react-router-dom`, `lucide-react`.

---

## 4. Verification
*   Run `docker compose up --build`.
*   Verify health endpoint via `curl http://localhost:8000/health` returns `{"status": "ok"}`.
*   Verify React SPA loads correctly at `http://localhost:5173`.
