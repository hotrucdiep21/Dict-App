# Task 005: Listening Engine & Player Controls

This task covers building the media player engine, implementing boundaries control, and mapping keyboard shortcuts.

---

## 1. Objectives
*   Build React custom player hooks wrapping the HTML5 `<audio>` element.
*   Enforce segment play boundaries (prevent playing beyond `end_time`).
*   Wire up keyboard shortcuts (Space, R, B, N, P, L, +, -) for fluid navigation.

---

## 2. Checklist

- [ ] **1. Zustand Audio Player Store (`frontend/src/store/useAudioStore.ts`)**:
    - [ ] Manage states: `isPlaying`, `playbackSpeed`, `isLoopEnabled`, `currentTime`, `duration`, `volume`.
    - [ ] Action reducers: `play()`, `pause()`, `setTime(t)`, `setSpeed(s)`, `toggleLoop()`, `setVolume(v)`.
- [ ] **2. Media Player Component & Boundaries**:
    - [ ] Create wrapper component `<AudioPlayer />` rendering the audio tag invisible.
    - [ ] Bind dynamic `timeupdate` handler:
        *   If `audio.currentTime >= segment.endTime`:
            *   If `isLoopEnabled` is true, seek to `segment.startTime` and replay.
            *   Else, pause audio and clamp position to `segment.startTime`.
- [ ] **3. Shortcuts Listener Hooks**:
    - [ ] Register global event listener on `window.keydown`.
    - [ ] Prevent default action if target element is typing input (except for `Ctrl + Enter`).
    - [ ] Map keys to store actions: Space (Toggle Play), R (Replay), B (Rewind 3s), N (Next), P (Previous), L (Toggle Loop), +/- (Adjust playback speed).

---

## 3. Verification
*   Verify that clicking Next/Previous moves segments and updates boundaries instantly without reload.
*   Ensure that loop mode repeats the segment audio seamlessly.
*   Check that pressing keys does not write letters to text area when input is focused.
