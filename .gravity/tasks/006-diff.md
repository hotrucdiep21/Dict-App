# Task 006: Word Difference & Typo Detection Engine

This task covers implementing the word-level diffing algorithms on the backend and rendering the side-by-side matches.

---

## 1. Objectives
*   Tokenize and normalize transcript strings.
*   Implement `SequenceMatcher` to align token lists.
*   Calculate Levenshtein distance for misspelled words (typos).
*   Render side-by-side visual diff matching (Green, Red, Orange, Blue).

---

## 2. Checklist

- [ ] **1. String Normalization & Tokenization**:
    - [ ] Strip commas, periods, quotes, questions, hyphens. Lowercase everything.
- [ ] **2. Difference Engine (`backend/services/diff.py`)**:
    - [ ] Run `difflib.SequenceMatcher` to find matching blocks.
    - [ ] Calculate Levenshtein distance (edit distance matrix) for mismatches:
        *   If `distance <= 2` and word length `> 3`, mark word as `Typo` (Red with underline).
        *   Else, mark as `Incorrect` (Red).
        *   Words in original sequence omitted by user -> `Missing` (Orange).
        *   Words typed by user but absent in original -> `Extra` (Blue).
    - [ ] Return structured array of diff tokens with status labels.
- [ ] **3. Frontend Diff Component (`frontend/src/components/DiffViewer.tsx`)**:
    - [ ] Render side-by-side divs with synchronized scrolling.
    - [ ] Highlight tokens dynamically using Tailwind utility classes (`text-green-600`, `text-red-500`, `text-amber-500`, `text-blue-500`).

---

## 3. Verification
*   Write unit tests asserting correctness scoring:
    *   Original: `"The quick brown fox jumps over the lazy dog."`
    *   Typed: `"The quick brown fox jump over a lazy dog."`
    *   Check that "jumps" -> "jump" flags a typo/incorrect, "the" -> "a" flags extra/missing, and final accuracy matches calculations.
