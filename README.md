# StudyFlow — AI-Powered Academic Intelligence & Productivity Platform

![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6-f7df1e?logo=javascript&labelColor=333)
![Python](https://img.shields.io/badge/Python-3.10%2B-3776ab?logo=python&labelColor=333)
![Scikit-Learn](https://img.shields.io/badge/scikit--learn-ML_Pipeline-f7931e?logo=scikit-learn&labelColor=333)
![CSS3](https://img.shields.io/badge/CSS-Custom_Properties-1572b6?logo=css3&labelColor=333)
![HTML5](https://img.shields.io/badge/HTML5-SPA-e34f26?logo=html5&labelColor=333)
![PWA](https://img.shields.io/badge/PWA-Offline_Ready-5A0FC8?logo=pwa&labelColor=333)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-2.0.0-blue)

> A client-side, privacy-first Academic Intelligence and Productivity Platform engineered with **Vanilla ES6 JavaScript, HTML5, CSS3, and a reproducible Python Scikit-Learn Data Science & Machine Learning Pipeline**.  
> Features predictive task risk modeling, conflict-free intelligent scheduling, timestamp-based focus auditing, bilingual English + Hinglish voice interaction, local BM25 document search, and 100% offline PWA reliability.

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
  - [6. Academic Document Intelligence (BM25 Search)](#6-academic-document-intelligence-bm25-search)
  - [7. Spaced Revision System](#7-spaced-revision-system)
  - [8. Safe Data Migration & JSON Backup](#8-safe-data-migration--json-backup)
- [Data Science Experiment Pipeline](#data-science-experiment-pipeline)
  - [Dataset & Problem Formulations](#dataset--problem-formulations)
  - [Model Benchmarks & Metrics](#model-benchmarks--metrics)
  - [Client-Side Browser Inference & Parity](#client-side-browser-inference--parity)
  - [Real-User Validation Framework](#real-user-validation-framework)
- [Architecture & Script Dependency Graph](#architecture--script-dependency-graph)
- [Data Storage Schema](#data-storage-schema)
- [Getting Started & Local Reproduction](#getting-started--local-reproduction)
  - [Running the Web Application](#running-the-web-application)
  - [Reproducing the Python Data Science Pipeline](#reproducing-the-python-data-science-pipeline)
  - [Running Automated Verification Tests](#running-automated-verification-tests)
  - [Deploying to GitHub Pages](#deploying-to-github-pages)
- [Resume Representations (SDE vs. Data Science / AI-ML)](#resume-representations-sde-vs-data-science--ai-ml)
- [License](#license)

---

## Overview & Architectural Philosophy

StudyFlow transforms fragmented student productivity tools into an integrated, privacy-preserving academic intelligence platform.

### Strict Architectural Principles
1. **Zero External Frontend Frameworks:** Built in modular Vanilla JavaScript (ES6 Revealing Module Pattern), HTML5, and CSS3 without React, Next.js, or bundlers.
2. **Local-First & Privacy-Preserving:** 100% of student tasks, timetable schedules, documents, and focus records reside in browser `localStorage`. No mandatory logins or tracking servers.
3. **Reproducible Machine Learning:** Predictive models are trained with rigorous validation on a reproducible Python `scikit-learn` pipeline. Model weights are serialized into JavaScript constants (`js/mlModelsData.js`) for sub-millisecond, zero-latency browser inference with zero API key leaks.
4. **Resilient Offline Execution:** Service Worker v2 caches all assets using relative paths (`./`) for complete offline availability on standalone servers or GitHub Pages subfolders.

---

## Key Upgrades & Features

### 1. Machine Learning & Predictive Analytics
- **Task Completion Probability Classifier:** Evaluates deadline proximity, priority, estimated duration, historical study velocity, and subject difficulty using an L2-regularized Logistic Regression model ($ROC\text{-}AUC = 0.7940, F1 = 0.6847, \text{Accuracy} = 71.71\%$, outperforming the 57.0% baseline by +58.8% AUC). Flags high-risk tasks with real-time probability badges.
- **Completion Duration Regressor:** Predicts actual task duration using Ridge Regression ($R^2 = 0.9621, MAE = 9.96$ mins vs. 59.54 mins baseline), counteracting optimistic student underestimation.
- **Explainable Feature Drivers:** For each recommended task, displays top statistical feature drivers (e.g. `Historical Completion Rate (+1.12)`, `Days Until Due (+0.74)`).
- **Dynamic Task Overrun KPI:** Real-time calculation of student duration accuracy derived dynamically from completed tasks in storage.
- **Subject Vulnerability & Risk Matrix:** Computes academic risk index per subject based on pending load, overdue counts, and study velocity.
- **Study Trend Visualizer:** Dynamic SVG 7-day focus trend bar charts reflecting daily focus minutes.

### 2. Timetable & Conflict-Free Study Planner
- **Weekly Class Timetable:** Recurring weekly class and lab schedule manager spanning Monday through Sunday ($08:00 - 20:00$).
- **Time-Aware Slot Allocation:** Planner checks `Date.now()` on the current day rather than naively scheduling in past morning hours.
- **Collision Detection:** Intersects study sessions with `Timetable.getBusyIntervals(dateStr)`, preventing study sessions from being scheduled during lecture hours.
- **Explainable Session Badges:** Each scheduled study block displays an explicit rationale tag (*"High Priority"*, *"Approaching Deadline"*, *"Avoided class hours"*).

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
- **Speech Synthesis:** Responds verbally using `window.speechSynthesis` with speech garbage-collection mitigations and an instant mute toggle. Keyboard shortcut: `V` key or `Escape`.

### 6. Academic Document Intelligence (BM25 Search)
- **Local Client-Side Ingestion:** Ingest course notes, syllabi, and textbook extracts with a 50,000-character safety bound.
- **Sliding-Window Chunking:** Partitions text into ~180-word passages with 30-word overlaps, preserving sentence boundaries and metadata.
- **BM25 Keyword Search & Retrieval:** Searches across indexed chunks using term-frequency and document-length normalization, returning relevant excerpts with source citations. Sanitized regex highlighting prevents crashes on technical search tokens like `C++` or `O(n)`.
- **Automated Definition & Quiz Extraction:** Extracts definitions matching academic patterns for instant flashcard review.

### 7. Spaced Revision System
- **Ebbinghaus Spaced Repetition:** Automates multi-stage revision schedules based on intervals (+1 day, +3 days, +7 days, +14 days, +30 days).
- **Syllabus Topic Tracking:** Track completion percentage and upcoming revision milestones across all academic courses.

### 8. Safe Data Migration & JSON Backup
- **Automatic Snapshot Protection:** Automatically captures a backup snapshot (`studyflow_auto_snapshot_v1`) before schema updates, with 1-click modal rollback restoration.
- **JSON Export & Import:** Full workspace data export and import with strict schema validation and interactive preview modal before applying changes.

---

## Data Science Experiment Pipeline

The machine learning suite is housed in the `data_science/` directory, following reproducible industry standards.

```
data_science/
├── generate_dataset.py       # Calibrated academic dataset generator (3,500 samples)
├── academic_study_dataset.csv # Generated dataset across 9 engineered features
├── run_eda.py                # Reproducible statistical & visual Exploratory Data Analysis
├── exploratory_data_analysis.ipynb # Interactive Jupyter Notebook for EDA
├── eda_report.md             # Detailed findings and distribution analysis
├── train_models.py           # Scikit-learn training, stratified 80/20 split, evaluation
├── verify_parity.py          # Python vs JavaScript parity and latency benchmark
├── evaluation_metrics.json   # Benchmark metrics comparing baselines & models
├── model_weights.json        # Exported JSON model parameters
├── model_explainability_report.md # Odds ratios and permutation feature importance
└── plots/                    # 10 generated diagnostic and EDA plots
```

### Dataset & Problem Formulations

#### 1. Task Completion Probability (Binary Classification)
- **Problem Formulation:** Predict whether an academic task will be completed before its due date ($y \in \{0, 1\}$).
- **Engineered Features ($X$):**
  1. `subject_difficulty`: Continuous domain index $[0.50, 0.85]$.
  2. `priority_code`: Priority scale (`low: 0`, `medium: 1`, `high: 2`).
  3. `estimated_duration`: Estimated effort in minutes.
  4. `days_until_due`: Continuous days until due date.
  5. `subtask_count`: Number of checklist subtasks $[0, 6]$.
  6. `student_study_streak`: Consecutive study days active.
  7. `hist_completion_rate`: Student's historical rolling completion rate $[0.25, 0.98]$.
  8. `past_studied_minutes`: Focus minutes already logged on this task.
  9. `class_hours_today`: Fixed lecture/lab hours today $[0, 6]$.

#### 2. Actual Completion Duration (Continuous Regression)
- **Problem Formulation:** Predict actual execution time in minutes ($\hat{y} \in \mathbb{R}^+$) to counteract student planning fallacies.

### Model Benchmarks & Metrics

Evaluated on an 80/20 train/test split (2,800 train, 700 holdout test samples):

| Task | Baseline Model | Trained Model | Metric | Baseline Score | Trained Model Score | Improvement |
|---|---|---|---|---|---|---|
| **Completion Risk** | Majority Class Classifier | **Logistic Regression (L2)** | **ROC-AUC** | 0.5000 | **0.7940** | **+58.8%** |
| | | Random Forest | ROC-AUC | 0.5000 | 0.7987 | +59.7% |
| | | **Logistic Regression (L2)** | **Accuracy** | 57.00% | **71.71%** | **+14.7%** |
| | | **Logistic Regression (L2)** | **F1-Score** | 0.0000 | **0.6847** | **+0.685** |
| **Actual Duration** | Mean Duration Baseline | **Ridge Regression** | **$R^2$ Score** | 0.0000 | **0.9621** | **+0.962** |
| | | Gradient Boosting | $R^2$ Score | 0.0000 | 0.9622 | +0.962 |
| | | **Ridge Regression** | **MAE** | 59.54 min | **9.96 min** | **-83.3% error** |

### Client-Side Browser Inference & Parity

Model coefficients, intercepts, and feature standard scaler parameters (`mean`, `scale`) are exported to `js/mlModelsData.js`. The browser computes vector dot products in pure JavaScript in **7.80 microseconds ($\mu$s)** (128,145 inferences/sec) with maximum numerical delta $< 10^{-5}$:

$$\hat{z} = \beta_0 + \sum_{i=1}^n \beta_i \left(\frac{x_i - \mu_i}{\sigma_i}\right), \quad P(\text{completion}) = \frac{1}{1 + e^{-\hat{z}}}$$

$$\widehat{\text{Duration}} = \alpha_0 + \sum_{i=1}^n w_i \left(\frac{x_i - \mu_i}{\sigma_i}\right)$$

### Real-User Validation Framework

- **Data Isolation:** User task outcomes are recorded in a separate `studyflow_user_ml_samples` storage key, strictly decoupled from synthetic training data.
- **Sufficiency Gate:** Shows a clear progress indicator (`X / 20 required`). Personal validation is only activated once $\ge 20$ completed observations exist.
- **Anonymized Export:** Students can export anonymized activity records for local model retraining.

---

## Architecture & Script Dependency Graph

All modules follow the ES6 Revealing Module Pattern and are loaded asynchronously in dependency-ordered sequence:

```
index.html
  ├── js/utils.js                 (Formatting, Toast, Sanitization, Date math)
  ├── js/storage.js               (LocalStorage CRUD, Auto-snapshot, User ML store, JSON Backup)
  ├── js/notifications.js         (Web Notifications & Web Audio synthesis)
  ├── js/taskManager.js           (Task CRUD, Subtask checklists, Recurring tasks, Triage)
  ├── js/dashboard.js             (Workload stats, Ring chart, Subject analytics)
  ├── js/calendar.js              (Monthly grid, Day task indicators)
  ├── js/pomodoro.js              (Epoch-based timer, Visibility sync, Focus history)
  ├── js/timetable.js             (Weekly class timetable, Collision queries, Spaced revision)
  ├── js/studyPlanner.js          (Time-aware, collision-free slot allocator)
  ├── js/mlModelsData.js          (Pre-trained ML weights, scalers, and evaluation metrics)
  ├── js/mlAnalytics.js           (Real-time ML risk inference, Subject risk, Real-user validation)
  ├── js/voiceSpeech.js           (Web Speech recognition & synthesis adapter)
  ├── js/voiceParser.js           (Bilingual English + Hinglish intent classification)
  ├── js/voiceHandler.js          (Voice assistant UI, Waveform animation, Modal triggers)
  ├── js/documentIntelligence.js  (Document chunking, BM25 keyword search, Flashcard quizzes)
  ├── js/backupService.js         (JSON backup UI, Validation preview, Snapshot rollback)
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
| `studyflow_user_ml_samples`| `Array<MLSample>` | Real user feature observations for model validation |
| `studyflow_auto_snapshot_v1`| `Object` | Rollback snapshot taken prior to schema migration |
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

### Reproducing the Python Data Science Pipeline
To regenerate the synthetic academic dataset, run EDA, retrain the models, and benchmark parity:

```bash
# Navigate to the data science directory
cd data_science

# Install required dependencies
pip install numpy pandas scikit-learn matplotlib seaborn

# Step 1: Generate calibrated academic dataset (3,500 samples)
python generate_dataset.py

# Step 2: Run Exploratory Data Analysis & generate 5 visual plots
python run_eda.py

# Step 3: Train models, benchmark vs baselines, and export browser weights
python train_models.py

# Step 4: Verify Python-JavaScript parity and benchmark latency
python verify_parity.py
```

### Running Automated Verification Tests
```bash
# Run unit and integration tests from repository root
node tests/run_tests.js
```

### Deploying to GitHub Pages
1. Push repository to your GitHub account (`main` branch).
2. Go to **Repository Settings** $\rightarrow$ **Pages**.
3. Under **Build and deployment**, select **Source** as `Deploy from a branch` and set branch to `main` / `root`.
4. Service Worker v2 uses relative caching paths (`./`), ensuring assets cache properly under subfolder URLs (e.g. `https://<username>.github.io/StudyFlow/`).

---

## Resume Representations (SDE vs. Data Science / AI-ML)

### 1. Software Development Engineer (SDE) Resume Representation
> **StudyFlow — AI-Powered Academic Intelligence & Productivity Platform** | *Vanilla JavaScript (ES6), HTML5, CSS3, Web APIs, Service Worker, PWA*
> - Engineered a zero-dependency, local-first academic platform in modular Vanilla ES6 JavaScript (Revealing Module Pattern), managing 9 persistent data stores with automated rollback snapshotting and zero data-loss migration.
> - Formulated a time-aware, conflict-free greedy study scheduling engine integrated with recurring weekly timetable collision detection, preventing study overlaps during lecture hours.
> - Implemented an epoch timestamp-delta Pomodoro focus engine with `document.visibilitychange` background tab throttling recovery and immutable session audit logging.
> - Integrated bilingual English + Hinglish voice control using browser `SpeechRecognition` (`en-IN`) and `SpeechSynthesis` with entity extraction, confirmation modals, and keyboard accessibility.
> - Configured Service Worker v2 PWA caching with relative resource resolution, achieving 100% offline functionality across both standalone domains and GitHub Pages subfolders.

---

### 2. Data Scientist / Machine Learning Engineer Resume Representation
> **StudyFlow — Academic Intelligence & Predictive Analytics Engine** | *Python, Scikit-Learn, Pandas, NumPy, Client-Side ML Inference, NLP*
> - Formulated an end-to-end academic risk prediction engine using a 3,500-sample dataset across 9 engineered features (deadline proximity, study velocity, subject difficulty, concurrent lecture load).
> - Conducted comprehensive Exploratory Data Analysis (EDA) and trained an L2 Logistic Regression classifier (**0.7940 ROC-AUC**, **0.6847 F1-score**, +58.8% gain over Dummy Baseline) and a Ridge Regression duration predictor (**$R^2 = 0.9621$**, **$MAE = 9.96$ min**, -83.3% error reduction over Mean Baseline).
> - Serialized model coefficients and standard scaler parameters into client-side JavaScript for zero-latency, private browser inference, achieving exact floating-point parity ($< 10^{-5}$) and **7.80 $\mu$s per inference** (128k inf/sec).
> - Developed an explainable study recommendation engine generating prioritized task advice based on permutation feature importance and odds ratio weights.
> - Built a privacy-preserving real-user validation framework that logs anonymized feature vectors with data sufficiency gating, strictly decoupled from synthetic baseline training records.

---

## License

Distributed under the MIT License. See `LICENSE` for details.
