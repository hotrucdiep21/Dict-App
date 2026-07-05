# Database Schema Design (SQLite)

This document details the database schema layout, tables, relationships, column types, indexes, and cascades for SQLite.

---

## 1. Entity Relationship Diagram

```text
  +------------------+             +--------------------+
  |     lessons      | <---------> |    audio_files     |
  |------------------|             |--------------------|
  | id (PK)          |             | id (PK)            |
  | title            |             | lesson_id (FK)     |
  | created_at       |             | filename           |
  +------------------+             | filepath           |
           ^                       | duration           |
           |                       +--------------------+
           |                       
           |                       +--------------------+
           +---------------------> |    transcripts     |
           |                       |--------------------|
           |                       | id (PK)            |
           |                       | lesson_id (FK)     |
           |                       | raw_content        |
           |                       +--------------------+
           |
           v
  +------------------+
  |     segments     |
  |------------------|
  | id (PK)          |
  | lesson_id (FK)   |
  | index            |
  | start_time       |
  | end_time         |
  | duration         |
  | transcript       |
  | status           |
  | is_bookmarked    |
  +------------------+
           |
           v
  +------------------+
  |     attempts     |
  |------------------|
  | id (PK)          |
  | segment_id (FK)  |
  | typed_text       |
  | accuracy         |
  | replay_count     |
  | back_jump_count  |
  | typing_duration  |
  | created_at       |
  +------------------+
```

---

## 2. Table Specifications

### 2.1 Table: `lessons`
Stores the metadata for a dictation practice course/lesson.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `title` | VARCHAR(255) | NOT NULL | Title of the lesson |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### 2.2 Table: `audio_files`
Stores file attributes of the uploaded sound files.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `lesson_id` | INTEGER | FOREIGN KEY, UNIQUE, NOT NULL | Refers to `lessons(id)` (ON DELETE CASCADE) |
| `filename` | VARCHAR(255) | NOT NULL | Original filename |
| `filepath` | VARCHAR(512) | NOT NULL | Location on the mounted storage volume |
| `duration` | FLOAT | NOT NULL | Playback duration in seconds |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Upload timestamp |

### 2.3 Table: `transcripts`
Stores raw transcription content before parse-segment processing.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `lesson_id` | INTEGER | FOREIGN KEY, UNIQUE, NOT NULL | Refers to `lessons(id)` (ON DELETE CASCADE) |
| `raw_content` | TEXT | NOT NULL | Unparsed string (SRT, JSON, or TXT text) |
| `format` | VARCHAR(10) | NOT NULL | Type of file (`srt`, `txt`, `json`) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### 2.4 Table: `segments`
Stores discrete sentences/phrases extracted from the transcripts.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `lesson_id` | INTEGER | FOREIGN KEY, NOT NULL | Refers to `lessons(id)` (ON DELETE CASCADE) |
| `index` | INTEGER | NOT NULL | Sequential line number inside the lesson (1-based) |
| `start_time` | FLOAT | NOT NULL | Start of phrase in seconds |
| `end_time` | FLOAT | NOT NULL | End of phrase in seconds |
| `duration` | FLOAT | NOT NULL | Duration of the segment in seconds |
| `transcript` | TEXT | NOT NULL | Correct text string |
| `status` | VARCHAR(20) | NOT NULL | States: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `NEEDS_REVIEW` |
| `is_bookmarked` | BOOLEAN | DEFAULT FALSE | Bookmark flag for later reviews |

*   **Unique Index**: `uq_lesson_segment_index` on `(lesson_id, index)`.

### 2.5 Table: `attempts`
Stores immutable typing history entries for each segment.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier |
| `segment_id` | INTEGER | FOREIGN KEY, NOT NULL | Refers to `segments(id)` (ON DELETE CASCADE) |
| `typed_text` | TEXT | NOT NULL | Text typed by the user |
| `accuracy` | FLOAT | NOT NULL | Scoring metric (0.0 to 100.0) |
| `replay_count` | INTEGER | DEFAULT 0 | Times audio was replayed during this attempt |
| `back_jump_count` | INTEGER | DEFAULT 0 | Times rewind was triggered during this attempt |
| `typing_duration` | INTEGER | NOT NULL | Active time spent typing in seconds |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Typing completion timestamp |

---

## 3. Database Indexes and Optimization

To ensure response latency remains under 100ms even with large data sizes:
1.  **Index: `idx_segment_lesson_id`**: Added to `segments(lesson_id)` to speed up loading segment lists.
2.  **Index: `idx_attempt_segment_id`**: Added to `attempts(segment_id)` to optimize loading attempt history.
3.  **Index: `idx_segment_status`**: Added to `segments(status)` to quickly retrieve review queues.
