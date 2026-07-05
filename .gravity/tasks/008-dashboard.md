# Task 008: Statistics & Analytics Dashboard

This task covers calculating and displaying learning metrics and overall progress.

---

## 1. Objectives
*   Build backend aggregations to compute global and course metrics.
*   Extract the hardest segments and most frequently misspelled words.
*   Render the Dashboard UI showing progress grids.

---

## 2. Checklist

- [ ] **1. Statistics Aggregation Service (`backend/services/stats.py`)**:
    - [ ] Query and calculate:
        *   Overall Accuracy (average accuracy of best attempts per segment).
        *   Total Listening Time (sum of typing durations across attempts).
        *   Aggregated replay count and back-jump count.
        *   Completion progress ratio (completed segments / total segments).
    - [ ] Identify Hardest Segments (highest attempt counts or lowest best accuracies).
    - [ ] Extract Misspelled Words:
        *   Parse the difference objects in attempts. Filter tokens marked as `typo` or `incorrect` and count frequencies.
- [ ] **2. FastAPI Analytics Router**:
    - [ ] Implement `GET /api/v1/stats` exposing aggregated fields.
- [ ] **3. Dashboard UI Views**:
    - [ ] Display visual metric cards.
    - [ ] Render lists of hardest segments and misspelled words.
    - [ ] Hook React Query to auto-invalidate stats queries when attempts are successfully posted.

---

## 3. Verification
*   Verify stats dashboard updates correctly when a user completes attempts.
*   Assert sorting order of hardest segments list matches database counts.
