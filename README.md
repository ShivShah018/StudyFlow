# StudyFlow — Smart Student Productivity Suite

![Vanilla JS](https://img.shields.io/badge/vanilla-js-f7df1e?logo=javascript&labelColor=333)
![CSS3](https://img.shields.io/badge/css-custom--props-1572b6?logo=css3&labelColor=333)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-complete-brightgreen)

> A single-page productivity application for students — built with **zero dependencies, zero build tools, and zero frameworks**.  
> Full-featured task management, calendar view, Pomodoro timer, and auto-scheduling in under **700 lines of vanilla JavaScript**.

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Module Breakdown](#module-breakdown)
- [Key Implementation Highlights](#key-implementation-highlights)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [What I Learned](#what-i-learned)
- [Future Scope](#future-scope)
- [Connect](#connect)

---

## Features

| Feature | Description |
|---------|-------------|
| **Task Manager** | Create, edit, delete, and filter tasks by priority, category, and due date |
| **Dashboard** | Stats summary, quick actions, productivity ring chart, recent tasks feed |
| **Calendar View** | Month grid with task dots, date selection, per-day task breakdown |
| **Pomodoro Timer** | Configurable focus/break cycles with SVG ring animations and notification support |
| **Study Planner** | Auto-generates a day-by-day study schedule from task deadlines and estimated durations |
| **Global Search** | Debounced cross-page search with keyboard shortcut (`Ctrl + K`) |
| **Streak Tracking** | Consecutive-day study streak calculated from completed planner sessions |
| **Notification System** | Browser Notification API integration with granular preference toggles |
| **Responsive Design** | Works on desktop, tablet, and mobile with collapsible sidebar |
| **Persistent Storage** | All data saved to `localStorage` — zero backend, zero setup |

---

## Screenshots

> *Add screenshots here to showcase the UI. Suggested captures:*
> 1. **Dashboard** — stats cards, productivity ring, quick actions
> 2. **Tasks** — filtered task list with progress bar
> 3. **Calendar** — month grid with selected date's tasks
> 4. **Pomodoro** — timer running with SVG rings
> 5. **Planner** — auto-generated daily schedule

---

## Architecture

### Project Structure

```
StudyFlow/
│
├── index.html               # SPA shell, sidebar navigation, inline pomodoro template
│
├── css/
│   ├── style.css            # Design tokens, layout, buttons, cards, modals, toasts
│   ├── dashboard.css        # Dashboard-specific layout and components
│   ├── tasks.css            # Task list, filters, progress bar
│   ├── calendar.css         # Calendar grid and day-cell styles
│   └── responsive.css       # Breakpoints at 1024px, 768px, 480px
│
├── js/
│   ├── utils.js             # Shared helpers: ID generation, date formatting, toast, debounce
│   ├── storage.js           # localStorage CRUD for tasks, planner, and settings
│   ├── notifications.js     # Browser Notification API, settings modal, streak calculator
│   ├── taskManager.js       # Task CRUD, filtering, sorting, pagination, search
│   ├── dashboard.js         # Dashboard rendering, stats, productivity ring
│   ├── calendar.js          # Month calendar generation, date selection
│   ├── pomodoro.js          # Timer state machine, SVG ring animations
│   ├── studyPlanner.js      # Greedy scheduling algorithm, session management
│   └── app.js               # Application bootstrap, SPA navigation, global events
│
├── .gitignore
└── README.md
```

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Revealing Module Pattern** | Each file is an IIFE returning a public API — zero global pollution, clear public/private boundaries |
| **localStorage** | No backend needed; student data stays on-device; ~10ms read/write |
| **CSS Custom Properties** | Every colour, shadow, radius, and spacing in `:root` — full theme in one place |
| **Inline SVGs** | 0 KB icon dependency; every icon is hand-written SVG inline |
| **No Build Step** | Open `index.html` and go — ideal for quick demos and code review |
| **Centralised Storage** | All `localStorage` keys prefixed with `studyflow_`; single module owns all persistence |

---

## Module Breakdown

### 1. `js/app.js` — Application Shell
- Boots all modules on `DOMContentLoaded`
- Manages SPA navigation via `navigate(page)` — swaps `.active` class on pages and nav items
- Global search with `Ctrl + K` keyboard shortcut
- Live clock in the top bar (updates every second)
- Mobile sidebar toggle with overlay

### 2. `js/taskManager.js` — Task CRUD Engine
- Filter pipeline: search text → priority → category → sort (due date / title / priority)
- Progress bar showing `completed / total` percentage
- Modal-based create/edit form with validation
- On task change, calls `refreshRelatedViews()` to sync Dashboard, Calendar, and Planner

### 3. `js/dashboard.js` — Overview Hub
- Greeting + date display
- 4 stat cards: Total Tasks, Completed, Pending, Productivity %
- Quick action buttons routing to other pages
- Recent pending tasks list with one-click toggle
- SVG productivity ring chart (stroke-dasharray/dashoffset)

### 4. `js/calendar.js` — Month Calendar
- Dynamic grid generation for any month/year
- Previous/next month navigation with boundary wrapping
- Task dots on dates with due tasks
- Selected date highlighting with per-day task listing

### 5. `js/pomodoro.js` — Timer State Machine
- States: `Ready → Running → Paused → Running → Break → ...`
- Focus/break cycle counting with elapsed-time tracking
- Dual SVG rings: outer for total progress, inner for phase progress
- Button visibility toggles based on state
- Persists settings to `localStorage`

### 6. `js/studyPlanner.js` — Auto-Scheduler
- Greedy first-fit algorithm distributing estimated study minutes across available days
- Respects working hours (8:00–22:00) with 10-minute break gaps
- Merges new sessions with existing completed sessions
- Drag-and-drop support on session cards
- Streak calculation via `Notifications.calculateStreak()`

### 7. `js/notifications.js` — Browser Notification Layer
- Permission request on first interaction
- Granular toggle settings (deadlines, study sessions, pomodoro, motivation, daily summary)
- Settings modal rendered dynamically
- Hourly check for daily motivation quote at 8 AM
- Streak calculator: walks sorted completed dates backwards from today

### 8. `js/storage.js` — Data Layer
- All `localStorage` interaction in one place
- `studyflow_tasks`, `studyflow_planner_schedule`, `studyflow_planner_completed_dates`, `studyflow_notif_settings`, `studyflow_notif_permission`, `studyflow_pomodoro_settings`
- Try/catch wrappers for corrupt data resilience

### 9. `js/utils.js` — Shared Utilities
- `generateId()` — timestamp + random suffix
- `formatDateShort()` / `daysUntil()` — date display helpers
- `showToast()` — animated toast notification system
- `debounce()` — search input debouncing
- `escapeHTML()` — XSS-safe string interpolation

---

## Key Implementation Highlights

### Auto-Scheduling Algorithm (`studyPlanner.js`)

```js
// Greedy first-fit: distributes estimated study minutes
// across remaining days before each task's deadline
tasks.forEach(task => {
  const daysUntilDue = Math.ceil((due - today) / MS_PER_DAY);
  const perDay = Math.min(Math.ceil(totalMin / daysUntilDue), totalMin);
  // For each day, find earliest free slot respecting working hours
  // and existing sessions, then allocate blocks of up to 50 min
});
```

**Why this is interesting:** Manual time-blocking is tedious for students. This algorithm automatically distributes workload evenly, respects daily working hours, and leaves breaks between sessions — similar to how Google Calendar's "Goals" feature works.

### Reactive Data Flow

When a task is added, toggled, or deleted, the change propagates:

```
TaskManager → refreshRelatedViews()
                ├── Dashboard.render()   (updates stats)
                ├── Calendar.render()    (updates task dots)
                └── StudyPlanner.generateSchedule() (regenerates plan)
```

This pattern mimics a lightweight pub/sub system without any framework.

### 0-Dependency SVG Charts

The productivity ring and Pomodoro rings use pure SVG `stroke-dasharray` / `stroke-dashoffset`:

```js
const circumference = 2 * Math.PI * 38;
const offset = circumference - (pct / 100) * circumference;
// Set as SVG circle attributes
ring.setAttribute('stroke-dasharray', circumference);
ring.setAttribute('stroke-dashoffset', offset);
```

No charting library, no canvas, no image assets.

### Streak Calculation

The streak calculator walks sorted completed dates backwards from today, counting consecutive days:

```js
let checkDate = new Date(today);
for (const dateStr of sorted) {
  const d = new Date(dateStr + 'T12:00:00');
  if (d.getTime() === checkDate.getTime()) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else if (d.getTime() < checkDate.getTime()) break;
}
```

---

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- No server, no build tools, no package manager required

### Installation

```bash
# Clone the repository
git clone https://github.com/ShivShah018/StudyFlow.git

# Open directly
cd StudyFlow
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux

# Or serve with a local HTTP server (recommended for Notification API)
python -m http.server 8000
# Then visit http://localhost:8000
```

---

## Usage Guide

1. **Dashboard** — Landing page shows an overview of your tasks and productivity stats
2. **Tasks** — Click **Add Task** to create a task with title, description, priority, category, estimated duration, and due date
3. **Calendar** — Navigate months, click any date to see tasks due that day
4. **Pomodoro** — Configure total study time, focus duration, and break duration, then click **Start**
5. **Planner** — Click **Regenerate** to auto-schedule your tasks into daily study sessions; click sessions to mark them complete
6. **Notifications** — Click the bell icon in the sidebar to configure notification preferences

**Pro tip:** Press `Ctrl + K` anywhere to focus the global search bar.

---

## What I Learned

- **SPA architecture without a framework** — Handling routing, view management, and data synchronization in pure vanilla JS
- **CSS custom properties for theming** — Building a consistent design system with 30+ design tokens
- **localStorage as a persistence layer** — Designing a wrapper module with error handling for a simple but effective data store
- **Greedy algorithms in practice** — Implementing a first-fit scheduling algorithm that respects real-world constraints
- **Browser Notification API** — Requesting permissions, scheduling recurring notifications, and building a preference UI
- **SVG manipulation via JavaScript** — Creating animated progress rings using stroke properties
- **Module pattern for encapsulation** — Separating concerns across 9 modules without any build-time module system

---

## Future Scope

- [ ] **Drag-and-drop calendar** — Re-schedule tasks by dragging them to different dates
- [ ] **Export/import** — Backup and restore data as JSON files
- [ ] **Dark/light theme toggle** — Already supported via CSS custom properties, just needs a switcher
- [ ] **PWA support** — Service worker for offline access and installability
- [ ] **Sync across devices** — Optional cloud sync (Firebase or a simple REST API)

---

## Connect

**Shiv Shah** — 4th Year Student  
[GitHub](https://github.com/ShivShah018) | [LinkedIn](https://www.linkedin.com/in/shiv-shah-8a175a351/)

---

*Built with vanilla JavaScript, CSS, and HTML — no frameworks, no shortcuts.*
