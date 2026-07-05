# Task 010: Testing Suite Configurations

This task covers configuring automated test frameworks and writing tests for backend and frontend.

---

## 1. Objectives
*   Configure backend tests using pytest and sqlite-in-memory databases.
*   Configure frontend unit tests using Vitest or Jest.
*   Achieve robust code coverage for parsers, services, and hooks.

---

## 2. Checklist

- [ ] **1. Backend Testing Framework**:
    - [ ] Set up `backend/tests/conftest.py` creating clean database session fixtures.
    - [ ] Write parser unit tests (`backend/tests/test_parser.py`) asserting SRT subtitles mapping logic.
    - [ ] Write diff algorithms tests (`backend/tests/test_diff.py`) validating Levenshtein and sequence matching accuracy.
    - [ ] Write service tests (`backend/tests/test_services.py`) checking state transitions.
- [ ] **2. Frontend Testing Framework**:
    - [ ] Configure `vitest` in the Vite app.
    - [ ] Write components unit tests validating visual indicators (bookmark state icons, diff coloring status).
    - [ ] Test the keyboard shortcuts event handlers.

---

## 3. Verification
*   Run `pytest` in backend container and verify tests pass.
*   Run `npm run test` in frontend container and verify all components assertions match.
