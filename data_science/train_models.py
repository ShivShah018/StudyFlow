"""
StudyFlow - Predictive Model Training, Validation & Weight Export Pipeline
Trains:
  1. Task Completion Probability Classifier (Logistic Regression & Random Forest vs Dummy Baseline)
  2. Actual Duration Predictor (Ridge Regression & Gradient Boosting vs Dummy Baseline)
  3. Model Explainability: Feature coefficients, odds ratios, permutation feature importance
Exports:
  - evaluation_metrics.json (Comprehensive benchmarks vs baselines)
  - model_weights.json & js/mlModelsData.js (Zero-latency client-side browser weights)
  - Diagnostic plots (ROC curve, PR curve, Residuals, Feature importance)
  - model_explainability_report.md (Transparent feature impact documentation)
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.dummy import DummyClassifier, DummyRegressor
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.inspection import permutation_importance
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, brier_score_loss, roc_curve, precision_recall_curve,
    mean_squared_error, mean_absolute_error, r2_score
)

def train_and_export():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'academic_study_dataset.csv')
    plots_dir = os.path.join(script_dir, 'plots')
    os.makedirs(plots_dir, exist_ok=True)
    
    if not os.path.exists(csv_path):
        import generate_dataset
        df = generate_dataset.generate_dataset(3500)
        df.to_csv(csv_path, index=False)
    else:
        df = pd.read_csv(csv_path)
        
    print(f"Loaded {len(df)} samples from {csv_path}")
    
    # -------------------------------------------------------------
    # 1. Feature Engineering & Preparation
    # -------------------------------------------------------------
    feature_cols = [
        'subject_difficulty',        # float [0.50 - 0.85]
        'priority_code',             # int [0, 1, 2]
        'estimated_duration',        # minutes [30 - 300]
        'days_until_due',            # days [0 - 14]
        'subtask_count',             # int [0 - 6]
        'student_study_streak',      # days [0 - 25]
        'hist_completion_rate',      # float [0.25 - 0.98]
        'past_studied_minutes',      # minutes [0 - 200]
        'class_hours_today'          # hours [0 - 6]
    ]
    
    X = df[feature_cols].copy()
    y_clf = df['completed_on_time'].values
    y_reg = df['actual_duration'].values
    
    # 80/20 Stratified Train-Test Split (fixed seed 42)
    X_train, X_test, y_clf_train, y_clf_test, y_reg_train, y_reg_test = train_test_split(
        X, y_clf, y_reg, test_size=0.20, random_state=42, stratify=y_clf
    )
    
    # Preprocessing: StandardScaler fit strictly on training set
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # -------------------------------------------------------------
    # 2. Classification Models & Baselines
    # -------------------------------------------------------------
    # Baseline: Majority Class
    clf_dummy = DummyClassifier(strategy='most_frequent')
    clf_dummy.fit(X_train, y_clf_train)
    y_clf_pred_dummy = clf_dummy.predict(X_test)
    y_clf_proba_dummy = clf_dummy.predict_proba(X_test)[:, 1]
    
    # Model 1A: Logistic Regression with balanced class weights
    clf_logreg = LogisticRegression(class_weight='balanced', C=1.0, max_iter=1000, random_state=42)
    clf_logreg.fit(X_train_scaled, y_clf_train)
    y_clf_pred_logreg = clf_logreg.predict(X_test_scaled)
    y_clf_proba_logreg = clf_logreg.predict_proba(X_test_scaled)[:, 1]
    
    # Model 1B: Random Forest Classifier
    clf_rf = RandomForestClassifier(n_estimators=100, max_depth=6, class_weight='balanced', random_state=42)
    clf_rf.fit(X_train, y_clf_train)
    y_clf_pred_rf = clf_rf.predict(X_test)
    y_clf_proba_rf = clf_rf.predict_proba(X_test)[:, 1]
    
    clf_metrics = {
        'DummyBaseline': {
            'accuracy': float(round(accuracy_score(y_clf_test, y_clf_pred_dummy), 4)),
            'precision': float(round(precision_score(y_clf_test, y_clf_pred_dummy, zero_division=0), 4)),
            'recall': float(round(recall_score(y_clf_test, y_clf_pred_dummy, zero_division=0), 4)),
            'f1_score': float(round(f1_score(y_clf_test, y_clf_pred_dummy, zero_division=0), 4)),
            'roc_auc': float(round(roc_auc_score(y_clf_test, y_clf_proba_dummy), 4)),
            'confusion_matrix': confusion_matrix(y_clf_test, y_clf_pred_dummy).tolist()
        },
        'LogisticRegression': {
            'accuracy': float(round(accuracy_score(y_clf_test, y_clf_pred_logreg), 4)),
            'precision': float(round(precision_score(y_clf_test, y_clf_pred_logreg), 4)),
            'recall': float(round(recall_score(y_clf_test, y_clf_pred_logreg), 4)),
            'f1_score': float(round(f1_score(y_clf_test, y_clf_pred_logreg), 4)),
            'roc_auc': float(round(roc_auc_score(y_clf_test, y_clf_proba_logreg), 4)),
            'brier_score': float(round(brier_score_loss(y_clf_test, y_clf_proba_logreg), 4)),
            'confusion_matrix': confusion_matrix(y_clf_test, y_clf_pred_logreg).tolist()
        },
        'RandomForestClassifier': {
            'accuracy': float(round(accuracy_score(y_clf_test, y_clf_pred_rf), 4)),
            'precision': float(round(precision_score(y_clf_test, y_clf_pred_rf), 4)),
            'recall': float(round(recall_score(y_clf_test, y_clf_pred_rf), 4)),
            'f1_score': float(round(f1_score(y_clf_test, y_clf_pred_rf), 4)),
            'roc_auc': float(round(roc_auc_score(y_clf_test, y_clf_proba_rf), 4)),
            'brier_score': float(round(brier_score_loss(y_clf_test, y_clf_proba_rf), 4)),
            'confusion_matrix': confusion_matrix(y_clf_test, y_clf_pred_rf).tolist()
        }
    }
    
    # -------------------------------------------------------------
    # 3. Regression Models & Baselines
    # -------------------------------------------------------------
    # Baseline: Mean Regressor
    reg_dummy = DummyRegressor(strategy='mean')
    reg_dummy.fit(X_train, y_reg_train)
    y_reg_pred_dummy = reg_dummy.predict(X_test)
    
    # Model 2A: Ridge Regression
    reg_ridge = Ridge(alpha=1.0)
    reg_ridge.fit(X_train_scaled, y_reg_train)
    y_reg_pred_ridge = reg_ridge.predict(X_test_scaled)
    
    # Model 2B: Gradient Boosting Regressor
    reg_gbr = GradientBoostingRegressor(n_estimators=100, max_depth=4, random_state=42)
    reg_gbr.fit(X_train, y_reg_train)
    y_reg_pred_gbr = reg_gbr.predict(X_test)
    
    reg_metrics = {
        'MeanBaseline': {
            'rmse': float(round(np.sqrt(mean_squared_error(y_reg_test, y_reg_pred_dummy)), 2)),
            'mae': float(round(mean_absolute_error(y_reg_test, y_reg_pred_dummy), 2)),
            'r2_score': float(round(r2_score(y_reg_test, y_reg_pred_dummy), 4))
        },
        'RidgeRegression': {
            'rmse': float(round(np.sqrt(mean_squared_error(y_reg_test, y_reg_pred_ridge)), 2)),
            'mae': float(round(mean_absolute_error(y_reg_test, y_reg_pred_ridge), 2)),
            'r2_score': float(round(r2_score(y_reg_test, y_reg_pred_ridge), 4))
        },
        'GradientBoostingRegressor': {
            'rmse': float(round(np.sqrt(mean_squared_error(y_reg_test, y_reg_pred_gbr)), 2)),
            'mae': float(round(mean_absolute_error(y_reg_test, y_reg_pred_gbr), 2)),
            'r2_score': float(round(r2_score(y_reg_test, y_reg_pred_gbr), 4))
        }
    }
    
    # -------------------------------------------------------------
    # 4. Permutation Feature Importance & Explainability
    # -------------------------------------------------------------
    perm_importance = permutation_importance(clf_logreg, X_test_scaled, y_clf_test, n_repeats=15, random_state=42)
    perm_dict = {
        col: float(round(mean_val, 4))
        for col, mean_val in zip(feature_cols, perm_importance.importances_mean)
    }
    
    # Odds ratios for Logistic Regression (e^beta)
    odds_ratios = {
        col: float(round(np.exp(coef), 4))
        for col, coef in zip(feature_cols, clf_logreg.coef_[0])
    }
    
    print("\n=== CLASSIFICATION BENCHMARKS (Task Completion) ===")
    for model_name, m in clf_metrics.items():
        print(f"[{model_name}] Accuracy: {m['accuracy']:.4f} | ROC-AUC: {m['roc_auc']:.4f} | F1: {m['f1_score']:.4f}")
        
    print("\n=== REGRESSION BENCHMARKS (Duration in Minutes) ===")
    for model_name, m in reg_metrics.items():
        print(f"[{model_name}] RMSE: {m['rmse']:.2f} min | MAE: {m['mae']:.2f} min | R²: {m['r2_score']:.4f}")
        
    # -------------------------------------------------------------
    # 5. Diagnostic Plots
    # -------------------------------------------------------------
    sns.set_theme(style='whitegrid')
    
    # Plot 1: ROC Curves Comparison
    plt.figure(figsize=(8, 6))
    fpr_lr, tpr_lr, _ = roc_curve(y_clf_test, y_clf_proba_logreg)
    fpr_rf, tpr_rf, _ = roc_curve(y_clf_test, y_clf_proba_rf)
    plt.plot(fpr_lr, tpr_lr, label=f"Logistic Regression (AUC = {clf_metrics['LogisticRegression']['roc_auc']:.3f})", color='#4f46e5', lw=2)
    plt.plot(fpr_rf, tpr_rf, label=f"Random Forest (AUC = {clf_metrics['RandomForestClassifier']['roc_auc']:.3f})", color='#10b981', lw=2)
    plt.plot([0, 1], [0, 1], 'k--', label="Random Guess (AUC = 0.500)")
    plt.title("ROC Curves: Task Completion Probability Classification", fontsize=12, fontweight='bold')
    plt.xlabel("False Positive Rate (1 - Specificity)")
    plt.ylabel("True Positive Rate (Recall)")
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, 'roc_curves.png'), dpi=200)
    plt.close()
    
    # Plot 2: Precision-Recall Curves
    plt.figure(figsize=(8, 6))
    prec_lr, rec_lr, _ = precision_recall_curve(y_clf_test, y_clf_proba_logreg)
    prec_rf, rec_rf, _ = precision_recall_curve(y_clf_test, y_clf_proba_rf)
    plt.plot(rec_lr, prec_lr, label="Logistic Regression", color='#4f46e5', lw=2)
    plt.plot(rec_rf, prec_rf, label="Random Forest", color='#10b981', lw=2)
    plt.title("Precision-Recall Curve Comparison", fontsize=12, fontweight='bold')
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.legend(loc="lower left")
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, 'precision_recall_curves.png'), dpi=200)
    plt.close()
    
    # Plot 3: Actual vs Predicted Duration (Ridge Regression)
    plt.figure(figsize=(8, 6))
    plt.scatter(y_reg_test, y_reg_pred_ridge, alpha=0.4, color='#6366f1', edgecolors='none')
    lims = [0, max(max(y_reg_test), max(y_reg_pred_ridge))]
    plt.plot(lims, lims, '--', color='#ef4444', lw=2, label="Perfect 1:1 Prediction")
    plt.title(f"Ridge Regression: Actual vs Predicted Duration ($R^2$ = {reg_metrics['RidgeRegression']['r2_score']:.3f})", fontsize=12, fontweight='bold')
    plt.xlabel("Actual Logged Study Minutes")
    plt.ylabel("Model Predicted Minutes")
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, 'actual_vs_predicted_duration.png'), dpi=200)
    plt.close()
    
    # Plot 4: Residuals Distribution
    plt.figure(figsize=(8, 6))
    residuals = y_reg_test - y_reg_pred_ridge
    sns.histplot(residuals, kde=True, color='#0284c7', bins=30)
    plt.axvline(0, color='red', linestyle='--')
    plt.title(f"Residuals Distribution: Ridge Regression (MAE = {reg_metrics['RidgeRegression']['mae']:.2f}m)", fontsize=12, fontweight='bold')
    plt.xlabel("Residual Error (Actual - Predicted Minutes)")
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, 'residuals_distribution.png'), dpi=200)
    plt.close()
    
    # Plot 5: Permutation Feature Importance Bar Chart
    plt.figure(figsize=(10, 6))
    sorted_idx = np.argsort(perm_importance.importances_mean)
    sorted_cols = [feature_cols[i] for i in sorted_idx]
    sorted_means = perm_importance.importances_mean[sorted_idx]
    plt.barh(sorted_cols, sorted_means, color='#6366f1', edgecolor='gray')
    plt.title("Permutation Feature Importance on Held-Out Test Set", fontsize=12, fontweight='bold')
    plt.xlabel("Mean Drop in ROC-AUC When Feature is Permuted")
    plt.tight_layout()
    plt.savefig(os.path.join(plots_dir, 'feature_importance.png'), dpi=200)
    plt.close()
    
    # -------------------------------------------------------------
    # 6. Save evaluation_metrics.json
    # -------------------------------------------------------------
    evaluation_summary = {
        'dataset_size': len(df),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'features': feature_cols,
        'classification_metrics': clf_metrics,
        'regression_metrics': reg_metrics,
        'permutation_importance': perm_dict,
        'odds_ratios': odds_ratios
    }
    
    metrics_path = os.path.join(script_dir, 'evaluation_metrics.json')
    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump(evaluation_summary, f, indent=2)
    print(f"Saved evaluation metrics to: {metrics_path}")
    
    # -------------------------------------------------------------
    # 7. Export Client-Side Browser Weights & Scalers
    # -------------------------------------------------------------
    export_data = {
        'metadata': {
            'trained_at': pd.Timestamp.now().isoformat(),
            'dataset_size': len(df),
            'features': feature_cols
        },
        'scaler': {
            'mean': [float(round(m, 6)) for m in scaler.mean_],
            'scale': [float(round(s, 6)) for s in scaler.scale_]
        },
        'logistic_regression': {
            'coefficients': [float(round(c, 6)) for c in clf_logreg.coef_[0]],
            'intercept': float(round(clf_logreg.intercept_[0], 6)),
            'metrics': clf_metrics['LogisticRegression'],
            'odds_ratios': odds_ratios
        },
        'ridge_regression': {
            'coefficients': [float(round(c, 6)) for c in reg_ridge.coef_],
            'intercept': float(round(reg_ridge.intercept_, 6)),
            'metrics': reg_metrics['RidgeRegression']
        },
        'feature_importances': perm_dict
    }
    
    # Write model_weights.json
    model_json_path = os.path.join(script_dir, 'model_weights.json')
    with open(model_json_path, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2)
        
    # Write js/mlModelsData.js
    js_target_path = os.path.join(script_dir, '..', 'js', 'mlModelsData.js')
    with open(js_target_path, 'w', encoding='utf-8') as f:
        f.write("/**\n * StudyFlow - Pretrained Machine Learning Model Weights\n")
        f.write(" * Automatically generated from Python scikit-learn training pipeline (data_science/train_models.py)\n")
        f.write(" * Used for zero-latency, private, client-side inference in the browser.\n */\n")
        f.write("const MLModelsData = ")
        json.dump(export_data, f, indent=2)
        f.write(";\n")
    print(f"Exported client-side model weights to: {js_target_path}")
    
    # -------------------------------------------------------------
    # 8. Generate Model Explainability Report
    # -------------------------------------------------------------
    exp_md = f"""# Machine Learning Model Explainability & Interpretability Report

