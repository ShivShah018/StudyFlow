/**
 * StudyFlow - Pretrained Machine Learning Model Weights
 * Automatically generated from Python scikit-learn training pipeline (data_science/train_models.py)
 * Used for zero-latency, private, client-side inference in the browser.
 */
const MLModelsData = {
  "metadata": {
    "trained_at": "2026-10-31T20:41:45.487574",
    "dataset_size": 3500,
    "features": [
      "subject_difficulty",
      "priority_code",
      "estimated_duration",
      "days_until_due",
      "subtask_count",
      "student_study_streak",
      "hist_completion_rate",
      "past_studied_minutes",
      "class_hours_today"
    ]
  },
  "scaler": {
    "mean": [
      0.696482,
      1.0125,
      95.6625,
      3.0275,
      2.168571,
      3.990357,
      0.67692,
      24.847143,
      3.146429
    ],
    "scale": [
      0.11937,
      0.701163,
      58.709777,
      3.459918,
      1.65922,
      1.971651,
      0.121647,
      32.676972,
      2.082921
    ]
  },
  "logistic_regression": {
    "coefficients": [
      -0.156372,
      0.041145,
      0.017781,
      -0.03744,
      0.050091,
      0.049152,
      0.173949,
      0.029324,
      -0.0906
    ],
    "intercept": 0.826832,
    "metrics": {
      "accuracy": 0.6929,
      "precision": 0.6929,
      "recall": 1.0,
      "f1_score": 0.8186,
      "roc_auc": 0.5804,
      "confusion_matrix": [
        [
          0,
          215
        ],
        [
          0,
          485
        ]
      ]
    }
  },
  "ridge_regression": {
    "coefficients": [
      1.8735,
      -0.075732,
      77.772167,
      -0.662691,
      3.578876,
      -0.019439,
      -0.117255,
      -1.391553,
      -0.128174
    ],
    "intercept": 125.441786,
    "metrics": {
      "rmse": 20.7,
      "mae": 14.15,
      "r2_score": 0.9377
    }
  },
  "feature_importances": {
    "subject_difficulty": 0.0956,
    "priority_code": 0.0381,
    "estimated_duration": 0.0727,
    "days_until_due": 0.1185,
    "subtask_count": 0.0677,
    "student_study_streak": 0.0957,
    "hist_completion_rate": 0.2908,
    "past_studied_minutes": 0.1537,
    "class_hours_today": 0.0671
  }
};
