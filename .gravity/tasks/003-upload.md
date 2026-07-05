# Task 003: Lesson Creation and Media Storage

This task covers creating lessons and storing uploaded audio and transcript files on disk.

---

## 1. Objectives
*   Build APIs to create lessons and upload files.
*   Validate file extensions (MP3/WAV/M4A for audio, SRT/TXT/JSON for transcripts).
*   Save files securely in structured local directories.

---

## 2. Checklist

- [x] **1. Setup File Directories**:
    - [x] Configure upload folders on startup: `uploads/audio/` and `uploads/transcripts/`.
- [x] **2. Repositories & Services Implementation**:
    - [x] Create `LessonRepository` implementing creation, fetch, and deletion logic.
    - [x] Write `LessonService` coordinate:
        *   `create_lesson(title: str)`
        *   `save_audio(lesson_id: int, file_name: str, file_data: bytes)`
        *   `save_transcript(lesson_id: int, file_name: str, file_data: bytes, format: str)`
- [x] **3. FastAPI Controllers (`backend/api/`)**:
    - [x] Implement `POST /api/v1/lessons` accepting title validation.
    - [x] Implement `POST /api/v1/lessons/{id}/audio` using FastAPI `UploadFile`. Check extensions. Compute/mock audio duration.
    - [x] Implement `POST /api/v1/lessons/{id}/transcript` accepting SRT/TXT/JSON files.
    - [x] Implement `DELETE /api/v1/lessons/{id}` returning confirmation. Assert file deletion from physical storage.

---

## 3. Verification
*   Send a `POST` request to upload a non-supported extension (e.g. `.png`) and assert it returns `400 Bad Request`.
*   Upload a valid `.mp3` file and verify it is written to the `uploads/audio/` directory under correct lesson folders.
