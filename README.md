# StudyFlow — Smart Student Productivity Suite

A single-page productivity application built with **vanilla JavaScript, CSS, and HTML** — no frameworks, no build tools, no dependencies.

## Architecture

```
StudyFlow/
├── index.html          # SPA shell with sidebar navigation
├── css/
│   ├── style.css       # Design tokens, layout, components, modals
│   ├── dashboard.css   # Dashboard-specific styles
│   ├── tasks.css       # Task list & filter styles
│   ├── calendar.css    # Calendar grid styles
│   └── responsive.css  # Mobile/tablet breakpoints
├── js/
│   ├── utils.js        # Shared helpers (dates, toast, debounce, etc.)
│   ├── storage.js      # Centralised localStorage CRUD
│   ├── notifications.js# Browser Notification API + settings modal
│   ├── taskManager.js  # Task CRUD, filtering, sorting, search
│   ├── dashboard.js    # Dashboard stats, quick actions, productivity ring
│   ├── calendar.js     # Month calendar view with task dots
│   ├── pomodoro.js     # Timer with configurable focus/break cycles
│   ├── studyPlanner.js # Auto-generated study schedule from tasks
│   └── app.js          # Bootstrap, navigation, global search, clock
└── .gitignore
```

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Revealing Module Pattern** | Each JS file is an IIFE returning a public API — clean encapsulation, no global scope pollution |
| **localStorage persistence** | Zero backend — student data stays private on-device, no server setup needed |
| **No frameworks** | Vanilla JS keeps the bundle small (~700 LOC JS, ~300 LOC CSS), no build step, instant load |
| **CSS custom properties** | All colours, spacing, shadows, radii centralised in `:root` — themable by changing a single file |
| **Inline SVGs** | No icon library dependency; every icon is a tiny inline SVG for zero network requests |
| **Module independence** | Each module can be initialised separately; `typeof` guards allow graceful degradation |

## Interview Talking Points

- **SPA routing in <50 lines** — `App.navigate()` manages page transitions without a router library
- **Reactive-like patterns in vanilla JS** — Task CRUD triggers `refreshRelatedViews()` to keep Dashboard, Calendar, and Planner in sync
- **Auto-scheduling algorithm** — `StudyPlanner` distributes estimated study minutes across available days using a greedy first-fit slot allocator
- **Streak calculation** — `Notifications.calculateStreak()` determines consecutive study days from completed session dates
- **Debounced search** — Global search uses `Utils.debounce()` to avoid re-render on every keystroke

## Running the App

No build step. Open `index.html` in any modern browser.

```bash
# Or serve locally (Python example)
python -m http.server 8000
```

## Browser Support

Modern Chrome, Firefox, Safari, Edge. Requires `Notification` API and `localStorage`.
