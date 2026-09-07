# StudyFlow — Smart Student Productivity Suite

![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6-f7df1e?logo=javascript&labelColor=333)
![CSS3](https://img.shields.io/badge/CSS-Custom_Properties-1572b6?logo=css3&labelColor=333)
![HTML5](https://img.shields.io/badge/HTML5-SPA-e34f26?logo=html5&labelColor=333)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-complete-brightgreen)

> A lightweight, student-focused productivity single-page web application — built with **zero external dependencies, zero build tools, and zero frameworks**.  
> Persists data locally, supports offline use via Service Worker, and provides intelligent workload auto-scheduling.

[Live Demo](https://shivshah018.github.io/StudyFlow) · [Report Bug](https://github.com/ShivShah018/StudyFlow/issues) · [Request Feature](https://github.com/ShivShah018/StudyFlow/issues)

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [UX Design Process](#ux-design-process)
- [Tech Stack](#tech-stack)
- [Architecture & Design Patterns](#architecture--design-patterns)
- [Data Storage Schema](#data-storage-schema)
- [Getting Started](#getting-started)
- [Key Learning Outcomes](#key-learning-outcomes)
- [Resume Representations (SDE vs. UI/UX)](#resume-representations-sde-vs-uiux)
- [License](#license)

---

## Problem Statement

College students frequently struggle with managing assignments, exam preparations, and project deadlines scattered across multiple course portals. Traditional project management software (Notion, Jira, Trello) is often over-engineered for personal study planning, causing administrative fatigue.

**StudyFlow** solves this problem by providing a streamlined, privacy-first study planner that:
1. Gives immediate visibility into today's tasks and upcoming deadlines.
2. Auto-schedules study sessions based on task due dates and estimated effort.
3. Facilitates deep focus via an integrated task-linked Pomodoro timer.
4. Requires zero account sign-up, zero server setups, and operates completely offline.

---

## Key Features

| Category | Feature | Description |
|---|---|---|
| **Dashboard** | **Workload Overview** | Daily greeting, date/clock, 4 stat indicators (Total, Completed, Pending, Productivity %), Quick Actions, recent tasks list, and SVG ring chart. |
| **Analytics** | **Subject Progress Tracking** | Real-time breakdown of completion percentages and total study minutes logged per academic course (e.g., DSA, DBMS, OS). |
| **Tasks** | **Task Management** | Full CRUD for tasks with title, description, subject, priority, category, estimated duration, and due date. Includes search, priority/category filtering, and sorting. |
| **Form UX** | **Duration Presets & Validation** | Quick preset buttons (`30m`, `45m`, `60m`, `90m`, `120m`), subject autocomplete datalist, and inline form error validation. |
| **Planner** | **Greedy Auto-Scheduler** | Automatically allocates pending tasks into 50-minute study blocks with 10-minute breaks between 08:00–22:00 up to each task's deadline. |
| **Focus Timer** | **Task-Linked Pomodoro** | Configurable focus/break cycles with dual SVG countdown rings, system notifications, and direct accumulation of studied minutes into task progress. |
| **Calendar** | **Month Grid Scheduler** | Interactive calendar grid with task indicator dots on due dates and day-by-day task breakdowns. |
| **Theming** | **Dark / Light Theme Switcher** | Seamless theme toggling using CSS Custom Property design tokens while preserving sidebar contrast. |
| **Personalization** | **Student Profile & Streaks** | Custom student name configuration and consecutive-day study streak tracking calculated from completed planner sessions. |

---

## UX Design Process

StudyFlow was designed with an explicit focus on reducing cognitive load for university students.

### Target Persona
* **Primary User:** University undergraduate student managing 4–6 concurrent subjects.
* **Context:** Seeking a low-overhead productivity hub that requires minimal manual input.

### User Flows
1. **Task Capture Flow:** Dashboard → `+ New Task` → Duration Chip Selection (`60m`) → Instant Progress Update.
2. **Focus Execution Flow:** Task List → `Study This Task` → Pomodoro Timer → Automated Task Progress Accumulation.
3. **Course Balance Flow:** Dashboard Analytics → Inspect Subject Progress (e.g. DBMS at 33%) → Filter Tasks by Subject → Complete Pending Items.

### Key Design Decisions
* **Duration Chips:** Solved keyboard input friction on mobile by providing one-tap duration selections.
* **Subject Analytics:** Prevented course imbalance by visually highlighting neglected subjects on the main dashboard.
* **Persistent Sidebar Anchor:** Kept sidebar dark `#0f172a` in both Light and Dark modes to maintain visual hierarchy and brand consistency.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Core** | HTML5 (Semantic SPA Structure), Vanilla JavaScript (ES6 Modules) |
| **Styling** | Vanilla CSS3 (CSS Custom Properties, Glassmorphism, Responsive Grid/Flexbox) |
| **Persistence** | Browser `localStorage` API |
| **Audio & Alerts** | Web Notifications API, Web Audio API (Synthesized Beep Alerts) |
| **Graphics** | SVG Circles (`stroke-dasharray` / `stroke-dashoffset` ring charts) |
| **Offline** | Service Worker (`sw.js`) PWA caching |
| **Dependencies** | **Zero (0)** external frameworks, libraries, or build tools |

---

## Architecture & Design Patterns

### Revealing Module Pattern (IIFE)
Each module is encapsulated in an Immediately Invoked Function Expression (IIFE), exposing only public methods:

```
app.js (Bootstrap & Router)
 ├── utils.js         (Formatting, Toast, Debounce, Escape HTML)
 ├── storage.js       (Centralized LocalStorage CRUD & Student Profile)
 ├── notifications.js (Web Notifications & Audio Synthesis)
 ├── taskManager.js   (Task CRUD, Filtering, Form Modal with Presets)
 ├── dashboard.js     (Workload Stats, Ring Chart, Subject Analytics)
 ├── calendar.js      (Monthly Grid, Task Due Date Indicators)
 ├── pomodoro.js      (Timer State Machine, Active Task Sync)
 └── studyPlanner.js  (Greedy Slot Allocation Scheduling Engine)
```

### Auto-Scheduling Logic (`studyPlanner.js`)
Distributes task estimated minutes across days prior to deadline using a greedy first-fit bin-packing algorithm:
1. Calculates remaining days until deadline ($d$).
2. Divides total estimated minutes into daily targets.
3. Scans working hours ($08:00 - 22:00$) for free time slots, enforcing 10-minute break buffers between sessions.

---

## Data Storage Schema

All application data is namespace-prefixed with `studyflow_` in `localStorage`:

| Key | Format | Purpose |
|---|---|---|
| `studyflow_tasks` | `Array<TaskObject>` | Task details (title, subject, priority, estimatedDuration, studiedMinutes, dueDate, completed) |
| `studyflow_planner_schedule` | `{ sessions: [], generatedAt: ISO }` | Auto-generated daily study blocks |
| `studyflow_student_name` | `String` | Student profile name |
| `studyflow_theme` | `'dark' \| 'light'` | Theme preference |
| `studyflow_notif_settings` | `JSONObject` | Notification toggles & reminder timing |
| `studyflow_pomodoro_settings` | `JSONObject` | Custom total, focus, and break minutes |

---

## Getting Started

### Prerequisites
* Any modern web browser (Chrome, Firefox, Safari, Edge). Zero installation required.

### Local Setup
```bash
# Clone the repository
git clone https://github.com/ShivShah018/StudyFlow.git
cd StudyFlow

# Serve locally (Recommended for Web Notification API support)
python -m http.server 8000
# Open http://localhost:8000 in your browser
```

---

## Key Learning Outcomes

* **Modular Vanilla JS Architecture:** Implemented single-page navigation, state reactivity, and cross-module synchronization without external state management libraries.
* **Algorithmic Problem Solving:** Formulated a greedy bin-packing scheduler with real-world time-window constraints.
* **Design Systems with CSS Properties:** Structured 30+ design tokens enabling seamless light/dark theme switching and visual consistency.
* **Browser API Master:** Utilized `localStorage`, Web Notifications API, Web Audio API oscillator synthesis, and Service Worker offline caching.

---

## Resume Representations (SDE vs. UI/UX)

### 1. SDE Resume Version
> **StudyFlow — Smart Student Productivity Suite** | *Vanilla JS (ES6), HTML5, CSS3, Web Storage API, Service Worker*
> * Engineered a zero-dependency single-page student productivity suite in modular Vanilla ES6 JavaScript utilizing the Revealing Module Pattern.
> * Formulated a greedy first-fit auto-scheduling algorithm that partitions task workloads into 50-minute study blocks with 10-minute break buffers within configurable daily working windows.
> * Implemented task-linked Pomodoro focus tracking, real-time reactive event updates, debounced global search (`Ctrl+K`), subject progress analytics, and Web Notification API integration.
> * Built a custom CSS variable design system supporting dynamic light/dark theming and responsive layouts down to 375px viewports.

---

### 2. UI/UX Resume Version
> **StudyFlow — Student Productivity Hub (UX Case Study & Web Implementation)** | *UX Design, Wireframing, User Flows, CSS Custom Properties, Vanilla JS*
> * Designed and developed a student-centric study planner focused on reducing cognitive load and administrative setup friction for university undergraduates.
> * Mapped core user flows (Task Capture, Focus Execution, Course Balance Audit) and designed low/high-fidelity wireframe layouts optimized for academic workflows.
> * Introduced micro-interaction optimizations including one-tap duration preset chips (`30m`–`120m`) and subject progress visualizers to promote balanced course preparation.
> * Implemented dual dark/light themes tailored for late-night studying and daytime high-contrast environments while maintaining brand visual hierarchy.

---

## License

Distributed under the MIT License. See `LICENSE` for details.
