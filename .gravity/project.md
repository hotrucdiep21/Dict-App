
# Dictation Practice

## Product Requirements Document (PRD)

Version: 1.0

Status: Draft

---

# 1. Product Vision

Dictation Practice is a personal web application designed to help users improve English listening skills through **active dictation**.

Unlike traditional video players or subtitle-based learning tools, this application intentionally forces users to listen first, type what they hear, and only reveal the transcript after completing the exercise.

The application focuses on **deliberate practice**, meaning every interaction is designed to maximize learning efficiency rather than passive consumption.

---

# 2. Product Goals

The application aims to:

* Improve listening comprehension.
* Encourage active recall instead of passive reading.
* Help users identify recurring listening mistakes.
* Build long-term listening accuracy through repetition.
* Provide measurable progress over time.
* Minimize distractions during practice.

---

# 3. Target User

Primary user:

* English learners
* IELTS learners
* TOEIC learners
* Self-learners
* Shadowing practitioners

Current product scope assumes a **single local user**.

Authentication and multi-user support are intentionally excluded from Version 1.

---

# 4. Product Philosophy

Every feature must satisfy at least one of the following principles.

## 4.1 Active Listening

Users should spend more time listening than reading.

The transcript should never become the primary learning material.

---

## 4.2 Deliberate Practice

The application should encourage:

* repeated listening
* focused attention
* error correction
* review of weak segments

---

## 4.3 Minimal Interface

The interface should avoid unnecessary animations, notifications or distractions.

The user should always know exactly what action to perform next.

---

## 4.4 Keyboard First

The application should be fully usable without touching the mouse.

Every frequently used action must have a keyboard shortcut.

---

## 4.5 Fast Feedback

Immediately after checking an answer, users should understand:

* what is correct
* what is incorrect
* what is missing
* what is unnecessary

---

# 5. Scope

Version 1 includes:

* Audio upload
* Transcript upload
* Transcript parsing
* Segment practice
* Dictation
* Automatic comparison
* Review queue
* Statistics
* Export
* Local persistence

Version 1 excludes:

* User accounts
* Cloud synchronization
* AI pronunciation scoring
* Vocabulary explanation
* Automatic translation
* Multiplayer features

---

# 6. Core Learning Workflow

Every lesson follows the same workflow.

```text
Create Lesson
      ↓
Upload Audio
      ↓
Upload Transcript
      ↓
Parse Transcript
      ↓
Generate Segments
      ↓
Select Segment
      ↓
Listen
      ↓
Type
      ↓
Check
      ↓
Analyze Errors
      ↓
Repeat
      ↓
Complete Lesson
      ↓
Review Weak Segments
```

No alternative workflow should bypass the typing stage.

---

# 7. Business Rules

BR-001

The transcript must remain hidden until the user explicitly reveals it.

---

BR-002

The user may replay a segment unlimited times.

---

BR-003

Checking an answer never modifies the original transcript.

---

BR-004

Every answer creates a new attempt.

Attempts are immutable.

---

BR-005

Statistics are calculated from attempt history.

They are never manually editable.

---

BR-006

Each lesson contains exactly one audio file.

---

BR-007

Each segment belongs to exactly one lesson.

---

BR-008

Deleting a lesson deletes all related:

* segments
* attempts
* bookmarks
* statistics

---

# 8. Functional Requirements

---

# FR-001 Create Lesson

Purpose

Create a new lesson container before any files are uploaded.

Inputs

* Lesson title

Outputs

* Lesson ID

Acceptance Criteria

* Lesson is stored successfully.
* Title cannot be empty.
* Title may contain duplicate names.

---

# FR-002 Upload Audio

Purpose

Upload one audio file for the lesson.

Supported formats

* mp3
* wav
* m4a

Validation

Reject:

* unsupported extensions
* empty files
* corrupted files

Acceptance Criteria

* Audio is stored.
* Metadata is stored.
* Lesson references uploaded audio.

---

# FR-003 Upload Transcript

Purpose

Upload transcript associated with the lesson.

Supported formats

* srt
* txt
* json

Acceptance Criteria

* Transcript stored successfully.
* Unsupported formats rejected.
* Empty transcript rejected.

---

# FR-004 Parse Transcript

Purpose

Convert transcript into timestamped segments.

Behavior

SRT:

Use existing timestamps.

TXT:

Create a single segment initially.

Future versions may support automatic alignment.

JSON:

Read existing segment information.

Acceptance Criteria

Each segment contains:

* id
* start
* end
* duration
* transcript

---

# FR-005 Validate Transcript

