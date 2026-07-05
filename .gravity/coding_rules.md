# Coding Standards and Style Guidelines

This document outlines the coding standards, rules, and best practices mandatory for the Dictation Practice project.

---

## 1. Python Style Guidelines (Backend)

### 1.1 Type Safety and Declarations
*   **Mandatory Type Hints**: All function parameters, return values, and variables must have explicit type declarations.
    ```python
    def calculate_word_accuracy(original: str, typed: str) -> float:
        ...
    ```
*   Use `typing.Sequence` instead of `list` for parameter types to allow passing tuples or generators.
*   Use Pydantic v2 schemas for all API payloads and response models.

### 1.2 SQLAlchemy 2.x Styles
*   Use the new `select(...)` syntax exclusively. Avoid the old `Session.query(...)` method.
*   Declare model schemas using `Mapped[...]` types for columns to enforce type check consistency with mypy.
    ```python
    class LessonORM(Base):
        __tablename__ = "lessons"
        id: Mapped[int] = mapped_column(primary_key=True)
        title: Mapped[str] = mapped_column(String(255))
    ```
*   Implement async database sessions safely if using async SQLAlchemy, otherwise keep sync sessions strictly scoped using FastAPI dependencies and context managers.

### 1.3 Error Handling & Exceptions
*   Do not throw raw `HTTPException` inside services or repositories.
*   Define custom domain exception classes (inheriting from a base `AppException`).
*   Implement FastAPI global exception handlers to map custom exception classes to clean, standardized JSON error responses.
    ```python
    class AppException(Exception):
        message: str
        status_code: int

    class LessonNotFoundException(AppException):
        def __init__(self, lesson_id: int):
            self.message = f"Lesson with ID {lesson_id} was not found."
            self.status_code = 404
    ```

### 1.4 Structured Logging
*   Use standard `logging` configured with a structured JSON formatter.
*   Log important lifecycle events: file upload events, transcript parser errors, attempts saved, and exceptions.
*   Do not log credentials or sensitive metadata.

---

## 2. React / TypeScript Guidelines (Frontend)

### 2.1 Compiler and Strict Typing
*   TypeScript must run in **strict mode** with the following options set to `true` in `tsconfig.json`:
    *   `noImplicitAny`
    *   `strictNullChecks`
    *   `strictFunctionTypes`
    *   `noUnusedLocals`
*   The `any` type is strictly forbidden. Use `unknown` or specify unions and generic interfaces.

### 2.2 Functional Components and Hooks
*   Define components as React functional components: `const ComponentName: React.FC<Props> = ...` (or simple function syntax with explicit return types).
*   Extract side-effects and backend communication into custom hooks prefixed with `use` (e.g., `useLessonDetails`, `useCreateAttempt`).
*   Keep logic thin in UI rendering files and group data transformation logic inside hooks or selectors.

### 2.3 Zustand Store Design
*   Keep Zustand stores small and domain-specific (e.g., separate store for active playback configs vs UI configurations).
*   Always structure store updates immutably.
*   Decouple trigger logic by putting handler methods within the store.

### 2.4 CSS & Tailwind conventions
*   Tailwind utility classes must follow a consistent ordering (Layout → Box model → Typography → Borders → Effects → Interactive).
*   Implement Dark Mode using Tailwind's `dark:` modifier based on a class-based strategy (`html.dark`).
*   Maintain accessible focus rings (`focus-visible:ring-2 focus-visible:ring-offset-2`).
*   Avoid adding inline styles unless calculating dynamic variables (like audio waveform offsets).
