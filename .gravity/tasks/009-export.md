# Task 009: Data Exporting Features

This task covers exporting user history and lessons data as CSV or JSON formats.

---

## 1. Objectives
*   Build backend serialization helpers for CSV and JSON outputs.
*   Implement download endpoints mapped in `api_contract.md`.

---

## 2. Checklist

- [ ] **1. CSV/JSON Serializers**:
    - [ ] Create formatting helpers mapping attempt models to tabular rows (columns: Lesson Title, Segment Index, Date, Accuracy, Replays, Jumps, Duration).
    - [ ] Implement serializer mapping all user history data to structured JSON payloads.
- [ ] **2. Export Controller**:
    - [ ] Implement `GET /api/v1/stats/export`.
    - [ ] Read `format` query string parameters.
    - [ ] Return FastAPI `StreamingResponse` set with appropriate attachment header (`Content-Disposition: attachment; filename=dictation_history.csv`).

---

## 3. Verification
*   Request export files from the browser or curl and check that file downloading occurs correctly.
*   Verify that CSV headers contain columns matching our attempt history columns.