The parser must detect:

* missing timestamps
* overlapping timestamps
* invalid timestamp format
* empty transcript
* duplicated segments

If validation fails, parsing stops immediately.

---

# FR-006 Lesson Dashboard

Display

* lesson title
* total duration
* number of segments
* completed segments
* bookmarked segments
* average accuracy

The dashboard updates automatically after each attempt.

---

# FR-007 Segment List

Display every segment.

Each segment shows:

* segment number
* duration
* completion state
* bookmark state
* review state

Possible states

* Not Started
* In Progress
* Completed
* Needs Review
* Bookmarked

---

# FR-008 Open Segment

When a segment is selected:

The application loads

* transcript
* timestamps
* playback position
* previous attempts

The transcript remains hidden.

---

# FR-009 Resume Progress

If the lesson was previously opened,

the application restores

* selected segment
* playback speed
* loop mode
* playback position

---

# FR-010 Delete Lesson

Deleting a lesson permanently removes

* audio
* transcript
* segments
* attempts
* bookmarks
* statistics

Deletion requires confirmation.

---

# 9. User Experience Requirements

The application must always keep the user focused on the current segment.

Users should never need to navigate away from the practice screen while studying.

Every important action should be achievable within one keyboard shortcut.

The typing cursor should automatically return to the input field whenever appropriate.

---

# 10. Performance Requirements

Opening a lesson should take less than one second.

Switching between segments should appear instantaneous.

Comparison results should appear within 100 milliseconds after clicking **Check**.

The application should remain responsive even for lessons containing more than 1,000 segments.

---

# 11. Accessibility Requirements

All interactive controls must be keyboard accessible.

Focus indicators must always be visible.

Text should remain readable in both Light Mode and Dark Mode.

All shortcut keys must have visible tooltips.

---

# 12. Error Handling Principles

The application should never crash because of invalid user input.

Every error message must:

* explain the problem
* explain how to fix it
* avoid technical jargon

Unexpected errors should be logged for debugging.

---

# 13. Success Metrics

A successful practice session should allow the user to answer the following questions immediately:

* Which segments are the most difficult?
* Which words do I frequently mishear?
* How much have I improved since my previous attempt?
* Which segments should I review next?
* What is my overall listening accuracy?

If the application cannot answer these questions, the implementation is considered incomplete.

# 14. Listening Engine

## Overview

The Listening Engine is the core module responsible for audio playback during practice.

Unlike a traditional media player, the Listening Engine is optimized for repetitive learning, rapid replay, and keyboard-first interaction.

The Listening Engine must never expose transcript content.

Its only responsibility is audio playback.

---

# Design Principles

The Listening Engine must satisfy the following goals.

* Instant playback
* Zero unnecessary clicks
* Keyboard-first operation
* Repeat-friendly
* No timeline seeking outside the current segment
* Low latency
* Predictable behavior

---

# Segment Playback Model

The application never plays an entire lesson by default.

Instead, every playback operation happens inside one segment.

```text
Lesson
│
├── Segment 1
├── Segment 2
├── Segment 3
├── Segment 4
└── ...
```

Every playback action is scoped to the currently selected segment.

---

# FR-011 Select Segment

## Purpose

Load a segment into the listening player.

## Behavior

When a user selects a segment,

the application loads

* start timestamp
* end timestamp
* duration
* transcript (hidden)
* previous attempts
* bookmark status

Audio should be positioned at the segment start.

Playback does not begin automatically.

---

# FR-012 Play Segment

## Purpose

Play the current segment.

## Behavior

Playback starts from

Current Position

until

Segment End.

Playback must stop automatically at the segment end.

The next segment is never played automatically.

---

## Acceptance Criteria

✓ Playback starts immediately.

✓ Playback stops exactly at segment end.

✓ Playback never exceeds segment boundary.

✓ Playback position is updated continuously.

---

# FR-013 Pause Playback

Users can pause playback at any moment.

Resuming playback continues from the paused position.

Playback state should persist until changed.

---

# FR-014 Replay Segment

Replay always restarts playback from

Segment Start.

Replay never resumes from the paused position.

Replay increments

Replay Count.

---

# FR-015 Stop Playback

Stop playback immediately.

Reset playback position to

Segment Start.

Stop is different from Pause.

---

# FR-016 Previous Segment

Move to previous segment.

Behavior

* Stop current playback
* Reset playback position
* Load previous segment
* Do not autoplay

---

# FR-017 Next Segment

Move to next segment.

Behavior

* Stop playback
* Reset position
* Load next segment
* Do not autoplay

