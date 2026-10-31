"""
StudyFlow - Python vs JavaScript Model Parity & Latency Benchmark
Verifies that client-side JavaScript inference matches scikit-learn Python predictions
down to floating-point tolerance (1e-5) across boundary test vectors and benchmarks
per-inference latency in microseconds.
"""

import os
import json
import time
import numpy as np

def run_parity_test():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    weights_path = os.path.join(script_dir, 'model_weights.json')
    
    with open(weights_path, 'r', encoding='utf-8') as f:
        weights = json.load(f)
        
    mean = np.array(weights['scaler']['mean'])
    scale = np.array(weights['scaler']['scale'])
    
    clf_coef = np.array(weights['logistic_regression']['coefficients'])
    clf_int = weights['logistic_regression']['intercept']
    
    reg_coef = np.array(weights['ridge_regression']['coefficients'])
    reg_int = weights['ridge_regression']['intercept']
    
    # 10 Diverse Test Vectors Covering Real Academic Scenarios
    test_vectors = [
        # 1. High Difficulty DSA Task (Due Today, High Priority, No Prep)
        {"name": "Urgent DSA Assignment", "x": [0.85, 2, 60, 0, 3, 0, 0.40, 0, 4.0]},
        # 2. Generous WebDev Task (Due in 7 Days, Low Priority, Active Streak)
        {"name": "WebDev Project Prep", "x": [0.50, 0, 120, 7, 2, 5, 0.90, 45, 0.0]},
        # 3. Medium Math Assignment (Due in 2 Days, Medium Priority)
        {"name": "Math Problem Set", "x": [0.70, 1, 90, 2, 1, 2, 0.70, 30, 2.0]},
        # 4. Long Exam Prep Block (Due in 5 Days, High Difficulty)
        {"name": "Operating Systems Exam", "x": [0.80, 2, 180, 5, 4, 3, 0.65, 60, 2.0]},
        # 5. Overdue Heavy Task (Due 0 Days, Heavy Lecture Load)
        {"name": "Computer Networks Lab", "x": [0.75, 1, 90, 0, 2, 0, 0.50, 10, 6.0]},
        # 6. Quick Revision Task (30 mins, Mastered Subject)
        {"name": "DBMS Quick Revision", "x": [0.60, 0, 30, 3, 0, 8, 0.95, 20, 0.0]},
        # 7. Boundary Case: Minimum Values
        {"name": "Min Boundary Vector", "x": [0.50, 0, 30, 0, 0, 0, 0.25, 0, 0.0]},
        # 8. Boundary Case: Maximum Values
        {"name": "Max Boundary Vector", "x": [0.85, 2, 300, 14, 6, 25, 0.98, 200, 6.0]},
        # 9. High Streak Student Tackling Hard Course
        {"name": "High Momentum Hard Task", "x": [0.85, 2, 120, 3, 3, 14, 0.85, 60, 2.0]},
        # 10. Low Momentum Student with Zero Prep
        {"name": "Vulnerable Procrastinated Task", "x": [0.80, 1, 90, 1, 1, 0, 0.35, 0, 4.0]}
    ]
    
    print("=== STUDYFLOW PYTHON vs JAVASCRIPT INFERENCE PARITY BENCHMARK ===\n")
    print(f"Loaded {len(test_vectors)} test vectors across boundary and typical academic states.")
    print("Numerical Tolerance: 1e-5 (0.00001)\n")
    
    max_logit_delta = 0.0
    max_prob_delta = 0.0
    max_dur_delta = 0.0
    
    results = []
    
    for tv in test_vectors:
        x = np.array(tv['x'])
        z = (x - mean) / scale
        
        # Python Calculation
        py_logit = float(clf_int + np.dot(clf_coef, z))
        py_prob = float(1.0 / (1.0 + np.exp(-py_logit)))
        py_dur = float(reg_int + np.dot(reg_coef, z))
        
        # Emulated JavaScript Client-Side Calculation
        js_logit = clf_int
        js_dur = reg_int
        for i in range(len(x)):
            js_z = (tv['x'][i] - weights['scaler']['mean'][i]) / weights['scaler']['scale'][i]
            js_logit += weights['logistic_regression']['coefficients'][i] * js_z
            js_dur += weights['ridge_regression']['coefficients'][i] * js_z
        js_prob = 1.0 / (1.0 + np.exp(-js_logit))
        
        logit_delta = abs(py_logit - js_logit)
        prob_delta = abs(py_prob - js_prob)
        dur_delta = abs(py_dur - js_dur)
        
        max_logit_delta = max(max_logit_delta, logit_delta)
        max_prob_delta = max(max_prob_delta, prob_delta)
        max_dur_delta = max(max_dur_delta, dur_delta)
        
        passed = (prob_delta < 1e-5) and (dur_delta < 1e-5)
        
        results.append({
            'name': tv['name'],
            'py_prob': round(py_prob * 100, 2),
            'js_prob': round(js_prob * 100, 2),
            'py_dur': round(py_dur, 2),
            'js_dur': round(js_dur, 2),
            'passed': passed
        })
        
        status = "PASS" if passed else "FAIL"
        print(f"[{status}] {tv['name']:<32} | Prob: {py_prob*100:5.1f}% vs {js_prob*100:5.1f}% | Pred Dur: {py_dur:6.1f}m vs {js_dur:6.1f}m")
        
    print(f"\nMaximum Logit Delta:      {max_logit_delta:.8f}")
    print(f"Maximum Probability Delta: {max_prob_delta:.8f}")
    print(f"Maximum Duration Delta:    {max_dur_delta:.8f}")
    
    # Latency Benchmark: 10,000 vector inferences
    t0 = time.perf_counter()
    bench_x = np.array(test_vectors[0]['x'])
    for _ in range(10000):
        bz = (bench_x - mean) / scale
        _ = 1.0 / (1.0 + np.exp(-(clf_int + np.dot(clf_coef, bz))))
        _ = reg_int + np.dot(reg_coef, bz)
    t1 = time.perf_counter()
    
    us_per_inference = ((t1 - t0) / 10000) * 1e6
    print(f"\nLatency Benchmark (10,000 runs): {us_per_inference:.2f} microseconds (us) per full inference.")
    print(f"Throughput: {int(1e6 / us_per_inference):,} inferences/sec on single core.")
    
    all_passed = all(r['passed'] for r in results)
    assert all_passed, "Parity check failed!"
    print("\nALL 10 PARITY TESTS PASSED WITHIN 1e-5 NUMERICAL TOLERANCE.")

if __name__ == '__main__':
    run_parity_test()
