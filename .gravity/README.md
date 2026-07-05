# Dictation Practice

> A production-grade web application for deliberate English listening practice using the **Dictation** method.

---

# Overview

Dictation Practice is a personal learning tool designed to improve English listening comprehension through active transcription.

Unlike traditional media players or subtitle-based learning platforms, this application encourages **active listening**, **error analysis**, and **intentional review**.

The application is designed around a single workflow:

```text
Listen
    ↓
Type what you hear
    ↓
Compare with transcript
    ↓
Analyze mistakes
    ↓
Review difficult segments
    ↓
Track long-term improvement
```

The primary goal is not media playback, but deliberate listening practice.

---

# Design Principles

The project follows these principles:

* Keyboard-first interaction
* Minimal and distraction-free interface
* Fast response time
* Offline-friendly
* Single-user architecture
* Production-ready codebase
* Clean Architecture
* API-first development
* Highly maintainable and extensible

---

# Technology Stack

## Backend

* Python 3.12+
* FastAPI
* SQLAlchemy 2.x
* Alembic
* SQLite
* Pydantic v2

## Frontend

* React
* Vite
* TypeScript (Strict Mode)
* TailwindCSS
* React Query
* Zustand

## Infrastructure

* Docker
* Docker Compose

---

# Main Features

## Lesson Management

* Upload audio files
* Upload transcript files
* Automatic transcript parsing
* Timestamp-based segmentation

---

## Listening Practice

* Segment-based playback
* Replay current segment
* Configurable backward jump
* Infinite loop playback
* Playback speed control
* Hidden transcript mode
* Keyboard-first workflow

---

## Dictation

* Type what you hear
* Compare with original transcript
* Word-level difference detection
* Levenshtein-based typo recognition
* Accuracy calculation

---

## Review System

* Bookmark difficult segments
* Automatic review queue
* Multiple attempts
* Progress tracking

---

## Statistics

* Listening accuracy
* Replay count
* Rewind count
* Hardest segments
* Frequently missed words
* Session history

---

## Export

* CSV
* JSON

---

# Project Structure

```text
project-root/

├── .gravity/
│   ├── README.md
│   ├── project.md
│   ├── architecture.md
│   ├── coding_rules.md
│   ├── workflow.md
│   ├── data_model.md
│   ├── api_contract.md
│   ├── wireframe.md
│   ├── decisions.md
│   ├── current_state.md
│   ├── future_features.md
│   └── tasks/
│
├── backend/
│
├── frontend/
│
├── docker/
│
├── scripts/
│
├── docs/
│
└── docker-compose.yml
```

---

# Documentation

The `.gravity` directory contains the complete project specification.

| File               | Purpose                          |
| ------------------ | -------------------------------- |
| project.md         | Complete product requirements    |
| architecture.md    | Software architecture            |
| coding_rules.md    | Coding conventions               |
| workflow.md        | Business workflows               |
| data_model.md      | Database design                  |
| api_contract.md    | Backend API specification        |
| wireframe.md       | UI layout                        |
| decisions.md       | Architectural decisions          |
| current_state.md   | Development progress             |
| future_features.md | Product roadmap                  |
| tasks/             | Incremental implementation tasks |

---

# Development Workflow

The project must always be developed in the following order.

1. Project initialization
2. Backend architecture
3. Database models
4. Repository layer
5. Service layer
6. API layer
7. Unit tests
8. Frontend architecture
9. UI components
10. API integration
11. End-to-end testing
12. Final polishing

No step should be skipped.

---

# Running the Project

## Requirements

* Docker
* Docker Compose

---

## Start

```bash
docker compose up --build
```

---

## Stop

```bash
docker compose down
```

---

## Rebuild

```bash
docker compose up --build --force-recreate
```

---

# Code Quality Requirements

The generated code must follow:

* SOLID Principles
* Clean Architecture
* Repository Pattern
* Service Layer
* Dependency Injection
* Type Safety
* DRY
* KISS
* Single Responsibility Principle

---

# Testing Requirements

Every feature should include appropriate tests.

Backend

* Unit Tests
* Integration Tests
* Parser Tests

Frontend

* Component Tests
* UI Tests

Future

* End-to-End Tests

---

# Coding Standards

The following rules are mandatory.

## Python

* Type hints everywhere
* Small functions
* Explicit error handling
* Logging
* Validation
* No business logic inside API routes

## TypeScript

* Strict Mode
* No `any`
* Functional Components
* Reusable Hooks
* Reusable Components

---

# Branch Strategy

Recommended Git workflow.

```text
main

↓

develop

↓

feature/*
```

Each feature should be implemented in its own branch.

---

# Future Vision

The architecture should support future expansion without major refactoring.

Planned features include:

* Whisper alignment
* AI pronunciation analysis
* Vocabulary extraction
* Shadowing mode
* Spaced repetition
* AI mistake explanations
* Multi-course support
* Cloud synchronization
* Progressive Web App (PWA)

---

# Contribution Guidelines

Before implementing any feature:

1. Read `project.md`.
2. Read `architecture.md`.
3. Read `coding_rules.md`.
4. Read the corresponding task document.
5. Verify that the implementation follows existing architectural decisions.

No implementation should violate the documented architecture.

---

# License

This project is intended for personal educational use.

---

# Project Status

Current Phase:

**Planning & Architecture**

Implementation progress is tracked in:

`.gravity/current_state.md`
