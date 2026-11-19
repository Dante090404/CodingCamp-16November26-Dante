# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement the dashboard incrementally across three files (`index.html`, `css/style.css`, `js/script.js`). Each task adds one self-contained feature on top of a working skeleton, so the app is runnable after every step. All logic is plain ES5/ES6 vanilla JavaScript with no build step or external dependencies. All state is persisted in `localStorage` under the `ld_` key prefix.

## Tasks

- [x] 1. Scaffold HTML structure and CSS base
  - Write the full `index.html` skeleton: `<header>` with `#clock`, `#date`, `#greeting`, `#edit-name`, `#theme-toggle`; `<main class="grid">` containing the Focus Timer card, To-Do List card, and Quick Links card (wide) with all required IDs matching the design spec
  - Write `css/style.css`: CSS custom property definitions for `--bg`, `--card`, `--text`, `--muted`, `--border`, `--accent`, `--accent-text`, `--danger`, `--shadow` for both `:root` (light) and `[data-theme="dark"]`; base reset, `.app`, `.grid`, `.card`, `.wide`, `.row`, button, input, and select styles; `.timer-display`, `.todo-list`, `.todo-item`, `.link-chip` component styles; `@media (max-width: 720px)` responsive override
  - Set minimum body font size to 14 px, max page width to 960 px (≤ 1200 px), two distinct heading levels (`h1` clock, `h2` widget titles)
  - _Requirements: 6.1, 6.2, 6.3, 6.6_

- [x] 2. Implement storage helpers and DOM shorthand
  - [x] 2.1 Write `load(key, fallback)` and `save(key, value)` using `JSON.parse`/`JSON.stringify` inside try/catch; `load` returns `fallback` on missing key or parse error; `save` swallows errors silently
  - Write `const $ = (id) => document.getElementById(id)` shorthand
  - Define the `KEYS` constant object with all six `ld_*` keys
  - _Requirements: 3.7, 3.11, 4.5, 4.6, 5.3, 5.6_

  - [ ]* 2.2 Write property test for localStorage round-trip (Property 11)
    - **Property 11: localStorage round-trip preserves data**
    - **Validates: Requirements 3.7, 4.5, 4.6**

- [x] 3. Implement Greeting & Clock module
  - [x] 3.1 Write `getGreeting(hour)` pure function: hour 0–4 → "Good night", 5–11 → "Good morning", 12–17 → "Good afternoon", 18–23 → "Good evening"
  - Write `updateClock()`: reads `new Date()`, sets `#clock` via `toLocaleTimeString`, `#date` via `toLocaleDateString`, `#greeting` using greeting + optional name
  - Load `userName` from `ld_name` on startup; register `#edit-name` click listener: `prompt`, trim, `slice(0, 30)`, save, re-render
  - Start `setInterval(updateClock, 1000)` in Init section
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 3.2 Write property test for greeting hour coverage (Property 1)
    - **Property 1: Greeting function covers all 24 hours**
    - **Validates: Requirements 1.2**

  - [ ]* 3.3 Write property test for greeting format with and without name (Property 2)
    - **Property 2: Greeting format with and without name**
    - **Validates: Requirements 1.3**

  - [ ]* 3.4 Write property test for name truncation invariant (Property 3)
    - **Property 3: Name truncation invariant**
    - **Validates: Requirements 1.5**

- [x] 4. Implement Light/Dark theme module
  - [x] 4.1 Write `applyTheme(theme)`: sets `document.documentElement.setAttribute('data-theme', theme)` and updates `#theme-toggle` button text ("Light mode" / "Dark mode")
  - Load initial `theme` from `ld_theme`; fallback to `window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`
  - Register `#theme-toggle` click listener: flip theme, call `applyTheme`, save to `ld_theme`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 4.2 Write property test for theme toggle round trip (Property 14)
    - **Property 14: Theme toggle is a round trip**
    - **Validates: Requirements 5.1, 5.3**

- [x] 5. Checkpoint — verify skeleton renders correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Focus Timer module
  - [x] 6.1 Write `renderTimer()`: formats `remaining` as zero-padded MM:SS, writes to `#timer-display`, sets `document.title` to `"MM:SS - Focus"` while running or `"Life Dashboard"` when stopped
  - Write `startTimer()`, `stopTimer()`, `resetTimer()` following the design state machine (`timerId` guard, `remaining ≤ 0` guard)
  - Register `#timer-start`, `#timer-stop`, `#timer-reset` click listeners
  - Load `timerMinutes` from `ld_minutes` (default 25); set `#timer-minutes` input value; register `change` listener: `parseInt || 25`, clamp to [1, 120], save, call `resetTimer()`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ]* 6.2 Write property test for timer display format (Property 4)
    - **Property 4: Timer display format**
    - **Validates: Requirements 2.2**

  - [ ]* 6.3 Write property test for timer reset restores configured length (Property 5)
    - **Property 5: Timer reset restores configured length**
    - **Validates: Requirements 2.4**

  - [ ]* 6.4 Write property test for timer minutes clamping (Property 6)
    - **Property 6: Timer minutes clamping**
    - **Validates: Requirements 2.9**

  - [ ]* 6.5 Write unit tests for Focus Timer edge cases
    - Timer initial state: `timerMinutes === 25`, `remaining === 1500`
    - `startTimer()` while already running does not create a second interval
    - `startTimer()` with `remaining === 0` is a no-op
    - `stopTimer()` pauses at current value
    - _Requirements: 2.1, 2.6, 2.7, 2.3_