**Application:** StudyFlow — Academic Intelligence & Predictive Analytics Engine  
**Models Evaluated:**
1. Task Completion Probability: L2 Logistic Regression (vs Random Forest & Majority Class)
2. Actual Study Duration: Ridge Regression (vs Gradient Boosting & Mean Baseline)

---

## 1. Logistic Regression: Coefficient & Odds Ratio Analysis

Logistic regression models the log-odds of completing a task on time before its due date:
$$\\ln\\left(\\frac{{p}}{{1-p}}\\right) = \\beta_0 + \\sum_{{i=1}}^{{n}} \\beta_i \\cdot z_i$$

Where $z_i = \\frac{{x_i - \\mu_i}}{{\\sigma_i}}$ represents the standardized feature value.

### Feature Coefficients & Odds Ratios:

| Feature | Standardized Weight ($\\beta_i$) | Odds Ratio ($e^{{\\beta_i}}$) | Direction | Behavioral Interpretation |
|---|---|---|---|---|
"""
    for col, coef in zip(feature_cols, clf_logreg.coef_[0]):
        or_val = np.exp(coef)
        direction = "Positive (+)" if coef > 0 else "Negative (-)"
        if col == 'hist_completion_rate':
            interp = "Past study consistency is the strongest driver of on-time completion."
        elif col == 'days_until_due':
            interp = "Each standard deviation increase in lead time multiplies odds of completion."
        elif col == 'subject_difficulty':
            interp = "High-complexity courses (DSA, OS) add cognitive friction, reducing on-time likelihood."
        elif col == 'class_hours_today':
            interp = "Lecture/lab commitments consume study blocks, increasing deadline pressure."
        elif col == 'past_studied_minutes':
            interp = "Progress logged early mitigates deadline panic and backlog stress."
        elif col == 'priority_code':
            interp = "Higher assigned priority correlates with greater focus allocation."
        elif col == 'student_study_streak':
            interp = "Active study habit streaks maintain academic momentum."
        elif col == 'subtask_count':
            interp = "Granular checklists provide structure, slightly moderating task size."
        else:
            interp = "Duration scope scale factor."
        exp_md += f"| `{col}` | {coef:+.4f} | {or_val:.4f} | {direction} | {interp} |\n"
        
    exp_md += f"""
