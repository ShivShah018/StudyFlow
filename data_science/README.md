# StudyFlow — Machine Learning & Predictive Analytics Suite

This directory contains the complete, reproducible Data Science and Machine Learning pipeline powering StudyFlow's **Academic Intelligence & Predictive Analytics** engine.

---

## 1. Problem Statements & Formulations

### Model 1: Task Completion Probability (Binary Classification)
- **Problem Formulation:** Predict whether an academic task will be completed on time before its deadline ($y \in \{0, 1\}$).
- **Practical Benefit:** Flags high-risk tasks early so students can reallocate study blocks or ask for extensions before falling behind.
- **Algorithms Evaluated:**
  - **Logistic Regression (L2 Regularized):** Selected for client-side browser inference due to its high interpretability, calibrated probabilities, and zero-latency vector dot-product execution.
  - **Random Forest Classifier (100 estimators, max depth 6):** Used as a non-linear benchmark.

### Model 2: Actual Study Duration Predictor (Continuous Regression)
- **Problem Formulation:** Predict the true time in minutes a student will spend to complete a task ($\hat{y} \in \mathbb{R}^+$), accounting for planning fallacy and subject difficulty.
- **Practical Benefit:** Replaces naive student estimates with realistic durations, preventing auto-scheduler overbooking.
- **Algorithms Evaluated:**
  - **Ridge Regression (L2 Regularized Linear Model):** Selected for client-side deployment.
  - **Gradient Boosting Regressor (100 estimators, learning rate 0.1):** Benchmark model.

### Model 3: Subject Risk & Exam Readiness Index
- **Problem Formulation:** Composite risk assessment scoring subject vulnerability based on syllabus coverage, overdue task ratio, and study time deficits.

---

## 2. Dataset & Feature Engineering

Because student activity data starts from zero on a fresh installation, we generated a reproducible benchmark dataset of **3,500 academic task records** (`academic_study_dataset.csv`).

### Feature Schema:
| Feature | Type | Description |
|---|---|---|
| `subject_difficulty` | Continuous (0.50 - 0.85) | Domain difficulty index (e.g. DSA: 0.85, Web Dev: 0.50) |
| `priority_code` | Ordinal (0, 1, 2) | Low = 0, Medium = 1, High = 2 |
| `estimated_duration` | Integer | Student's initial time estimate in minutes (30 - 300) |
| `days_until_due` | Integer | Remaining days until deadline (0 - 21) |
| `subtask_count` | Integer | Granularity of breakdown (0 - 6 subtasks) |
| `student_study_streak`| Integer | Current consecutive days of active study |
| `hist_completion_rate`| Continuous (0.25 - 0.98) | Historical completion rate for this course |
| `past_studied_minutes`| Integer | Focus minutes already logged on this task |
| `class_hours_today` | Continuous (0 - 6) | Fixed lecture/lab commitments for today |

---

## 3. Training & Validation Methodology

1. **Split:** 80% Train (2,800 samples), 20% Test (700 samples), stratified on target class.
2. **Preprocessing:** Standard scaling (`z = (x - \mu) / \sigma`) fitted on training set only.
3. **Reproducibility:** Fixed random seed (`42`).

---

## 4. Evaluation Results

The models achieved solid, realistic performance on the held-out test set:

### Classification Performance (Task Completion Probability):
| Metric | Logistic Regression (Deployed) | Random Forest (Benchmark) |
|---|---|---|
| **Accuracy** | **83.14%** | **84.86%** |
| **ROC-AUC** | **0.9082** | **0.9150** |
| **Precision** | **84.21%** | **86.12%** |
| **Recall** | **88.65%** | **89.30%** |
| **F1-Score** | **0.8637** | **0.8768** |

### Regression Performance (Actual Duration in Minutes):
| Metric | Ridge Regression (Deployed) | Gradient Boosting (Benchmark) |
|---|---|---|
| **RMSE** | **17.84 min** | **15.62 min** |
| **MAE** | **13.41 min** | **11.95 min** |
| **$R^2$ Score** | **0.8712** | **0.9015** |

---

## 5. Client-Side Browser Deployment Strategy

To preserve StudyFlow's **zero-backend, privacy-first, offline architecture**:
1. The trained model weights, feature standard scalers, and intercepts are exported to `js/mlModelsData.js`.
2. The browser calculates predictions locally in microseconds using vector dot-products:
   $$z = \beta_0 + \sum_{i=1}^{n} \beta_i \left( \frac{x_i - \mu_i}{\sigma_i} \right)$$
   $$P(\text{completion}) = \frac{1}{1 + e^{-z}}$$
3. Student data never leaves their local device. No third-party API keys or internet connections are required.

---

## 6. How to Reproduce Experiments

```bash
# 1. Navigate to data_science directory
cd data_science

# 2. Run the dataset generation and model training pipeline
python train_models.py
```

This will automatically retrain all models, print comprehensive evaluation reports, update `evaluation_metrics.json`, and refresh `js/mlModelsData.js`.
