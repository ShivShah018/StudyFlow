# StudyFlow — Smart Student Productivity Suite

![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6-f7df1e?logo=javascript&labelColor=333)
![CSS3](https://img.shields.io/badge/CSS-Custom_Properties-1572b6?logo=css3&labelColor=333)
![HTML5](https://img.shields.io/badge/HTML5-SPA-e34f26?logo=html5&labelColor=333)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-complete-brightgreen)

> A single-page student productivity application — built with **zero dependencies, zero build tools, and zero frameworks**.  
> ~650 lines of vanilla JavaScript across 9 modules, ~290 lines of CSS. Open `index.html` and go.

[Live Demo](https://shivshah018.github.io/StudyFlow) · [Report Bug](https://github.com/ShivShah018/StudyFlow/issues) · [Request Feature](https://github.com/ShivShah018/StudyFlow/issues)

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Browser APIs Used](#browser-apis-used)
- [LocalStorage Design](#localstorage-design)
- [Key Implementation Highlights](#key-implementation-highlights)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [What I Learned](#what-i-learned)
- [Future Scope](#future-scope)
- [License](#license)

---

## Problem Statement

Students juggle multiple courses, assignment deadlines, exam preparation, and study sessions daily. Existing tools are either over-engineered (Notion, Trello) or too narrow (simple todo lists). StudyFlow provides a **lightweight, offline-capable, all-in-one dashboard** that combines task management, a Pomodoro timer, a calendar view, and an auto-scheduling engine — without requiring sign-up, internet, or a backend.

---

## Features

| Feature | Description |
|---------|-------------|
| **Task Manager** | Create, edit, delete, and filter tasks by priority, category, and due date |
| **Dashboard** | Stats summary, quick actions, productivity ring chart, recent tasks feed |
| **Calendar View** | Month grid with task dots, date selection, per-day task breakdown |
| **Pomodoro Timer** | Configurable focus/break cycles with SVG ring animations and Notification API integration |
| **Study Planner** | Auto-generates a day-by-day study schedule from task deadlines and estimated durations using a greedy first-fit algorithm |
| **Global Search** | Debounced cross-page search with `Ctrl + K` keyboard shortcut |
| **Streak Tracking** | Consecutive-day study streak calculated from completed planner sessions |
| **Notification System** | Browser Notification API with granular preference toggles (deadlines, study sessions, pomodoro, daily motivation) |
| **Responsive Design** | Three breakpoints (1024px, 768px, 480px) — sidebar collapses to overlay on mobile |
| **Persistent Storage** | All data persisted to `localStorage` — zero backend, zero setup, no data leaves the device |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | JavaScript (ES6) |
| **Markup** | HTML5 |
| **Styling** | CSS3 with Custom Properties |
| **Persistence** | Web Storage API (`localStorage`) |
| **Notifications** | Web Notifications API |
| **Charts** | Custom SVG (`stroke-dasharray` / `stroke-dashoffset`) |
| **Architecture** | Revealing Module Pattern (IIFE) |
| **Dependencies** | None (zero external libraries, zero build tools) |

---

## Screenshots

*Add screenshots to the `screenshots/` directory and link them here.*

| # | Screenshot | Caption |
|---|------------|---------|
| 1 | `screenshots/dashboard.png` | **Dashboard** — Welcome greeting, 4 stat cards (Total, Completed, Pending, Productivity %), quick-actions grid, recent tasks, and SVG productivity ring |
| 2 | `screenshots/tasks.png` | **Task Manager** — Filter bar (search, priority, category, sort), progress bar, and task list with priority indicators, due dates, edit/delete actions |
| 3 | `screenshots/calendar.png` | **Calendar** — Month grid with today highlight, task dots on due dates, selected-date task breakdown panel |
| 4 | `screenshots/pomodoro.png` | **Pomodoro Timer** — Configurable duration inputs, dual SVG rings (phase + total progress), start/pause/resume/reset controls |
| 5 | `screenshots/planner.png` | **Study Planner** — Auto-generated daily sessions, progress stats, upcoming deadlines, high-priority tasks, streak counter |
| 6 | `screenshots/mobile.png` | **Mobile Layout** — Collapsed sidebar with hamburger menu, stacked stat cards, full-width task list |

---

## Architecture

### Folder Structure

```
StudyFlow/
│
├── index.html               # SPA shell with sidebar, top bar, pomodoro template
│
├── css/
│   ├── style.css            # Design tokens, layout, buttons, cards, modals, toasts
│   ├── dashboard.css        # Dashboard stat cards, quick actions, productivity ring
│   ├── tasks.css            # Task filters, progress bar, task item layout
│   ├── calendar.css         # Calendar grid, day cells, date selection
│   └── responsive.css       # Breakpoints: 1024px, 768px, 480px
│
├── js/
│   ├── utils.js             # ID generation, date formatting, toast, debounce, escapeHTML
│   ├── storage.js           # Centralised localStorage CRUD (tasks, planner, settings)
│   ├── notifications.js     # Notification API wrapper, settings modal, streak calculator
│   ├── taskManager.js       # Task CRUD, filtering pipeline, modal form, view sync
│   ├── dashboard.js         # Dashboard renderer, stat aggregation, ring chart
│   ├── calendar.js          # Month grid generation, nav, day selection
│   ├── pomodoro.js          # Timer state machine, SVG animation, localStorage persistence
│   ├── studyPlanner.js      # Greedy scheduling algorithm, session CRUD, drag support
│   └── app.js               # Bootstrap, SPA navigation, global search, live clock
│
├── .gitignore
├── LICENSE
└── README.md
```

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Revealing Module Pattern** | Each file is an IIFE returning a public API — zero global variables, enforced encapsulation |
| **localStorage over IndexedDB** | Simpler API for the data volume (~100 tasks, ~500 sessions); synchronous reads under 10 ms |
| **CSS Custom Properties** | 30+ design tokens in `:root` — full theme in one place, future dark/light toggle ready |
| **Inline SVGs** | Zero icon dependencies; every icon is a hand-written inline SVG (no network requests) |
| **No Build Step** | Open `index.html` and go — maximum simplicity for code review and deployment |
| **Module Independence** | `typeof` guards let any module work without others; graceful degradation |

### Module Dependency Graph

```
app.js ────────────────────────────────────────────────────────────── bootstrap
  ├── utils.js         ← no deps
  ├── storage.js       ← no deps  
  ├── notifications.js ← utils.js
  ├── taskManager.js   ← utils.js, storage.js, app.js (navigation ref)
  ├── dashboard.js     ← utils.js, taskManager.js (stats), storage.js
  ├── calendar.js      ← utils.js, storage.js
  ├── pomodoro.js      ← notifications.js, utils.js
  └── studyPlanner.js  ← utils.js, storage.js, notifications.js
```

---

## Browser APIs Used

| API | Purpose | Module |
|-----|---------|--------|
| **Web Storage (`localStorage`)** | Persist tasks, planner schedule, timer settings, notification preferences | `storage.js`, `notifications.js`, `pomodoro.js` |
| **Web Notifications** | Send focus/break alerts, daily motivation quotes, deadline reminders | `notifications.js` |
| **`requestAnimationFrame` / `setInterval`** | Pomodoro countdown tick (1s interval), live clock (1s interval) | `pomodoro.js`, `app.js` |
| **`Element.closest()`** | Event delegation — detect clicked task item, session, or button from container listeners | `taskManager.js`, `dashboard.js`, `studyPlanner.js` |
| **`Intl.DateTimeFormat` / `toLocaleDateString`** | Locale-aware date formatting for task due dates, calendar headers | `utils.js`, `calendar.js` |
| **CSS Custom Properties (`var()`)** | Dynamic theming via JavaScript — phase colour switching in pomodoro rings | `pomodoro.js` |

---

## LocalStorage Design

All keys follow the `studyflow_` prefix convention:

| Key | Data | Format |
|-----|------|--------|
| `studyflow_tasks` | Array of task objects | `JSON` |
| `studyflow_planner_schedule` | `{ sessions: [], generatedAt: ISO }` | `JSON` |
| `studyflow_planner_completed_dates` | Array of date strings (`YYYY-MM-DD`) | `JSON` |
| `studyflow_notif_settings` | `{ deadlineReminders, pomodoroNotifications, ... }` | `JSON` |
| `studyflow_notif_permission` | `'granted'` / `'denied'` / `'default'` | String |
| `studyflow_pomodoro_settings` | `{ totalMinutes, focusMinutes, breakMinutes }` | `JSON` |

Every read is wrapped in `try/catch` for corrupt-data resilience. All writes go through `storage.js` except notification settings (self-contained in `notifications.js`).

---

## Key Implementation Highlights

### Auto-Scheduling Algorithm (`studyPlanner.js`)

Distributes estimated study minutes across available days before each task's deadline using a greedy first-fit approach with slot allocation:

```js
const perDay = Math.min(Math.ceil(totalMin / workingDays), totalMin);
// For each day, find earliest free slot respecting 08:00–22:00 working hours
// and 10-minute breaks between sessions
```

This is algorithmically interesting because it solves a simplified **interval partitioning / bin-packing** problem — similar to what Google Calendar's "Goals" feature does.

### Reactive Data Flow

When a task is created, completed, or deleted, the change propagates without a framework:

```
TaskManager.showTaskModal() → refreshRelatedViews()
                                ├── Dashboard.render()    (update stats)
                                ├── Calendar.render()     (update task dots)
                                └── StudyPlanner.generateSchedule() (regenerate plan)
```

### 0-Dependency SVG Charts

The productivity ring is a pure SVG circle driven by `stroke-dasharray` / `stroke-dashoffset`:

```js
const circumference = 2 * Math.PI * 38;
const offset = circumference - (pct / 100) * circumference;
ring.setAttribute('stroke-dasharray', circumference);
ring.setAttribute('stroke-dashoffset', offset);
```

### Streak Calculation

The streak calculator walks sorted completed dates backwards from today:

```js
let checkDate = new Date(today);
for (const dateStr of sorted) {
  const d = new Date(dateStr + 'T12:00:00');
  if (d.getTime() === checkDate.getTime()) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
  else if (d.getTime() < checkDate.getTime()) break;
}
```

### Event Delegation

All modules use `container.addEventListener('click', e => e.target.closest(...))` instead of binding individual listeners — O(n) listeners becomes O(1).

---

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

```bash
# Clone
git clone https://github.com/ShivShah018/StudyFlow.git
cd StudyFlow

# Open directly
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux

# Or serve locally (recommended for Notification API)
python -m http.server 8000
# → http://localhost:8000
```

---

## Usage Guide

1. **Dashboard** — Landing page with task stats, quick actions, and productivity ring
2. **Tasks** — Click **Add Task** (or `+` button) to create a task with title, priority, category, estimated duration, and due date
3. **Calendar** — Navigate months with `<` `>` arrows; click any date to see tasks due that day
4. **Pomodoro** — Set total/focus/break durations, click **Start** (triggers Notification permission request)
5. **Planner** — Click **Regenerate** to auto-schedule pending tasks into daily study blocks; click the checkmark to mark a session complete
6. **Notifications** — Click the bell icon in the sidebar to configure which notification types you receive

**Pro tip:** Press `` Ctrl + K `` anywhere to focus the global search bar.

---

## What I Learned

- **SPA architecture without a framework** — Building routing, view management, and cross-module synchronisation in vanilla JS
- **CSS custom properties for design systems** — Creating 30+ design tokens for consistent theming
- **localStorage as a data layer** — Wrapping async-like reads with try/catch for resilience
- **Greedy algorithms in practice** — Implementing a first-fit scheduler with real-world constraints (working hours, breaks, deadlines)
- **Browser Notification API** — Permission lifecycle, scheduling, preference management
- **SVG manipulation** — Animated progress rings using stroke properties
- **Event delegation** — Reducing listener count from N to 1 using `Element.closest()`

---

## Future Scope

- [ ] **Drag-and-drop re-scheduling** — Drag planner sessions to different time slots
- [ ] **Import/export** — JSON backup and restore
- [ ] **Dark/light theme toggle** — All CSS variables are in place; needs a switcher UI
- [ ] **PWA support** — Service worker + manifest for offline access and installability
- [ ] **Cloud sync** — Optional Firebase or REST API sync across devices

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

## Connect

**Shiv Shah** — 4th Year Undergraduate  
[GitHub](https://github.com/ShivShah018) · [LinkedIn](https://www.linkedin.com/in/shiv-shah-8a175a351/)

---

*Built with vanilla JavaScript, CSS, and HTML — no frameworks, no shortcuts.*
