"""
StudyFlow - Academic Performance & Task Completion Dataset Generator
Generates a realistic, reproducible synthetic dataset for training predictive models
for task completion probability, actual study duration, and subject risk classification.
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)

def generate_dataset(n_samples=3500):
    subjects = ['DSA', 'DBMS', 'Operating Systems', 'Web Development', 'Computer Networks', 'Mathematics']
    subject_difficulties = {
        'DSA': 0.85,
        'Operating Systems': 0.80,
        'Computer Networks': 0.75,
        'Mathematics': 0.70,
        'DBMS': 0.60,
        'Web Development': 0.50
    }
    
    task_types = ['assignment', 'exam_prep', 'lab_report', 'project', 'revision']
    task_type_weights = [0.35, 0.20, 0.20, 0.15, 0.10]
    
    priorities = ['low', 'medium', 'high']
    priority_weights = [0.25, 0.50, 0.25]
    
    data = []
    
    for i in range(n_samples):
        subj = np.random.choice(subjects)
        diff = subject_difficulties[subj]
        t_type = np.random.choice(task_types, p=task_type_weights)
        priority = np.random.choice(priorities, p=priority_weights)
        p_code = 2 if priority == 'high' else (1 if priority == 'medium' else 0)
        
        # Base estimated duration (minutes) depending on task type
        if t_type == 'assignment':
            est_duration = int(np.random.choice([30, 45, 60, 90, 120], p=[0.1, 0.2, 0.4, 0.2, 0.1]))
        elif t_type == 'exam_prep':
            est_duration = int(np.random.choice([60, 90, 120, 180, 240], p=[0.1, 0.2, 0.3, 0.25, 0.15]))
        elif t_type == 'lab_report':
            est_duration = int(np.random.choice([45, 60, 90, 120], p=[0.2, 0.4, 0.3, 0.1]))
        elif t_type == 'project':
            est_duration = int(np.random.choice([90, 120, 180, 240, 300], p=[0.1, 0.25, 0.35, 0.2, 0.1]))
        else: # revision
            est_duration = int(np.random.choice([30, 45, 60, 90], p=[0.3, 0.4, 0.2, 0.1]))
            
        # Days until deadline (0 = due today, up to 14 days)
        days_until_due = int(np.clip(np.random.exponential(scale=3.5), 0, 14))
        
        # Subtasks count (0 to 6)
        subtask_count = int(np.random.choice([0, 1, 2, 3, 4, 5, 6], p=[0.2, 0.15, 0.25, 0.2, 0.1, 0.06, 0.04]))
        
        # Historical metrics for this simulated student
        student_study_streak = int(min(np.random.poisson(lam=4.0), 25))
        
        # Historical subject completion rate (between 0.25 and 0.98)
        hist_completion_rate = float(np.clip(np.random.normal(loc=0.72 - (diff * 0.15), scale=0.12), 0.25, 0.98))
        
        # Past study minutes logged on this specific task so far
        past_studied_minutes = 0
        if np.random.rand() > 0.35:
            past_studied_minutes = int(np.random.uniform(10, est_duration * 0.75))
            
        # Class commitments today (hours)
        class_hours_today = float(np.random.choice([0, 2, 4, 5, 6], p=[0.25, 0.15, 0.3, 0.2, 0.1]))
        is_weekend = 1 if class_hours_today == 0 and np.random.rand() > 0.6 else 0
        
        # Ground Truth Classification: completed_on_time
        # Calibrated latent score balancing positive and negative signals
        prep_ratio = past_studied_minutes / (est_duration + 1e-5)
        urgency_stress = 1.0 if (days_until_due <= 1 and est_duration > 90) else 0.0
        
        completion_logit = (
            3.2 * (hist_completion_rate - 0.65)
            + 0.25 * (p_code - 1.0)
            + 0.18 * min(days_until_due, 7)
            - 1.8 * (diff - 0.65)
            + 1.5 * (prep_ratio - 0.25)
            + 0.06 * min(student_study_streak, 10)
            - 0.15 * class_hours_today
            - 1.2 * urgency_stress
            - 0.10 * subtask_count
        )
        
        # Logistic noise to model real-world variance
        logistic_noise = np.random.logistic(loc=0.0, scale=0.6)
        completed_on_time = 1 if (completion_logit + logistic_noise) > 0 else 0
        
        # Ground Truth Regression: actual_duration (minutes)
        # Non-linear student friction and coordination overhead
        friction = 1.10 + (diff * 0.22) + (subtask_count * 0.03) - (min(student_study_streak, 10) * 0.01)
        dur_noise = np.random.normal(loc=0, scale=est_duration * 0.12)
        actual_duration = max(15, int(round(est_duration * friction + dur_noise)))
        
        # Subject risk level (Low=0, Medium=1, High=2)
        if hist_completion_rate < 0.58 or (diff >= 0.75 and days_until_due <= 2 and past_studied_minutes < est_duration * 0.2):
            risk_level = 2 # High risk
        elif hist_completion_rate < 0.72 or diff >= 0.70:
            risk_level = 1 # Medium risk
        else:
            risk_level = 0 # Low risk
            
        data.append({
            'task_id': f'TASK_{i:04d}',
            'subject': subj,
            'subject_difficulty': diff,
            'task_type': t_type,
            'priority': priority,
            'priority_code': p_code,
            'estimated_duration': est_duration,
            'days_until_due': days_until_due,
            'subtask_count': subtask_count,
            'student_study_streak': student_study_streak,
            'hist_completion_rate': round(hist_completion_rate, 3),
            'past_studied_minutes': past_studied_minutes,
            'remaining_minutes': max(0, est_duration - past_studied_minutes),
            'class_hours_today': class_hours_today,
            'is_weekend': is_weekend,
            'completed_on_time': completed_on_time,
            'actual_duration': actual_duration,
            'duration_overrun_pct': round(((actual_duration - est_duration) / est_duration) * 100, 1),
            'subject_risk_level': risk_level
        })
        
    df = pd.DataFrame(data)
    return df

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    df = generate_dataset(3500)
    csv_path = os.path.join(script_dir, 'academic_study_dataset.csv')
    df.to_csv(csv_path, index=False)
    print(f"Generated synthetic dataset with {len(df)} samples saved to: {csv_path}")
    print("\nFeature Summary:")
    print(df[['estimated_duration', 'days_until_due', 'hist_completion_rate', 'actual_duration', 'completed_on_time']].describe().T)
    print("\nTarget Class Distribution (completed_on_time):")
    print(df['completed_on_time'].value_counts(normalize=True))
    print("\nSubject Risk Distribution:")
    print(df['subject_risk_level'].value_counts(normalize=True))