---

# FR-018 Playback Position

Playback position must update continuously.

Resolution

At least

100 milliseconds.

The UI should always display

Current Time

Segment Duration

Example

```text
01.42 / 05.63
```

---

# FR-019 Playback Progress

Display progress bar.

Requirements

* Smooth updates
* Click disabled
* Drag disabled

Reason

Users should not randomly seek.

Learning should remain segment focused.

---

# FR-020 Segment Boundary Protection

Playback must never exceed

Segment End.

If the browser continues playing,

the application must force stop.

---

# FR-021 Auto Stop

When playback reaches

Segment End

Stop playback immediately.

Never continue into the next segment.

---

# FR-022 Replay Count

Every replay operation increments

Replay Count.

Replay Count contributes to statistics.

---

# FR-023 Rewind Playback

Purpose

Allow users to quickly replay a short portion.

Default rewind

3 seconds.

Configurable values

* 1 second
* 2 seconds
* 3 seconds
* 5 seconds

---

Behavior

Given

Current Position = 12.5s

Press Back

Playback resumes from

9.5s

---

Boundary Rule

If rewind exceeds

Segment Start

Clamp to

Segment Start.

---

Statistics

Increment

Back Count.

---

# FR-024 Forward Playback

Version 1 intentionally excludes forward skip.

Reason

Forward skipping reduces deliberate listening.

---

# FR-025 Infinite Loop

Purpose

Repeat the current segment indefinitely.

Behavior

Playback reaches end

↓

Restart

↓

Playback reaches end

↓

Restart

Until

Loop Mode disabled.

---

Acceptance Criteria

No audible gap.

No manual interaction required.

---

# FR-026 Playback Speed

Supported values

* 0.50x

* 0.75x

* 0.90x

* 1.00x

* 1.10x

* 1.25x

Playback speed affects only audio.

Statistics remain unchanged.

---

# FR-027 Persist Playback Speed

Selected playback speed should persist

for the current lesson.

Users should not repeatedly configure speed.

---

# FR-028 Volume

Volume uses browser audio controls.

Application stores

Last Used Volume.

---

# FR-029 Keyboard Shortcuts

Default shortcuts

| Key   | Action           |
| ----- | ---------------- |
| Space | Play / Pause     |
| R     | Replay           |
| B     | Back 3 Seconds   |
| N     | Next Segment     |
| P     | Previous Segment |
| L     | Toggle Loop      |
| +     | Increase Speed   |
| -     | Decrease Speed   |

---

# FR-030 Shortcut Availability

Keyboard shortcuts must work whenever

Typing Area

is not focused.

Inside Typing Area

Only

Ctrl + Enter

should trigger checking.

All other typing must remain unaffected.

---

# FR-031 Session State

The player remembers

* current lesson
* current segment
* playback speed
* loop mode

When reopening the lesson,

state is restored.

---

# FR-032 Resume Session

If a lesson was closed unexpectedly,

the application restores

* lesson
* selected segment
* playback speed
* bookmarks

Playback position restoration is optional.

---

# FR-033 Loading Audio

Loading should occur once.

Switching segments must never reload

the audio file.

Only playback position changes.

---

# FR-034 Audio Caching

The browser should cache audio.

Repeated playback should not trigger

network requests.

---

# FR-035 Unsupported Browser

If browser playback fails,

display

"This browser does not support the selected audio format."

Do not crash.

---

# FR-036 Playback Errors

Possible errors

* Missing audio

* Corrupted audio

* Unsupported codec

* Network failure

Every error must

* stop playback

* display message

* write log

---

# FR-037 Transcript Visibility

The Listening Engine never reveals transcript content.

Transcript visibility is controlled by

Dictation Engine.

---

# Performance Requirements

Playback latency

< 150 ms

Segment switching

< 100 ms

Replay

< 100 ms

Rewind

< 100 ms

Loop restart

No noticeable interruption.

---

# Accessibility Requirements

Every playback control

must be keyboard accessible.

Every button must contain

Tooltip

Accessible Label

Visible Focus Indicator

---

# UX Requirements

The player should resemble

a language learning tool,

not

Spotify,

VLC,

or

YouTube.

The interface should encourage

repetition,

precision,

and

focused listening.

Random exploration of the timeline should be discouraged.

---

# Success Criteria

A successful Listening Engine allows users to

* replay rapidly
* rewind instantly
* practice one segment repeatedly
* operate almost entirely with the keyboard
* stay focused on listening rather than navigation

If users spend more time controlling the player than listening,

the Listening Engine design is considered unsuccessful.