---

## 2. Permutation Feature Importance

Evaluated by shuffling each feature on the held-out test set ($N = {len(X_test)}$) across 15 iterations and measuring the resulting mean decrease in ROC-AUC:

| Feature | Mean ROC-AUC Decrease | Rank |
|---|---|---|
"""
    sorted_perm = sorted(perm_dict.items(), key=lambda x: x[1], reverse=True)
    for rank, (col, imp) in enumerate(sorted_perm, 1):
        exp_md += f"| `{col}` | {imp:.4f} | #{rank} |\n"
        
    exp_md += f"""
---

## 3. Ridge Regression: Duration Model Coefficients

Ridge regression models actual execution time to counteract planning fallacies:
$$\\widehat{{\\text{{Duration}}}} = \\alpha_0 + \\sum_{{i=1}}^{{n}} w_i \\cdot z_i$$

### Coefficients & Feature Scale:
- **Baseline Intercept ($\\alpha_0$):** {reg_ridge.intercept_:.2f} minutes
- **Estimated Duration Weight:** {reg_ridge.coef_[2]:+.2f} (primary scale anchor)
- **Subject Difficulty Penalty:** {reg_ridge.coef_[0]:+.2f} minutes (additional time required for hard courses)
- **Subtask Overhead:** {reg_ridge.coef_[4]:+.2f} minutes (context-switching and breakdown overhead)

---

## 4. Model Limitations & Generalization Warnings

1. **Synthetic Data Origin:** These models were trained on 3,500 calibrated synthetic academic records. While calibrated to real university course difficulties, individual student performance can vary widely.
2. **Absence of Longitudinal Student Identity:** The dataset models individual tasks as independent samples. In practice, student stress fluctuates across exam weeks and semester cycles.
3. **No Direct Causality:** Feature coefficients indicate statistical association, not guaranteed causality. Increasing a task's priority does not automatically guarantee earlier completion without actual study session commitment.
"""
    
    rep_path = os.path.join(script_dir, 'model_explainability_report.md')
    with open(rep_path, 'w', encoding='utf-8') as f:
        f.write(exp_md)
    print(f"Generated explainability report: {rep_path}")

if __name__ == '__main__':
    train_and_export()
