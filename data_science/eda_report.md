# Exploratory Data Analysis (EDA) Report — StudyFlow Academic Dataset

**Dataset:** `academic_study_dataset.csv`  
**Sample Size:** 3500 rows, 19 columns  
**Missing Values:** 0 (0.0%)  
**Duplicates:** 0  

---

## 1. Executive Summary & Problem Formulation

The StudyFlow academic dataset contains 3500 synthetic student task records designed to simulate real-world university workloads across 6 core computer science and engineering disciplines.

The predictive goals are:
1. **Binary Classification:** Predict on-time task completion (`completed_on_time` in [0, 1]).
2. **Continuous Regression:** Predict actual time spent in minutes (`actual_duration` in R+) to address student planning fallacies.
3. **Ordinal Risk Stratification:** Calibrate subject-level vulnerability (`subject_risk_level` in [0, 1, 2]).

---

## 2. Descriptive Statistics

| Feature | Mean | Std | Min | 25% | 50% | 75% | Max |
|---|---|---|---|---|---|---|---|
| `subject_difficulty` | 0.70 | 0.12 | 0.50 | 0.60 | 0.70 | 0.80 | 0.85 |
| `priority_code` | 1.01 | 0.71 | 0.00 | 1.00 | 1.00 | 2.00 | 2.00 |
| `estimated_duration` | 96.42 | 59.52 | 30.00 | 60.00 | 90.00 | 120.00 | 300.00 |
| `days_until_due` | 2.96 | 3.23 | 0.00 | 1.00 | 2.00 | 4.00 | 14.00 |
| `subtask_count` | 2.21 | 1.64 | 0.00 | 1.00 | 2.00 | 3.00 | 6.00 |
| `student_study_streak` | 4.00 | 1.98 | 0.00 | 3.00 | 4.00 | 5.00 | 13.00 |
| `hist_completion_rate` | 0.61 | 0.12 | 0.25 | 0.53 | 0.61 | 0.70 | 0.98 |
| `past_studied_minutes` | 25.60 | 31.41 | 0.00 | 0.00 | 18.00 | 37.00 | 213.00 |
| `class_hours_today` | 3.14 | 2.08 | 0.00 | 2.00 | 4.00 | 5.00 | 6.00 |
| `completed_on_time` | 0.43 | 0.50 | 0.00 | 0.00 | 0.00 | 1.00 | 1.00 |
| `actual_duration` | 123.39 | 77.63 | 26.00 | 68.00 | 100.00 | 152.25 | 454.00 |
| `duration_overrun_pct` | 28.01 | 13.41 | -16.70 | 18.90 | 28.30 | 36.70 | 76.70 |

---

## 3. Target Variable Distributions

### Classification Target (`completed_on_time`)
- **Late / Incomplete (Class 0):** 57.0% (1994 samples)
- **Completed On Time (Class 1):** 43.0% (1505 samples)
- **Class Balance Assessment:** Balanced distribution without severe class collapse. Mitigates majority-class guessing during model training.

### Regression Target (`actual_duration`)
- **Mean Actual Duration:** 123.39 minutes
- **Standard Deviation:** 77.63 minutes
- **Planning Fallacy Observation:** Across all subjects, actual durations average 15%–30% higher than students' estimated times, with greater overrun in high-difficulty courses (DSA, OS) and tasks with >3 subtasks.

---

## 4. Correlation Analysis & Feature Interactions

Key insights from the correlation matrix:
1. **`estimated_duration` vs `actual_duration` ($r = 0.980$):** Strong linear correlation representing baseline task scope, with divergence driven by subject difficulty and coordination overhead.
2. **`hist_completion_rate` vs `completed_on_time` ($r = 0.254$):** Positive correlation confirming that past study habits are a strong predictor of deadline compliance.
3. **`days_until_due` vs `completed_on_time` ($r = 0.270$):** Longer lead times significantly improve probability of on-time delivery.
4. **`class_hours_today` vs `completed_on_time` ($r = -0.157$):** Heavy lecture schedules reduce available study windows, introducing a negative drag on daily task completion.

---

## 5. Outlier Detection (Tukey's IQR Method)

| Feature | Q25 | Q75 | IQR | Outliers Count | Outlier % |
|---|---|---|---|---|---|
| `estimated_duration` | 60.0 | 120.0 | 60.0 | 228 | 6.51% |
| `actual_duration` | 68.0 | 152.25 | 84.25 | 204 | 5.83% |
| `past_studied_minutes` | 0.0 | 37.0 | 37.0 | 153 | 4.37% |
| `student_study_streak` | 3.0 | 5.0 | 2.0 | 70 | 2.0% |

*Assessment:* Outliers in duration represent long-term projects and exam preparations (up to 300 minutes), which are legitimate real-world academic tasks and should be preserved using robust L2 regularization (Ridge) rather than trimmed.

---

## 6. Generated Visual Artifacts

The following visualization artifacts have been generated in `data_science/plots/`:
1. `feature_distributions.png`: Histograms and KDE plots for all 9 core workload signals.
2. `correlation_heatmap.png`: Tri-masked correlation matrix illustrating feature collinearity.
3. `target_distributions.png`: Pie and bar charts showing target class balance and subject risk levels.
4. `feature_target_relationships.png`: Non-linear relationship plots (days until due vs. completion, planning fallacy scatter, subtask overrun).
5. `outliers_boxplots.png`: Standardized boxplots for outlier boundary identification.
