"""
StudyFlow - Predictive Model Training, Validation & Weight Export Pipeline
Trains:
  1. Task Completion Probability Classifier (Logistic Regression & Random Forest)
  2. Actual Duration Predictor (Ridge Regression & Gradient Boosting Regressor)
  3. Subject Risk Scorer
Exports trained model coefficients and normalizers to JSON and JavaScript (js/mlModelsData.js)
for real-time, lightweight client-side browser inference without external APIs.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, mean_squared_error, mean_absolute_error, r2_score
)

def train_and_export():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'academic_study_dataset.csv')
    
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
    # Classification Features
    feature_cols = [
        'subject_difficulty',        # float [0.5 - 0.85]
        'priority_code',             # int [0, 1, 2]
        'estimated_duration',        # minutes
        'days_until_due',            # days
        'subtask_count',             # int
        'student_study_streak',      # days
        'hist_completion_rate',      # float [0.25 - 0.98]
        'past_studied_minutes',      # minutes
        'class_hours_today'          # hours
    ]
    
    X = df[feature_cols].copy()
    y_clf = df['completed_on_time'].values
    y_reg = df['actual_duration'].values
    
    # 80/20 Stratified Train-Test Split
    X_train, X_test, y_clf_train, y_clf_test, y_reg_train, y_reg_test = train_test_split(
        X, y_clf, y_reg, test_size=0.20, random_state=42, stratify=y_clf
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # -------------------------------------------------------------
    # 2. Model 1: Task Completion Probability (Classification)
    # -------------------------------------------------------------
    # Model 1A: Logistic Regression (Interpretable baseline & browser export)
    clf_logreg = LogisticRegression(C=1.0, max_iter=1000, random_state=42)
    clf_logreg.fit(X_train_scaled, y_clf_train)
    
    y_clf_pred_logreg = clf_logreg.predict(X_test_scaled)
    y_clf_proba_logreg = clf_logreg.predict_proba(X_test_scaled)[:, 1]
    
    # Model 1B: Random Forest Classifier (Non-linear comparison)
    clf_rf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    clf_rf.fit(X_train, y_clf_train)
    y_clf_pred_rf = clf_rf.predict(X_test)
    y_clf_proba_rf = clf_rf.predict_proba(X_test)[:, 1]
    
    # Classification Metrics
    clf_metrics = {
        'LogisticRegression': {
            'accuracy': float(round(accuracy_score(y_clf_test, y_clf_pred_logreg), 4)),
            'precision': float(round(precision_score(y_clf_test, y_clf_pred_logreg), 4)),
            'recall': float(round(recall_score(y_clf_test, y_clf_pred_logreg), 4)),
            'f1_score': float(round(f1_score(y_clf_test, y_clf_pred_logreg), 4)),
            'roc_auc': float(round(roc_auc_score(y_clf_test, y_clf_proba_logreg), 4)),
            'confusion_matrix': confusion_matrix(y_clf_test, y_clf_pred_logreg).tolist()
        },
        'RandomForestClassifier': {
            'accuracy': float(round(accuracy_score(y_clf_test, y_clf_pred_rf), 4)),
            'precision': float(round(precision_score(y_clf_test, y_clf_pred_rf), 4)),
            'recall': float(round(recall_score(y_clf_test, y_clf_pred_rf), 4)),
            'f1_score': float(round(f1_score(y_clf_test, y_clf_pred_rf), 4)),
            'roc_auc': float(round(roc_auc_score(y_clf_test, y_clf_proba_rf), 4))
        }
    }
    
    # -------------------------------------------------------------
    # 3. Model 2: Actual Task Duration (Regression)
    # -------------------------------------------------------------
    # Model 2A: Ridge Regression (Interpretable baseline & browser export)
    reg_ridge = Ridge(alpha=1.0)
    reg_ridge.fit(X_train_scaled, y_reg_train)
    
    y_reg_pred_ridge = reg_ridge.predict(X_test_scaled)
    
    # Model 2B: Gradient Boosting Regressor (Comparison)
    reg_gbr = GradientBoostingRegressor(n_estimators=100, max_depth=4, random_state=42)
    reg_gbr.fit(X_train, y_reg_train)
    y_reg_pred_gbr = reg_gbr.predict(X_test)
    
    # Regression Metrics
    reg_metrics = {
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
    
    print("\n=== CLASSIFICATION EVALUATION (Task Completion Probability) ===")
    for model_name, m in clf_metrics.items():
        print(f"[{model_name}] Accuracy: {m['accuracy']:.4f} | ROC-AUC: {m['roc_auc']:.4f} | F1: {m['f1_score']:.4f}")
        
    print("\n=== REGRESSION EVALUATION (Actual Duration in Minutes) ===")
    for model_name, m in reg_metrics.items():
        print(f"[{model_name}] RMSE: {m['rmse']:.2f} min | MAE: {m['mae']:.2f} min | R²: {m['r2_score']:.4f}")
        
    # -------------------------------------------------------------
    # 4. Save Evaluation Metrics to JSON
    # -------------------------------------------------------------
    evaluation_summary = {
        'dataset_size': len(df),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'features': feature_cols,
        'classification_metrics': clf_metrics,
        'regression_metrics': reg_metrics,
        'feature_importance_rf': {
            col: float(round(imp, 4)) 
            for col, imp in zip(feature_cols, clf_rf.feature_importances_)
        }
    }
    
    metrics_path = os.path.join(script_dir, 'evaluation_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(evaluation_summary, f, indent=2)
    print(f"\nSaved evaluation summary to: {metrics_path}")
    
    # -------------------------------------------------------------
    # 5. Export Model Parameters for Client-Side Browser Inference
    # -------------------------------------------------------------
    # Prepare exact weights, intercepts, and scaling parameters for JavaScript
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
            'metrics': clf_metrics['LogisticRegression']
        },
        'ridge_regression': {
            'coefficients': [float(round(c, 6)) for c in reg_ridge.coef_],
            'intercept': float(round(reg_ridge.intercept_, 6)),
            'metrics': reg_metrics['RidgeRegression']
        },
        'feature_importances': evaluation_summary['feature_importance_rf']
    }
    
    # Write to data_science/model_weights.json
    model_json_path = os.path.join(script_dir, 'model_weights.json')
    with open(model_json_path, 'w') as f:
        json.dump(export_data, f, indent=2)
        
    # Write directly to js/mlModelsData.js as a browser-ready constant
    js_target_path = os.path.join(script_dir, '..', 'js', 'mlModelsData.js')
    with open(js_target_path, 'w', encoding='utf-8') as f:
        f.write("/**\n * StudyFlow - Pretrained Machine Learning Model Weights\n")
        f.write(" * Automatically generated from Python scikit-learn training pipeline (data_science/train_models.py)\n")
        f.write(" * Used for zero-latency, private, client-side inference in the browser.\n */\n")
        f.write("const MLModelsData = ")
        json.dump(export_data, f, indent=2)
        f.write(";\n")
        
    print(f"Exported client-side model weights to: {js_target_path}")

if __name__ == '__main__':
    train_and_export()
