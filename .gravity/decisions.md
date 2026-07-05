# Architectural Decision Records (ADR)

This document records the architectural and technology design decisions made for the Dictation Practice project.

---

## ADR-001: Backend Tech Stack (FastAPI, Python 3.12+, SQLite)

### Context
We need a robust, fast backend that is easy to write, supports strong typing, and integrates with machine learning / text processing packages (like diff and alignment engines) in the future.

### Decision
Use **FastAPI** with **Python 3.12+**, **SQLAlchemy 2.x**, and **SQLite** as the database.

### Consequences
*   **Pros**:
    *   FastAPI is highly performant and uses Pydantic v2 for automatic request/response schema validation.
    *   SQLite is serverless, requires zero configuration, and operates directly as a single local file, which fits the single-user local scope perfectly.
    *   Python has mature NLP and audio parsing libraries (`difflib`, `pydub`, `faster-whisper`), paving the way for seamless future features.
*   **Cons**:
    *   SQLite has write locking, but for a personal single-user app, concurrency issues are non-existent.

---

## ADR-002: Difference Matching & Typo Classification

### Context
When checking the typed transcript against the original text, users need high-precision diff feedback. We need to distinguish between missing words, extra words, completely wrong words, and simple spelling mistakes (typos).

### Decision
Use Python's standard `difflib.SequenceMatcher` to generate word token sequence alignments, combined with **Levenshtein Distance** to identify typos.

### Consequences
*   **Algorithm details**:
    *   Tokenize and normalize original vs user input (lowercase, strip punctuation).
    *   Align tokens.
    *   If a mismatch occurs, calculate the Levenshtein distance between the original token and the user's typed token.
    *   If $\text{Distance} \le 2$ (and word length $> 3$), classify as a `Typo` and award 50% score credit. Otherwise, count as `Incorrect`.
*   **Pros**: Runs entirely on the backend in under 20ms, ensuring response latency remains well below the 100ms threshold.

---

## ADR-003: Frontend State Division (React Query vs Zustand)

### Context
We need to manage both asynchronous backend data (lessons, analytics, details) and fast-changing frontend client state (audio playing controls, shortcuts, active segment state).

### Decision
Use **React Query (TanStack Query)** for all server-state mutations and queries, and **Zustand** for local client state.

### Consequences
*   **React Query**: Caches lessons, stats, and segments. Invalidates cache automatically when attempts are posted, ensuring the dashboard metrics update instantly.
*   **Zustand**: Manages the `<audio>` element control state (current progress, duration, speed, loop toggle, and global keybind hooks). This prevents unnecessary component re-renders that would occur with React context.

---

## ADR-004: Audio Lifecycle Management in Listening Engine

### Context
Reloading media files on every segment change introduces noticeable latency (500ms to 1.5s depending on the browser/connection), violating the sub-100ms segment switching requirement.

### Decision
Load the lesson audio file into a single HTML5 `<audio>` element once. When a user switches segments, change the `currentTime` pointer of this single element to `segment.start_time` instead of reloading the file.

### Consequences
*   **Pros**:
    *   Segment switching takes less than 50ms.
    *   Zero duplicated network requests.
*   **Cons**:
    *   The frontend must strictly monitor the play progress to pause or loop the audio before it runs past `segment.end_time`. This is handled by a high-frequency polling check or a fine-grained `timeupdate` handler.
