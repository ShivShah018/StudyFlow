# StudyFlow — Machine Learning & Predictive Analytics Suite

This directory contains the complete, reproducible Data Science and Machine Learning pipeline powering StudyFlow's **Academic Intelligence & Predictive Analytics** engine.

---

## 1. Problem Statements & Formulations

### Model 1: Task Completion Probability (Binary Classification)
- **Problem Formulation:** Predict whether an academic task will be completed on time before its due date ($y \in \{0, 1\}$).
- **Practical Benefit:** Flags high-risk assignments early so students can reallocate focus blocks, break tasks into checklists, or request extensions before falling behind.
- **Algorithms Evaluated:**
  - **Dummy Baseline (Majority Class):** Predicts class 0 for all instances ($ROC\text{-}AUC = 0.500, F1 = 0.000$).
  - **Logistic Regression (L2 Regularized, Balanced Class Weights):** Selected for client-side browser deployment due to its interpretability, odds ratios, and zero-latency vector dot-product execution ($ROC\text{-}AUC = 0.794, F1 = 0.685$).
  - **Random Forest Classifier (100 estimators, max depth 6):** Used as a non-linear benchmark ($ROC\text{-}AUC = 0.799, F1 = 0.678$).

### Model 2: Actual Study Duration Predictor (Continuous Regression)
- **Problem Formulation:** Predict the true execution time in minutes a student will spend to complete a task ($\hat{y} \in \mathbb{R}^+$), counteracting the well-documented student planning fallacy.
- **Practical Benefit:** Replaces naive student duration estimates with realistic predictions, preventing overbooking in the intelligent auto-scheduler.
- **Algorithms Evaluated:**
  - **Mean Baseline:** Naive average prediction ($MAE = 59.54$ min, $R^2 = 0.000$).
  - **Ridge Regression (L2 Regularized Linear Model):** Selected for client-side deployment ($MAE = 9.96$ min, $R^2 = 0.962$).
  - **Gradient Boosting Regressor (100 estimators, max depth 4):** Non-linear comparison benchmark ($MAE = 9.73$ min, $R^2 = 0.962$).

---

## 2. Dataset Description & Synthetic Generation Methodology

Because real student task data starts from zero on a fresh application installation, we created a reproducible synthetic benchmark dataset of **3,500 academic task records** (`academic_study_dataset.csv`).

### Feature Schema:
| Feature | Type | Description |
|---|---|---|
| `subject_difficulty` | Continuous (0.50 - 0.85) | Domain difficulty index (e.g. DSA: 0.85, Web Dev: 0.50) |
| `priority_code` | Ordinal (0, 1, 2) | Low = 0, Medium = 1, High = 2 |
| `estimated_duration` | Integer (30 - 300) | Student's initial time estimate in minutes |
| `days_until_due` | Integer (0 - 14) | Remaining days until deadline |
| `subtask_count` | Integer (0 - 6) | Number of checklist items / granularity |
| `student_study_streak`| Integer (0 - 25) | Current consecutive days of active study |
| `hist_completion_rate`| Continuous (0.25 - 0.98) | Historical rolling completion rate for this course |
| `past_studied_minutes`| Integer (0 - 200) | Focus minutes already logged on this task |
| `class_hours_today` | Continuous (0 - 6) | Fixed lecture/lab commitments for today |

### Target Variables:
- `completed_on_time`: $0 = \text{Late/Incomplete}$ (57.0%), $1 = \text{Completed On Time}$ (43.0%).
- `actual_duration`: Continuous minutes spent (Mean: 123.4 min, Std: 77.6 min).

---

## 3. Exploratory Data Analysis (EDA) Findings

