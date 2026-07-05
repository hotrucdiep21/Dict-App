# API Contract Specification

This document details the REST API specifications, JSON schema validation, HTTP methods, and payload structures for interaction between frontend (React) and backend (FastAPI).

---

## 1. Global Prefix and Errors
All API endpoints are prefixed with `/api/v1`.

### 1.1 Error Response JSON Schema
When an error occurs, the API returns a structured JSON payload:
```json
{
  "error": {
    "code": "LESSON_NOT_FOUND",
    "message": "Lesson with ID 5 was not found.",
    "details": {}
  }
}
```

---

## 2. Endpoint Definitions

### 2.1 Lesson Management

#### `POST /api/v1/lessons` (Create Lesson)
*   **Request Body**:
    ```json
    {
      "title": "Lesson 1: Introduction to Clean Code"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "id": 1,
      "title": "Lesson 1: Introduction to Clean Code",
      "created_at": "2026-07-05T04:30:50Z"
    }
    ```

#### `GET /api/v1/lessons` (List Lessons)
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": 1,
        "title": "Lesson 1: Introduction to Clean Code",
        "created_at": "2026-07-05T04:30:50Z",
        "stats": {
          "total_segments": 15,
          "completed_segments": 8,
          "needs_review_segments": 2,
          "average_accuracy": 94.2
        }
      }
    ]
    ```

#### `GET /api/v1/lessons/{id}` (Get Lesson Details)
*   **Response (200 OK)**:
    ```json
    {
      "id": 1,
      "title": "Lesson 1: Introduction to Clean Code",
      "created_at": "2026-07-05T04:30:50Z",
      "audio_file": {
        "filename": "clean_code.mp3",
        "duration": 342.12
      },
      "transcript_file": {
        "filename": "clean_code.srt",
        "format": "srt"
      }
    }
    ```

#### `DELETE /api/v1/lessons/{id}` (Delete Lesson)
*   **Response (200 OK)**:
    ```json
    {
      "message": "Lesson deleted successfully"
    }
    ```

---

### 2.2 Media Uploads

#### `POST /api/v1/lessons/{id}/audio` (Upload Audio File)
*   **Request Content-Type**: `multipart/form-data`
*   **Payload**: Form key `file` containing `.mp3`, `.wav`, or `.m4a` file.
*   **Response (200 OK)**:
    ```json
    {
      "lesson_id": 1,
      "filename": "clean_code.mp3",
      "duration": 342.12,
      "status": "ready"
    }
    ```

#### `POST /api/v1/lessons/{id}/transcript` (Upload Transcript File)
*   **Request Content-Type**: `multipart/form-data`
*   **Payload**: Form key `file` containing `.srt`, `.txt`, or `.json` file.
*   **Response (200 OK)**:
    ```json
    {
      "lesson_id": 1,
      "filename": "clean_code.srt",
      "format": "srt",
      "segments_created": 15
    }
    ```

---

### 2.3 Segment Practicing

#### `GET /api/v1/lessons/{id}/segments` (List Lesson Segments)
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": 12,
        "index": 1,
        "start_time": 0.0,
        "end_time": 12.35,
        "duration": 12.35,
        "status": "COMPLETED",
        "is_bookmarked": false,
        "best_accuracy": 98.5
      }
    ]
    ```

#### `GET /api/v1/segments/{id}` (Get Segment Details)
*   **Response (200 OK)**:
    ```json
    {
      "id": 12,
      "lesson_id": 1,
      "index": 1,
      "start_time": 0.0,
      "end_time": 12.35,
      "duration": 12.35,
      "transcript": "Hello and welcome to building clean code applications.",
      "status": "COMPLETED",
      "is_bookmarked": false,
      "attempts": [
        {
          "id": 45,
          "accuracy": 98.5,
          "replay_count": 2,
          "back_jump_count": 1,
          "typing_duration": 45,
          "created_at": "2026-07-05T04:35:10Z"
        }
      ]
    }
    ```

#### `POST /api/v1/segments/{id}/check` (Submit Typing Attempt)
*   **Request Body**:
    ```json
    {
      "typed_text": "Hello and welcome to clean code applications.",
      "replay_count": 3,
      "back_jump_count": 2,
      "typing_duration": 52
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "attempt_id": 46,
      "accuracy": 91.2,
      "status": "COMPLETED",
      "diff": [
        {"word": "hello", "type": "correct"},
        {"word": "and", "type": "correct"},
        {"word": "welcome", "type": "correct"},
        {"word": "to", "type": "correct"},
        {"word": "building", "type": "missing"},
        {"word": "clean", "type": "correct"},
        {"word": "code", "type": "correct"},
        {"word": "applications", "type": "correct"}
      ]
    }
    ```

#### `POST /api/v1/segments/{id}/bookmark` (Toggle Segment Bookmark)
*   **Response (200 OK)**:
    ```json
    {
      "segment_id": 12,
      "is_bookmarked": true
    }
    ```

---

### 2.4 Analytics & Export

#### `GET /api/v1/stats` (Get Dashboard Statistics)
*   **Response (200 OK)**:
    ```json
    {
      "overall_accuracy": 92.4,
      "total_listening_time": 3600,
      "total_replay_count": 124,
      "total_back_jump_count": 78,
      "average_attempts_per_segment": 2.4,
      "completion_progress": 72.5,
      "hardest_segments": [
        {
          "lesson_title": "Lesson 1: Introduction to Clean Code",
          "segment_index": 4,
          "best_accuracy": 68.2,
          "attempts_count": 5
        }
      ],
      "missed_words": [
        {"word": "architecture", "miss_count": 14},
        {"word": "dependency", "miss_count": 9}
      ]
    }
    ```

#### `GET /api/v1/stats/export?format={csv|json}` (Export History)
*   **Response**: Triggers download of a CSV or JSON file containing detailed attempt history log fields.
