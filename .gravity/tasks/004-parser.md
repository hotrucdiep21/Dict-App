# Task 004: Transcript Parsing and Segment Generation

This task covers parsing uploaded transcript files and slicing them into database-backed segments.

---

## 1. Objectives
*   Build a parser for SRT subtitle files.
*   Build parsing logic for TXT files (single-segment fallback) and JSON files.
*   Validate timestamps for format violations, overlaps, and empty segments.

---

## 2. Checklist

- [ ] **1. Parser Implementation (`backend/utils/parser.py`)**:
    - [ ] **SRT Parser**:
        *   Regex patterns to match index, timestamps (`HH:MM:SS,mmm --> HH:MM:SS,mmm`), and multi-line subtitles.
        *   Function converting time strings to floats.
        *   Clean HTML styles and strip extra blank lines.
    - [ ] **JSON Parser**:
        *   Parse JSON containing segment arrays. Validate keys: `start_time`, `end_time`, `transcript`.
    - [ ] **TXT Fallback**:
        *   Map the entire text to a single segment with bounds `[0.0, audio_duration]`.
- [ ] **2. Segment Generator Service**:
    - [ ] Validate segments: check for overlapping ranges, negative durations, or empty text.
    - [ ] Commit valid segment arrays directly into the database. Set initial state to `NOT_STARTED`.
- [ ] **3. Integration in Upload Controller**:
    - [ ] Chain transcript parser immediately after receiving the file upload.
    - [ ] If parsing fails, delete stored transcript, rollback, and return `422 Unprocessable Entity` with validation errors list.

---

## 3. Verification
*   Write unit tests mapping various SRT files (normal inputs, overlapping timestamps, missing text).
*   Upload a valid SRT file via API and check that `segments` table has populated rows with accurate floats.
