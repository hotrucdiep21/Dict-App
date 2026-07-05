# User Interface Wireframe Design

This document details the layout structure, views, and ASCII wireframes for the Dictation Practice interface, optimized for a keyboard-first, minimal user experience.

---

## 1. View: Dashboard (Lesson Listing & Analytics)

```text
+------------------------------------------------------------------------------------+
|  DICTATION PRACTICE                         [Light/Dark Mode] [Keyboard Shortcuts] |
+------------------------------------------------------------------------------------+
|  GLOBAL STATISTICS                                                                 |
|  [ Accuracy: 94.2% ] [ Time: 4h 12m ] [ Replays: 142 ] [ Rewinds: 88 ]             |
+------------------------------------------------------------------------------------+
|  CREATE NEW LESSON                                                                 |
|  Title: [                                                                       ]  |
|  Audio File:       [ Choose File... ] (Supported: .mp3, .wav, .m4a)                |
|  Transcript File:  [ Choose File... ] (Supported: .srt, .txt, .json)               |
|                                                     [ Create & Start Practice ]    |
+------------------------------------------------------------------------------------+
|  YOUR LESSONS                                                                      |
|                                                                                    |
|  1. IELTS Listening Practice - Section 1                                           |
|     Progress: [██████████████████░░░] 72% (15/20 segments completed)                |
|     Avg. Accuracy: 92.5%  |  Duration: 12:45                                       |
|     [ PRACTICE NOW ] [ DELETE ]                                                    |
|                                                                                    |
|  2. Steve Jobs Stanford Commencement Address                                        |
|     Progress: [░░░░░░░░░░░░░░░░░░░░░] 0% (0/45 segments completed)                 |
|     Avg. Accuracy: --%    |  Duration: 15:03                                       |
|     [ PRACTICE NOW ] [ DELETE ]                                                    |
+------------------------------------------------------------------------------------+
```

---

## 2. View: Practice (Deliberate Practice Screen)

```text
+------------------------------------------------------------------------------------+
| < BACK TO DASHBOARD | Lesson: IELTS Listening Practice - Section 1                 |
+------------------------------------------------------------------------------------+
| SEGMENTS           | PRACTICE PANEL  -  Segment 4 / 20            [Bookmarked: [x]] |
|                    | Speed: [ 1.00x ]  Loop Mode: [ Disabled ]  Volume: [████████░] |
| [x] 1. 0:00 - 0:05 |                                                                |
| [x] 2. 0:05 - 0:12 | PROGRESS BAR (Click/Drag Disabled)                             |
| [/] 3. 0:12 - 0:18 | [==============●========================] 01.42 / 05.63            |
| [*] 4. 0:18 - 0:23 |                                                                |
| [ ] 5. 0:23 - 0:31 | TRANSCRIPT PREVIEW                                             |
| [ ] 6. 0:31 - 0:40 | +------------------------------------------------------------+ |
| [ ] 7. 0:40 - 0:48 | | ****************** TRANSCRIPT BLURRED ********************* | |
| [ ] 8. 0:48 - 0:52 | |                           [ REVEAL TRANSCRIPT (H) ]          | |
| [ ] 9. 0:52 - 0:59 | +------------------------------------------------------------+ |
|                    |                                                                |
|                    | DICTATION INPUT                                                |
|                    | +------------------------------------------------------------+ |
|                    | | Type what you hear in this area...                         | |
|                    | |                                                            | |
|                    | +------------------------------------------------------------+ |
|                    | [ REPLAY (R) ]  [ BACK 3s (B) ]                  [ CHECK (Ctrl+Enter) ]
+------------------------------------------------------------------------------------+
| ATTEMPT COMPARISON (Appears below typing input after checking answer)               |
|                                                                                    |
| Accuracy: 91.2% | Correct: 8 | Incorrect: 1 (Typo) | Extra: 1 | Missing: 1         |
|                                                                                    |
| Left: Your Typed Answer              | Right: Original Transcript                  |
| ------------------------------------ | ------------------------------------------- |
| Hello and welcome to [clean](red)    | Hello and welcome to [building](orange)     |
| code [aplications](red) [now](blue). | [clean](green) code [applications](green).  |
+------------------------------------------------------------------------------------+
| ATTEMPT HISTORY                                                                    |
| Attempt #  | Time                 | Accuracy | Replays | Jumps | Duration          |
| 1          | 2026-07-05 04:31:05  | 78.4%    | 5       | 3     | 72s               |
| 2          | 2026-07-05 04:32:15  | 91.2%    | 3       | 2     | 52s               |
+------------------------------------------------------------------------------------+
```

---

## 3. Keyboard Shortcuts Helper Modal (FR-029 Overlay)

Can be toggled or viewed by clicking `[Keyboard Shortcuts]` in the header, or pressing `?`.

```text
+-------------------------------------------------------------+
| KEYBOARD SHORTCUTS                                      [X] |
+-------------------------------------------------------------+
|  Global Controls (when Typing Input is not focused)         |
|  - Space       : Play / Pause audio playback                |
|  - R           : Replay current segment from start          |
|  - B           : Rewind playback by 3 seconds               |
|  - N           : Load next segment                          |
|  - P           : Load previous segment                      |
|  - L           : Toggle Infinite Loop mode                  |
|  - H           : Toggle Transcript visibility (Reveal/Blur) |
|  - + / -       : Increase / Decrease playback speed         |
|  - F           : Focus typing input field                   |
|                                                             |
|  Typing Area Controls (when Typing Input is focused)        |
|  - Ctrl + Enter: Submit dictation and check answer          |
+-------------------------------------------------------------+
```
