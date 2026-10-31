# StudyFlow — AI-Powered Academic Intelligence & Productivity Platform

![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6-f7df1e?logo=javascript&labelColor=333)
![Python](https://img.shields.io/badge/Python-3.10%2B-3776ab?logo=python&labelColor=333)
![Scikit-Learn](https://img.shields.io/badge/scikit--learn-ML_Pipeline-f7931e?logo=scikit-learn&labelColor=333)
![CSS3](https://img.shields.io/badge/CSS-Custom_Properties-1572b6?logo=css3&labelColor=333)
![HTML5](https://img.shields.io/badge/HTML5-SPA-e34f26?logo=html5&labelColor=333)
![PWA](https://img.shields.io/badge/PWA-Offline_Ready-5A0FC8?logo=pwa&labelColor=333)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-2.0.0-blue)

> A client-side, privacy-first Academic Intelligence and Productivity Platform engineered with **Vanilla ES6 JavaScript, HTML5, CSS3, and an end-to-end Python Scikit-Learn Data Science & Machine Learning Pipeline**.  
> Features predictive task risk analytics, conflict-free intelligent scheduling, timestamp-based focus auditing, bilingual English + Hinglish voice interaction, local document search, and 100% offline PWA reliability.

[Live Demo](https://shivshah018.github.io/StudyFlow) · [Report Bug](https://github.com/ShivShah018/StudyFlow/issues) · [Request Feature](https://github.com/ShivShah018/StudyFlow/issues)

---

## Table of Contents

- [Overview & Architectural Philosophy](#overview--architectural-philosophy)
- [Key Upgrades & Features](#key-upgrades--features)
  - [1. Machine Learning & Predictive Analytics](#1-machine-learning--predictive-analytics)
  - [2. Timetable & Conflict-Free Study Planner](#2-timetable--conflict-free-study-planner)
  - [3. Focus Auditing & Epoch-Based Pomodoro](#3-focus-auditing--epoch-based-pomodoro)
  - [4. Task Management Upgrades](#4-task-management-upgrades)
  - [5. Bilingual Voice Assistant (English + Hinglish)](#5-bilingual-voice-assistant-english--hinglish)
  - [6. Academic Document Intelligence](#6-academic-document-intelligence)
  - [7. Spaced Revision System](#7-spaced-revision-system)
  - [8. Safe Data Migration & JSON Backup](#8-safe-data-migration--json-backup)
- [Data Science Experiment Pipeline](#data-science-experiment-pipeline)
  - [Dataset & Problem Formulations](#dataset--problem-formulations)
  - [Model Benchmarks & Metrics](#model-benchmarks--metrics)
  - [Client-Side Browser Inference](#client-side-browser-inference)
- [Architecture & Script Dependency Graph](#architecture--script-dependency-graph)
- [Data Storage Schema](#data-storage-schema)
- [Getting Started & Local Reproduction](#getting-started--local-reproduction)
  - [Running the Web Application](#running-the-web-application)
  - [Reproducing the Python Data Science Pipeline](#reproducing-the-python-data-science-pipeline)
  - [Running Automated Verification Tests](#running-automated-verification-tests)
- [Resume Representations (SDE vs. Data Science / AI-ML)](#resume-representations-sde-vs-data-science--ai-ml)
- [License](#license)

---

## Overview & Architectural Philosophy

StudyFlow transforms traditional fragmented student tooling into a unified, privacy-first academic intelligence suite.

### Strict Architectural Principles
1. **Zero External Frontend Frameworks:** Built in modular Vanilla JavaScript (ES6 Revealing Module Pattern), HTML5, and CSS3 without React, Next.js, or bundlers.
2. **Local-First & Privacy-Preserving:** 100% of student tasks, timetable schedules, documents, and focus records reside in browser `localStorage`. No mandatory logins or tracking servers.
3. **Reproducible Machine Learning:** Predictive models are trained with rigorous validation on a reproducible Python `scikit-learn` pipeline. Model weights are serialized into JavaScript constants (`js/mlModelsData.js`) for sub-millisecond, zero-latency browser inference with zero API key leaks.
4. **Resilient Offline Execution:** Service Worker v2 caches all assets for complete offline availability. Native browser Web Speech API provides accessible voice interactions.

---

## Key Upgrades & Features

### 1. Machine Learning & Predictive Analytics
- **Task Completion Probability Classifier:** Evaluates deadline proximity, priority, estimated duration, historical study velocity, and subject difficulty using an L2-regularized Logistic Regression model ($ROC-AUC = 0.887$). Flags high-risk tasks with real-time probability badges.
- **Completion Duration Regressor:** Predicts actual task duration using a Ridge Regression model ($R^2 = 0.854$, $MAE = 10.35$ mins), preventing optimistic underestimation of study workloads.
- **Subject Vulnerability & Risk Matrix:** Computes academic risk index per subject based on pending load, overdue counts, and study velocity.
- **Explainable Recommendation Engine:** Recommends "What should I study next?" with clear, rule-grounded rationales (e.g., *"Urgent deadline in 14h, high preparation risk"*).
- **Study Trend Visualizer:** Dynamic SVG 7-day focus trend bar charts reflecting daily focus minutes.

### 2. Timetable & Conflict-Free Study Planner
- **Weekly Class Timetable:** Recurring class and lab schedule manager spanning Monday through Sunday ($08:00 - 20:00$).
- **Time-Aware Slot Allocation:** Planner checks `Date.now()` on the current day rather than naively scheduling in past morning hours.
- **Collision Detection:** Intersects study sessions with `Timetable.getBusyIntervals(dateStr)`, preventing study sessions from being scheduled during lecture hours.
- **Explainable Session Badges:** Each scheduled study block displays an explicit rationale tag (*"High Priority"*, *"Approaching Deadline"*, *"Overdue Catch-up"*).

### 3. Focus Auditing & Epoch-Based Pomodoro
- **Epoch Timestamp Math:** Replaced drift-prone `setInterval` counters with delta calculations:
  $$\Delta t = \text{targetEndTime} - \text{Date.now()}$$
- **Background Tab Throttling Recovery:** Listens to `document.visibilitychange` to recalculate remaining time instantly when returning to the tab.
- **State Persistence:** Saves active countdown timestamps in `studyflow_active_timer`, seamlessly resuming countdowns after page reloads.
- **Immutable Focus Session Logging:** Records completed sessions with timestamps, durations, subjects, and linked task IDs to `studyflow_focus_history`.
- **Focus Audit Bar:** Displays today's study tally, weekly aggregate hours, and completed session count.

### 4. Task Management Upgrades
- **Interactive Subtask Checklists:** Create and toggle subtasks per task with real-time progress indicators (e.g., `2/3 (67%)`).
- **Recurring Tasks Engine:** Configurable recurrence cadence (`daily`, `weekly`, `weekdays`). Completing a recurring task automatically spawns the next occurrence calculated from its interval.
- **Overdue Task Triage Banner:** Automatically surfaces overdue items with one-tap batch reschedule options (*"Reschedule for Today"* or *"+2 Days"*).
- **Status Filtering:** Instantly filter tasks by `All`, `Active`, or `Completed`.

### 5. Bilingual Voice Assistant (English + Hinglish)
- **Natural Language & Transliteration Parser:** Understands English and Hinglish voice commands (e.g., *"Dashboard kholo"*, *"Kal ke liye DBMS assignment add karo"*, *"Pomodoro start karo"*, *"Is week kitne ghante padha?"*).
- **Acoustic Speech Recognition:** Employs native `webkitSpeechRecognition` / `SpeechRecognition` configured with `en-IN` acoustic models for accurate Indian English and Hinglish transcription.
- **Safety Confirmations:** Disambiguates date references (such as *"kal"* to tomorrow's date) and opens pre-filled confirmation modals before creating tasks, preventing accidental writes.
- **Speech Synthesis:** Responds verbally using `window.speechSynthesis` with speech garbage-collection mitigations and an instant mute toggle.
- **Keyboard Shortcut:** Toggle assistant anytime using the `V` key or close with `Escape`.

### 6. Academic Document Intelligence
- **Local Client-Side Ingestion:** Upload `.txt`, `.md`, `.json`, `.csv`, `.py`, or `.js` course notes and syllabus documents.
- **Sliding-Window Chunking:** Partitions text into ~180-word passages with 30-word overlaps, preserving sentence boundaries and metadata.
- **BM25-Style Keyword Retrieval:** Searches across indexed chunks using term-frequency and document-length normalization, returning relevant excerpts with source line citations.
- **Automated Definition & Quiz Extraction:** Extracts definitions matching academic patterns for instant flashcard review.
- **RAG Architecture Blueprint:** Clear architectural extension point documented for embedding-based dense retrieval when connecting to an optional backend LLM.

### 7. Spaced Revision System
- **Ebbinghaus Spaced Repetition:** Automates multi-stage revision schedules based on intervals (+1 day, +3 days, +7 days, +14 days, +30 days).
- **Syllabus Topic Tracking:** Track completion percentage and upcoming revision milestones across all academic courses.

### 8. Safe Data Migration & JSON Backup
- **Automatic Snapshot Protection:** Automatically captures a backup snapshot (`studyflow_auto_snapshot_v1`) before schema updates.
- **JSON Export & Import:** Full workspace data export and import with strict schema validation and interactive preview modal before applying changes.

---

## Data Science Experiment Pipeline

The machine learning suite is housed in the `data_science/` directory, following reproducible industry standards.

```
data_science/
├── generate_dataset.py       # Parametric academic dataset generator (3,500 samples)
├── academic_study_dataset.csv # Generated dataset across 9 engineered features
├── train_models.py           # Scikit-learn training, stratified 80/20 split, evaluation
├── evaluation_metrics.json   # Benchmark metrics comparing baselines & models
└── README.md                 # Full Data Science documentation
```

### Dataset & Problem Formulations

#### 1. Task Completion Probability (Binary Classification)
- **Problem Formulation:** Predict whether an academic task will be completed before its due date ($y \in \{0, 1\}$).
- **Engineered Features ($X$):**
  1. `hours_to_deadline`: Continuous hours until due date.
  2. `estimated_duration_min`: Estimated effort in minutes.
  3. `priority_weight`: Priority scale (`low: 1`, `medium: 2`, `high: 3`, `urgent: 4`).
  4. `historical_completion_rate`: Student's historical rolling completion rate $[0.0, 1.0]$.
  5. `daily_study_velocity_min`: Average focus minutes logged per day.
  6. `subject_difficulty_index`: Calibrated difficulty per subject $[1.0, 5.0]$.
  7. `subtask_count`: Number of checklist subtasks.
  8. `concurrent_task_load`: Number of overlapping pending assignments.
  9. `day_of_week`: Day index $(0 - 6)$.

#### 2. Actual Completion Duration (Continuous Regression)
- **Problem Formulation:** Predict actual execution time in minutes ($\hat{y} \in \mathbb{R}^+$) to counteract student planning fallacies.

### Model Benchmarks & Metrics

Evaluated on an 80/20 train/test split (2,800 train, 700 holdout test samples):

| Task | Baseline Model | Trained Model | Metric | Baseline Score | Trained Model Score | Improvement |
|---|---|---|---|---|---|---|
| **Completion Risk** | Majority Class Classifier | **Logistic Regression (L2)** | **ROC-AUC** | 0.500 | **0.887** | **+77.4%** |
| | | Random Forest | ROC-AUC | 0.500 | 0.881 | +76.2% |
| | | **Logistic Regression (L2)** | **F1-Score** | 0.000 | **0.812** | **+81.2%** |
| **Actual Duration** | Mean Duration Baseline | **Ridge Regression** | **$R^2$ Score** | 0.000 | **0.854** | **+85.4%** |
| | | Gradient Boosting | $R^2$ Score | 0.000 | 0.849 | +84.9% |
| | | **Ridge Regression** | **MAE** | 25.86 min | **10.35 min** | **-59.9% error** |

### Client-Side Browser Inference

Model coefficients, intercepts, and feature standard scaler parameters (`mean`, `scale`) are exported to `js/mlModelsData.js`. The browser computes vector dot products in pure JavaScript in `< 1ms`:

$$\hat{z} = w_0 + \sum_{i=1}^n w_i \left(\frac{x_i - \mu_i}{\sigma_i}\right), \quad P(\text{completion}) = \frac{1}{1 + e^{-\hat{z}}}$$

$$\widehat{\text{Duration}} = \beta_0 + \sum_{i=1}^n \beta_i \left(\frac{x_i - \mu_i}{\sigma_i}\right)$$

---

## Architecture & Script Dependency Graph

All modules follow the ES6 Revealing Module Pattern and are loaded asynchronously in dependency-ordered sequence:

```
index.html
  ├── js/utils.js                 (Formatting, Toast, Sanitization, Date math)
  ├── js/storage.js               (LocalStorage CRUD, Auto-snapshot, JSON Export/Import)
  ├── js/notifications.js         (Web Notifications & Web Audio synthesis)
  ├── js/taskManager.js           (Task CRUD, Subtask checklists, Recurring tasks, Triage)
  ├── js/dashboard.js             (Workload stats, Ring chart, Subject analytics)
  ├── js/calendar.js              (Monthly grid, Day task indicators)
  ├── js/pomodoro.js              (Epoch-based timer, Visibility sync, Focus history)
  ├── js/timetable.js             (Weekly class timetable, Collision queries, Spaced revision)
  ├── js/studyPlanner.js          (Time-aware, collision-free slot allocator)
  ├── js/mlModelsData.js          (Pre-trained ML weights, scalers, and evaluation metrics)
  ├── js/mlAnalytics.js           (Real-time ML risk inference, Subject risk, SVG trend charts)
  ├── js/voiceSpeech.js           (Web Speech recognition & synthesis adapter)
  ├── js/voiceParser.js           (Bilingual English + Hinglish intent classification)
  ├── js/voiceHandler.js          (Voice assistant UI, Waveform animation, Modal triggers)
  ├── js/documentIntelligence.js  (Document chunking, BM25 keyword search, Flashcard quizzes)
  ├── js/backupService.js         (JSON backup UI, Validation preview, Schema restoration)
  └── js/app.js                   (Application bootstrap, Routing, Global shortcuts)
```

---

## Data Storage Schema

All persistent keys are namespaced with `studyflow_`:

| Key | Type | Description |
|---|---|---|
| `studyflow_tasks` | `Array<Task>` | Tasks with subtasks, recurring cadence, and duration metrics |
| `studyflow_timetable` | `Array<TimetableItem>` | Recurring class and lab schedule entries |
| `studyflow_focus_history` | `Array<FocusSession>` | Immutable timestamped focus sessions with subjects and task IDs |
| `studyflow_active_timer` | `Object` | Active Pomodoro state for reload resilience |
| `studyflow_syllabus_topics`| `Array<Topic>` | Syllabus tracking and spaced revision review logs |
| `studyflow_documents` | `Array<Document>` | Uploaded notes, text chunks, and search index |
| `studyflow_planner_schedule`| `Object` | Generated collision-free daily study blocks |
| `studyflow_auto_snapshot_v1`| `Object` | Emergency rollback snapshot taken prior to schema migration |
| `studyflow_theme` | `'dark' \| 'light'` | Theme preference |
| `studyflow_student_name` | `String` | Student display profile name |

---

## Getting Started & Local Reproduction

### Running the Web Application
No build tools, Node modules, or package installations are required.

```bash
# Clone the repository
git clone https://github.com/ShivShah018/StudyFlow.git
cd StudyFlow

# Serve using any static HTTP server (recommended for Service Worker & Web Speech API)
python -m http.server 8000
# Open http://localhost:8000 in Google Chrome or Edge
```

> **Note on Voice Assistant:** Chrome and Edge utilize the native `en-IN` Web Speech API. For local microphone access, serve via `http://localhost:8000` or an HTTPS origin.

### Reproducing the Python Data Science Pipeline
To regenerate the synthetic academic dataset and retrain the machine learning models:

```bash
# Navigate to the data science directory
cd data_science

# Install required dependencies
pip install scikit-learn pandas numpy

# Step 1: Generate synthetic academic dataset (3,500 samples)
python generate_dataset.py

# Step 2: Train models, benchmark against baselines, and output evaluation metrics
python train_models.py
```

### Running Automated Verification Tests
StudyFlow includes automated unit and integration tests verifying the core engine, storage migrations, collision intervals, ML inference, and voice parser:

```bash
# Run unit and integration tests from repository root
node tests/run_tests.js
```
*Output: 23 passing tests covering Storage CRUD, Safe Migration, Logistic Regression inference, Ridge Regression duration prediction, Timetable collision detection, Bilingual Voice Parser, and BM25 Document search.*

---

## Resume Representations (SDE vs. Data Science / AI-ML)

### 1. Software Development Engineer (SDE) Resume Representation
> **StudyFlow — AI-Powered Academic Intelligence & Productivity Platform** | *Vanilla JavaScript (ES6), HTML5, CSS3, Web APIs, Service Worker, PWA*
> - Engineered a zero-dependency, local-first academic platform in modular Vanilla ES6 JavaScript (Revealing Module Pattern), managing 8 persistent data stores with automated rollback snapshotting and zero data-loss migration.
> - Formulated a time-aware, conflict-free greedy study scheduling engine integrated with recurring weekly timetable collision detection, preventing study overlaps during lecture hours.
> - Implemented an epoch timestamp-delta Pomodoro focus engine with `document.visibilitychange` background tab throttling recovery and immutable session audit logging.
> - Integrated bilingual English + Hinglish voice control using browser `SpeechRecognition` (`en-IN`) and `SpeechSynthesis` with entity extraction, confirmation modals, and keyboard accessibility.
> - Configured Service Worker v2 PWA caching for 100% offline functionality and sub-50ms initial load times.

---

### 2. Data Scientist / Machine Learning Engineer Resume Representation
> **StudyFlow — Academic Intelligence & Predictive Analytics Engine** | *Python, Scikit-Learn, Pandas, NumPy, Client-Side ML Inference, NLP*
> - Formulated an end-to-end academic risk prediction engine using a 3,500-sample dataset across 9 engineered features (deadline proximity, study velocity, subject difficulty, concurrent load).
> - Trained and validated an L2 Logistic Regression task completion classifier (**0.887 ROC-AUC**, **0.812 F1-score**) and a Ridge Regression duration predictor (**$R^2 = 0.854$**, **$MAE = 10.35$ min**), outperforming baseline heuristics by 77.4% and reducing duration estimation error by 59.9%.
> - Serialized model coefficients and standard scaler parameters into client-side JavaScript for zero-latency, private, sub-millisecond browser inference with zero cloud dependency or credential leakage.
> - Developed an explainable study recommendation engine generating prioritized task advice based on academic risk index and deadline vulnerability.
> - Built a client-side document intelligence module featuring sliding-window chunking (~180 words, 30-word overlap), BM25-style keyword search, and regex definition extraction for automated revision quizzes.

---

## License

Distributed under the MIT License. See `LICENSE` for details.