The EDA script (`run_eda.py`) and notebook (`exploratory_data_analysis.ipynb`) uncovered key behavioral patterns:
1. **Planning Fallacy:** Students systematically underestimate actual study durations by 15%–30%, especially in high-difficulty courses (DSA, OS) and assignments with >3 subtasks.
2. **Correlation Matrix:** Strong positive correlation between lead time (`days_until_due`) and completion probability ($r = 0.35$). Lecture load (`class_hours_today`) introduces negative drag ($r = -0.18$).
3. **Outlier Analysis (Tukey's IQR):** Duration outliers represent capstone projects and semester revisions (up to 300 minutes), which are legitimate real-world academic tasks and are preserved using L2 regularization.

All 10 generated visualization plots are stored in `plots/`:
- `feature_distributions.png`, `correlation_heatmap.png`, `target_distributions.png`, `feature_target_relationships.png`, `outliers_boxplots.png`, `roc_curves.png`, `precision_recall_curves.png`, `actual_vs_predicted_duration.png`, `residuals_distribution.png`, `feature_importance.png`.

---

## 4. Benchmark Evaluation Results

Evaluated on held-out test split (700 samples, 20% stratified test set):

### Classification Benchmarks (Task Completion Probability):
| Metric | Dummy Baseline (Majority Class) | Logistic Regression (Deployed) | Random Forest Classifier | Improvement |
|---|---|---|---|---|
| **ROC-AUC** | 0.5000 | **0.7940** | **0.7987** | **+58.8%** |
| **Accuracy** | 57.00% | **71.71%** | **70.71%** | **+14.7%** |
| **Precision** | 0.00% | **65.75%** | **64.29%** | **+65.8%** |
| **Recall** | 0.00% | **71.43%** | **71.76%** | **+71.4%** |
| **F1-Score** | 0.0000 | **0.6847** | **0.6782** | **+0.685** |
| **Brier Score** | 0.4300 | **0.1868** | **0.1858** | **-56.6% error** |

### Confusion Matrix (Logistic Regression on Test Set):
```
                 Predicted Late (0)    Predicted On-Time (1)
Actual Late (0)         287                    112
Actual On-Time (1)       86                    215
```

### Regression Benchmarks (Actual Duration in Minutes):
| Metric | Mean Baseline | Ridge Regression (Deployed) | Gradient Boosting Regressor | Improvement |
|---|---|---|---|---|
| **$R^2$ Score** | 0.0000 | **0.9621** | **0.9622** | **+0.962** |
| **MAE** | 59.54 min | **9.96 min** | **9.73 min** | **-83.3% error** |
| **RMSE** | 77.57 min | **15.10 min** | **15.08 min** | **-80.5% error** |

---

## 5. Model Cards & Explainability

### Model Card 1: Task Completion Classifier
- **Architecture:** Logistic Regression with L2 Regularization ($C=1.0$), `class_weight='balanced'`.
- **Top Feature Odds Ratios:**
  - `hist_completion_rate`: Odds ratio **1.72** (strongest predictor of deadline success).
  - `days_until_due`: Odds ratio **1.45** (every standard deviation increase multiplies completion odds).
  - `subject_difficulty`: Odds ratio **0.65** (heavy technical courses reduce on-time probability).
  - `class_hours_today`: Odds ratio **0.78** (heavy lecture schedules restrict available focus time).

### Model Card 2: Actual Duration Regressor
- **Architecture:** Ridge Regression ($\alpha=1.0$) with standardized features.
- **Top Weights:**
  - `estimated_duration`: $+76.54$ min (primary baseline anchor).
  - `subject_difficulty`: $+4.12$ min (course friction addition).
  - `subtask_count`: $+3.20$ min (task coordination overhead).

---

## 6. Python-JavaScript Parity & Latency Benchmark

We verified client-side browser inference parity against Python scikit-learn across 10 diverse test vectors in `verify_parity.py`:

- **Numerical Delta:** Maximum probability delta = `0.00000000`, maximum duration delta = `0.00000000`.
- **Latency Benchmark (10,000 runs):** **7.80 microseconds ($\mu$s)** per full inference (128,145 inferences/sec).
- **Execution Mode:** 100% client-side pure JavaScript vector dot products. No server round-trip, no API keys, zero latency.

---

## 7. Real-User Validation Framework

StudyFlow includes a dedicated real-student validation framework:
1. **Data Separation:** As real tasks are completed in the app, feature vectors and outcomes are saved to `studyflow_user_ml_samples` in `localStorage`, strictly separated from synthetic training records.
2. **Sufficiency Threshold:** The analytics dashboard displays a data sufficiency indicator (`X / 20 required`). Predictions use the calibrated baseline until $\ge 20$ personal observations are logged.
3. **Anonymized Export:** Students can export their anonymized feature dataset (`studyflow_anonymized_user_features.json`) for local retraining or offline verification.

---

## 8. Reproduction Instructions

```bash
# 1. Navigate to data_science directory
cd data_science

# 2. Install dependencies
pip install numpy pandas scikit-learn matplotlib seaborn

# 3. Generate calibrated dataset (3,500 records)
python generate_dataset.py

# 4. Run Exploratory Data Analysis & generate plots
python run_eda.py

# 5. Train models, evaluate baselines & export browser weights
python train_models.py

# 6. Verify Python-JavaScript parity and benchmark latency
python verify_parity.py
```
