# Task 002: Database & Models Layer

This task covers configuring the SQLite database, declaring SQLAlchemy models, and creating migrations with Alembic.

---

## 1. Objectives
*   Configure SQLAlchemy session manager.
*   Implement ORM models matching the `data_model.md` design.
*   Configure Alembic and auto-generate the initial database schema migration.

---

## 2. Checklist

- [x] **1. SQLAlchemy Connection Config**:
    - [x] Write `backend/db/session.py` setting up SQLite `create_engine` with parameters `check_same_thread=False`.
    - [x] Declare base metadata class `Base` for ORM declarations.
    - [x] Write helper generator `get_db` yielding session connections for FastAPI dependency injections.
- [x] **2. Model Declarations (`backend/models/`)**:
    - [x] Write `backend/models/lesson.py` mapping `LessonORM` (id, title, created_at).
    - [x] Write `backend/models/audio.py` mapping `AudioFileORM` (id, lesson_id, filename, filepath, duration). Configure cascade delete.
    - [x] Write `backend/models/transcript.py` mapping `TranscriptORM` (id, lesson_id, raw_content, format).
    - [x] Write `backend/models/segment.py` mapping `SegmentORM` (id, lesson_id, index, start_time, end_time, duration, transcript, status, is_bookmarked). Add indexes.
    - [x] Write `backend/models/attempt.py` mapping `AttemptORM` (id, segment_id, typed_text, accuracy, replay_count, back_jump_count, typing_duration, created_at).
- [x] **3. Alembic Integration**:
    - [x] Run `alembic init alembic` within backend dir.
    - [x] Edit `alembic/env.py` importing database model metadata and pointing to local DB path dynamically from settings.
    - [x] Run `alembic revision --autogenerate -m "initial"` and confirm table schema.
    - [x] Run `alembic upgrade head` to construct tables.

---

## 3. Verification
*   Verify that `dictation.db` is successfully initialized on the mounted volume.
*   Assert table definitions using SQLite client: `.tables` returns `lessons`, `audio_files`, `transcripts`, `segments`, `attempts`.
