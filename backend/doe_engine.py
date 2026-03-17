"""
doe_engine.py — Core DOE computation logic
All math lives here. FastAPI just calls these functions.
"""

import numpy as np
from typing import Dict, List


FACTOR_DEFAULTS = {
    "temperature": {"low": 220, "high": 260, "unit": "°C"},
    "pressure":    {"low": 0.5, "high": 1.5, "unit": "MPa"},
    "time":        {"low": 3,   "high": 7,   "unit": "s"},
}


def build_design_matrix() -> List[Dict]:
    """Return the 2³ full factorial design matrix (8 runs)."""
    runs = []
    run_num = 1
    for T in [-1, 1]:
        for P in [-1, 1]:
            for t in [-1, 1]:
                runs.append({
                    "run": run_num,
                    "temp_coded":  T,
                    "pres_coded":  P,
                    "time_coded":  t,
                    "temperature": 220 if T == -1 else 260,
                    "pressure":    0.5 if P == -1 else 1.5,
                    "time":        3   if t == -1 else 7,
                })
                run_num += 1
    return runs


def simulate_joint_strength(
    temp_coded: float,
    pres_coded: float,
    time_coded: float,
    seed_offset: int = 0
) -> float:
    """
    Physics-informed simulation of solder joint strength (MPa).
    Uses fixed noise per run for reproducibility.
    """
    rng = np.random.default_rng(42 + seed_offset)
    noise = rng.normal(0, 1.2)
    strength = (
        45.0
        + 8.0 * temp_coded
        + 4.5 * pres_coded
        + 3.0 * time_coded
        + 1.5 * temp_coded * pres_coded
        + 2.5 * temp_coded * time_coded
        + noise
    )
    return round(float(strength), 2)


def run_full_doe() -> Dict:
    """Run the complete 2³ DOE and return all results."""
    matrix = build_design_matrix()

    # Add joint strength to each run
    for i, run in enumerate(matrix):
        run["joint_strength"] = simulate_joint_strength(
            run["temp_coded"], run["pres_coded"], run["time_coded"],
            seed_offset=i
        )

    y = np.array([r["joint_strength"] for r in matrix])
    X_temp = np.array([r["temp_coded"] for r in matrix])
    X_pres = np.array([r["pres_coded"] for r in matrix])
    X_time = np.array([r["time_coded"] for r in matrix])

    # Main effects
    main_effects = {
        "Temperature": round(float(y[X_temp == 1].mean() - y[X_temp == -1].mean()), 3),
        "Pressure":    round(float(y[X_pres == 1].mean() - y[X_pres == -1].mean()), 3),
        "Time":        round(float(y[X_time == 1].mean() - y[X_time == -1].mean()), 3),
    }

    # Interaction effects
    TP = X_temp * X_pres
    Tt = X_temp * X_time
    Pt = X_pres * X_time

    interaction_effects = {
        "Temp × Pressure": round(float(y[TP == 1].mean() - y[TP == -1].mean()), 3),
        "Temp × Time":     round(float(y[Tt == 1].mean() - y[Tt == -1].mean()), 3),
        "Pressure × Time": round(float(y[Pt == 1].mean() - y[Pt == -1].mean()), 3),
    }

    all_effects = {**main_effects, **interaction_effects}
    dominant = max(main_effects, key=lambda k: abs(main_effects[k]))

    # Main effects chart data (low/high means per factor)
    main_effects_chart = {
        "Temperature": {
            "x": [220, 260],
            "y": [round(float(y[X_temp == -1].mean()), 2), round(float(y[X_temp == 1].mean()), 2)]
        },
        "Pressure": {
            "x": [0.5, 1.5],
            "y": [round(float(y[X_pres == -1].mean()), 2), round(float(y[X_pres == 1].mean()), 2)]
        },
        "Time": {
            "x": [3, 7],
            "y": [round(float(y[X_time == -1].mean()), 2), round(float(y[X_time == 1].mean()), 2)]
        },
    }

    # Optimal settings
    predicted_strength = 45.0 + 8.0 + 4.5 + 3.0 + 1.5 + 2.5
    lsl = 50.0

    # Cost of Quality
    coq = calculate_coq()

    return {
        "design_matrix": matrix,
        "main_effects": main_effects,
        "interaction_effects": interaction_effects,
        "all_effects_sorted": dict(
            sorted(all_effects.items(), key=lambda x: abs(x[1]), reverse=True)
        ),
        "dominant_factor": dominant,
        "grand_mean": round(float(y.mean()), 2),
        "main_effects_chart": main_effects_chart,
        "optimal": {
            "temperature": 260,
            "pressure": 1.5,
            "time": 7,
            "predicted_strength": round(predicted_strength, 1),
            "lsl": lsl,
            "safety_margin": round(predicted_strength - lsl, 1),
            "passes_spec": predicted_strength > lsl,
        },
        "coq": coq,
    }


def calculate_coq(
    volume: int = 50_000,
    baseline_defect_pct: float = 4.2,
    optimized_defect_pct: float = 0.8,
) -> Dict:
    def coq_for(defect_pct, scrap_rate, appraisal, prevention):
        defects  = volume * defect_pct / 100
        scrapped = defects * scrap_rate
        reworked = defects * (1 - scrap_rate)
        failure  = scrapped * 45 + reworked * 18
        total    = failure + appraisal + prevention
        return {
            "defects":          int(defects),
            "internal_failure": int(failure),
            "appraisal":        appraisal,
            "prevention":       prevention,
            "total":            int(total),
        }

    baseline  = coq_for(baseline_defect_pct,  0.30, 8_000,  2_000)
    optimized = coq_for(optimized_defect_pct, 0.15, 9_500,  5_000)
    monthly_saving = baseline["total"] - optimized["total"]

    return {
        "baseline":        baseline,
        "optimized":       optimized,
        "monthly_savings": monthly_saving,
        "annual_savings":  monthly_saving * 12,
        "defect_reduction_pct": round(
            (1 - optimized_defect_pct / baseline_defect_pct) * 100, 1
        ),
    }


def predict_strength(
    temp_coded: float,
    pres_coded: float,
    time_coded: float,
) -> Dict:
    """Predict joint strength for any factor combination."""
    strength = (
        45.0
        + 8.0 * temp_coded
        + 4.5 * pres_coded
        + 3.0 * time_coded
        + 1.5 * temp_coded * pres_coded
        + 2.5 * temp_coded * time_coded
    )
    return {
        "predicted_strength": round(strength, 2),
        "passes_spec": strength >= 50.0,
        "safety_margin": round(strength - 50.0, 2),
    }