- [x] 7. Implement To-Do List module
  - [x] 7.1 Write `isDuplicate(text, ignoreId?)`: case-insensitive, whitespace-trimmed match against all tasks except the one with `ignoreId`
  - Write `sortedTasks()`: returns a sorted shallow copy of `tasks` for all six `sortMode` values using the comparators defined in the design
  - _Requirements: 3.8, 3.9, 3.10_

  - [ ]* 7.2 Write property test for duplicate detection normalisation (Property 8)
    - **Property 8: Duplicate detection is case- and whitespace-insensitive**
    - **Validates: Requirements 3.8, 3.9**

  - [ ]* 7.3 Write property test for sort order invariants (Property 10)
    - **Property 10: Sort order invariants**
    - **Validates: Requirements 3.10**

  - [x] 7.4 Write `renderTasks()`: full DOM re-render of `#todo-list`; builds checkbox, text span (via `textContent`), Edit/Delete icon buttons, and inline edit input when `editingId` matches; updates `#todo-count`
  - Write `saveTasks()` helper calling `save(KEYS.tasks, tasks)`
  - Register `#todo-form` submit listener: trim, duplicate check, push task with `Date.now()` id, clear input, save, render
  - Register `#todo-sort` change listener: update `sortMode`, save, render
  - Register `#todo-input` input listener to clear `#todo-error`
  - Inline edit: Save commits non-empty, non-duplicate text; Cancel restores view; Enter/Escape keyboard shortcuts
  - Load `tasks` from `ld_tasks` (default `[]`) and `sortMode` from `ld_sort` (default `"newest"`) on startup
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.10, 3.11_

  - [ ]* 7.5 Write property test for task list growth on valid add (Property 7)
    - **Property 7: Task list growth on valid add**
    - **Validates: Requirements 3.1**

  - [ ]* 7.6 Write property test for task deletion removes exactly the target (Property 9)
    - **Property 9: Task deletion removes exactly the target**
    - **Validates: Requirements 3.6**

  - [ ]* 7.7 Write unit tests for To-Do List edge cases
    - Empty edit is discarded without touching localStorage
    - _Requirements: 3.2_

- [x] 8. Checkpoint — verify timer and to-do list work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Quick Links module
  - [x] 9.1 Write `normalizeUrl(value)`: trim, prepend `https://` if no protocol, attempt `new URL()` parse, return `null` if hostname has no `.` or parse throws
  - _Requirements: 4.8, 4.9_

  - [ ]* 9.2 Write property test for URL normalisation prepends https (Property 12)
    - **Property 12: URL normalisation prepends https when no protocol**
    - **Validates: Requirements 4.9**

  - [ ]* 9.3 Write property test for invalid URLs produce null (Property 13)
    - **Property 13: Invalid URLs produce null**
    - **Validates: Requirements 4.8**

  - [x] 9.4 Write `renderLinks()`: full DOM re-render of `#links`; builds `.link-chip` elements with `<a>` (opens in new tab, `rel="noopener noreferrer"`) and a remove button; shows empty-state paragraph when list is empty
  - Register `#link-form` submit listener: validate name and normalised URL, push link with `Date.now()` id, clear inputs, save, render
  - Register remove button click delegated through `renderLinks` closure: filter link out, save, render
  - Load `links` from `ld_links` on startup; default to `[Google, GitHub, YouTube]` only when no key exists
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 9.5 Write unit tests for Quick Links edge cases
    - Default links appear when no key exists in localStorage
    - Empty link name shows error and does not add link
    - _Requirements: 4.4, 4.7_

- [x] 10. Final checkpoint — verify full dashboard end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; the user specified no test framework setup is required
- Property-based tests (Properties 1–14) use [fast-check](https://fast-check.dev/) with a minimum of 100 iterations each; they target pure functions only and need no browser environment
- Unit tests cover example-based scenarios and edge cases
- Each task references specific requirements for traceability
- Checkpoints at tasks 5, 8, and 10 ensure incremental validation at each major milestone
- All user-supplied text is written via `element.textContent` (never `innerHTML`) to prevent XSS

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "3.4", "4.1"] },
    { "id": 5, "tasks": ["4.2"] },
    { "id": 6, "tasks": ["5"] },
    { "id": 7, "tasks": ["6.1"] },
    { "id": 8, "tasks": ["6.2", "6.3", "6.4", "6.5", "7.1"] },
    { "id": 9, "tasks": ["7.2", "7.3", "7.4"] },
    { "id": 10, "tasks": ["7.5", "7.6", "7.7"] },
    { "id": 11, "tasks": ["8"] },
    { "id": 12, "tasks": ["9.1"] },
    { "id": 13, "tasks": ["9.2", "9.3", "9.4"] },
    { "id": 14, "tasks": ["9.5"] },
    { "id": 15, "tasks": ["10"] }
  ]
}
```
