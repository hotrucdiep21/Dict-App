# Task 007: Attempt History, Bookmarks, and Review Queue

This task covers logging typing attempts, toggling bookmarks, and managing the automatic review queue.

---

## 1. Objectives
*   Persist immutable typing attempts.
*   Enforce segment status transitions (Completed vs Needs Review).
*   Implement segment bookmarker toggle endpoint.

---

## 2. Checklist

- [ ] **1. Attempt Logger Service**:
    - [ ] Create `POST /api/v1/segments/{id}/check` controller.
    - [ ] Accept payloads: `typed_text`, `replay_count`, `back_jump_count`, `typing_duration`.
    - [ ] Validate, save attempt log, and calculate score.
- [ ] **2. State Transitions Logic**:
    - [ ] If accuracy $\ge 90\%$: transition segment status to `COMPLETED`.
    - [ ] Else: transition status to `NEEDS_REVIEW`.
- [ ] **3. Bookmarks Manager**:
    - [ ] Create `POST /api/v1/segments/{id}/bookmark` endpoint.
    - [ ] Toggle `is_bookmarked` boolean properties and return updated state.
- [ ] **4. Review Filter UI**:
    - [ ] Add filters in the practice sidebar to view only "Needs Review" or "Bookmarked" segments, allowing users to isolate difficult content.

---

## 3. Verification
*   Check that submitting a low-score attempt (<90%) correctly flags segment status as `NEEDS_REVIEW`.
*   Ensure that database entries in the `attempts` table are created for every submit action (attempts are immutable).
