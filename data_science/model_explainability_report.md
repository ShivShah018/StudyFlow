# Machine Learning Model Explainability & Interpretability Report

**Application:** StudyFlow — Academic Intelligence & Predictive Analytics Engine  
**Models Evaluated:**
1. Task Completion Probability: L2 Logistic Regression (vs Random Forest & Majority Class)
2. Actual Study Duration: Ridge Regression (vs Gradient Boosting & Mean Baseline)

---

## 1. Logistic Regression: Coefficient & Odds Ratio Analysis

Logistic regression models the log-odds of completing a task on time before its due date:
$$\ln\left(\frac{p}{1-p}\right) = \beta_0 + \sum_{i=1}^{n} \beta_i \cdot z_i$$

Where $z_i = \frac{x_i - \mu_i}{\sigma_i}$ represents the standardized feature value.

### Feature Coefficients & Odds Ratios:

| Feature | Standardized Weight ($\beta_i$) | Odds Ratio ($e^{\beta_i}$) | Direction | Behavioral Interpretation |
|---|---|---|---|---|
| `subject_difficulty` | -0.3142 | 0.7304 | Negative (-) | High-complexity courses (DSA, OS) add cognitive friction, reducing on-time likelihood. |
| `priority_code` | +0.2869 | 1.3322 | Positive (+) | Higher assigned priority correlates with greater focus allocation. |
| `estimated_duration` | -0.6289 | 0.5332 | Negative (-) | Duration scope scale factor. |
| `days_until_due` | +0.7327 | 2.0806 | Positive (+) | Each standard deviation increase in lead time multiplies odds of completion. |
| `subtask_count` | -0.3066 | 0.7360 | Negative (-) | Granular checklists provide structure, slightly moderating task size. |
| `student_study_streak` | +0.1296 | 1.1384 | Positive (+) | Active study habit streaks maintain academic momentum. |
| `hist_completion_rate` | +0.6528 | 1.9209 | Positive (+) | Past study consistency is the strongest driver of on-time completion. |
| `past_studied_minutes` | +0.5450 | 1.7245 | Positive (+) | Progress logged early mitigates deadline panic and backlog stress. |
| `class_hours_today` | -0.4031 | 0.6682 | Negative (-) | Lecture/lab commitments consume study blocks, increasing deadline pressure. |

---

## 2. Permutation Feature Importance

Evaluated by shuffling each feature on the held-out test set ($N = 700$) across 15 iterations and measuring the resulting mean decrease in ROC-AUC:

| Feature | Mean ROC-AUC Decrease | Rank |
|---|---|---|
| `days_until_due` | 0.0782 | #1 |
| `hist_completion_rate` | 0.0471 | #2 |
| `estimated_duration` | 0.0432 | #3 |
| `past_studied_minutes` | 0.0357 | #4 |
| `class_hours_today` | 0.0245 | #5 |
| `subtask_count` | 0.0153 | #6 |
| `subject_difficulty` | 0.0150 | #7 |
| `priority_code` | 0.0137 | #8 |
| `student_study_streak` | 0.0015 | #9 |

---

## 3. Ridge Regression: Duration Model Coefficients

Ridge regression models actual execution time to counteract planning fallacies:
$$\widehat{\text{Duration}} = \alpha_0 + \sum_{i=1}^{n} w_i \cdot z_i$$

### Coefficients & Feature Scale:
- **Baseline Intercept ($\alpha_0$):** 123.52 minutes
- **Estimated Duration Weight:** +76.40 (primary scale anchor)
- **Subject Difficulty Penalty:** +2.08 minutes (additional time required for hard courses)
- **Subtask Overhead:** +4.91 minutes (context-switching and breakdown overhead)

---

## 4. Model Limitations & Generalization Warnings

1. **Synthetic Data Origin:** These models were trained on 3,500 calibrated synthetic academic records. While calibrated to real university course difficulties, individual student performance can vary widely.
2. **Absence of Longitudinal Student Identity:** The dataset models individual tasks as independent samples. In practice, student stress fluctuates across exam weeks and semester cycles.
3. **No Direct Causality:** Feature coefficients indicate statistical association, not guaranteed causality. Increasing a task's priority does not automatically guarantee earlier completion without actual study session commitment.
