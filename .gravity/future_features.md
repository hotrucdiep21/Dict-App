# Product Roadmap & Future Features

This document outlines the design considerations and roadmap for features planned for Version 2 and beyond, ensuring our Clean Architecture layers can support them without major rewrites.

---

## 1. Planned Enhancements

### 1.1 Whisper-based Transcript Alignment
*   **Goal**: Automatically segment raw audio when only a plain `.txt` transcript file is uploaded.
*   **Architectural Integration**:
    *   Add a `TranscriptAlignerPort` under the Service/Use Case layer.
    *   Create a `WhisperTimestampAdapter` in the Adapter layer that calls a local `faster-whisper` model or Whisper API to get word-level timestamps.
    *   Since the core Domain model of `Segment` already holds `start_time` and `end_time`, no changes will be needed in database tables or the frontend.

### 1.2 AI-generated Explanations for Mistakes
*   **Goal**: Provide context-aware feedback (e.g., explaining liaison, linking sounds, silent letters, or grammatical errors) when a user misspells or misses a word.
*   **Architectural Integration**:
    *   Add an `AIEnginePort` with a method `explain_errors(original: str, typed: str) -> str`.
    *   The `check` answer service will call this port in the background and return explanations in the endpoint response.

### 1.3 Spaced Repetition (SRS) for Weak Segments
*   **Goal**: Schedule reviews of bookmarked or low-accuracy segments using an algorithm (like SuperMemo-2).
*   **Architectural Integration**:
    *   Add scheduling columns to the `segments` table (`ease_factor`, `interval_days`, `next_review_date`).
    *   Add a new view `ReviewSession` in the frontend which filters segments where `next_review_date <= today`.

### 1.4 Voice Recording & Pronunciation Scoring (Shadowing Mode)
*   **Goal**: Let users record their own voice reading the segment transcript, align their voice audio, and calculate pronunciation accuracy.
*   **Architectural Integration**:
    *   Utilize standard browser WebRTC and MediaRecorder APIs to stream/upload user audio chunks.
    *   Implement an endpoint `POST /api/v1/segments/{id}/shadow` returning phoneme-level matching diffs.
