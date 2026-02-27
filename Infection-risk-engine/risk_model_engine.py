"""
model.py
--------
Inference module for the Vigilance-Net infection risk prediction pipeline.

Loads the trained LogisticRegression model and StandardScaler, validates
inputs, and returns an infection risk probability for a given patient.

Usage:
    from model import predict_risk, RiskResult

    result = predict_risk({
        "degree": 10,
        "infected_neighbors": 3,
        "exposure_time": 180,
        "shortest_path": 1,
        "centrality": 0.72,
    })

    print(result.probability)   # 0.9341
    print(result.risk_level)    # "High"
    print(result.label)         # 1
"""

import os
from dataclasses import dataclass

import joblib
import numpy as np
import pandas as pd


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MODEL_PATH  = os.path.join("models", "risk_model.pkl")
SCALER_PATH = os.path.join("models", "scaler.pkl")

FEATURES = [
    "degree",
    "infected_neighbors",
    "exposure_time",
    "shortest_path",
    "centrality",
]

# Valid input ranges — must match the dataset generation config
FEATURE_BOUNDS: dict[str, tuple[float, float]] = {
    "degree":             (0,   24),
    "infected_neighbors": (0,    5),
    "exposure_time":      (0,  300),
    "shortest_path":      (1,    3),   # min=1 — zero would cause div/0 in graph logic
    "centrality":         (0.0, 1.0),
}

# Probability thresholds for risk label
RISK_THRESHOLDS = [
    (0.70, "High"),
    (0.40, "Medium"),
    (0.00, "Low"),
]


# ---------------------------------------------------------------------------
# Lazy model loader (loads once on first call, not at import time)
# ---------------------------------------------------------------------------

_model  = None
_scaler = None


def _load_artifacts() -> tuple:
    global _model, _scaler
    if _model is None or _scaler is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at '{MODEL_PATH}'. Run train.py first."
            )
        if not os.path.exists(SCALER_PATH):
            raise FileNotFoundError(
                f"Scaler not found at '{SCALER_PATH}'. Run train.py first."
            )
        _model  = joblib.load(MODEL_PATH)
        _scaler = joblib.load(SCALER_PATH)
    return _model, _scaler


# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

def _validate(features: dict[str, float]) -> None:
    """Raises ValueError if any feature is missing or out of expected range."""
    missing = [f for f in FEATURES if f not in features]
    if missing:
        raise ValueError(f"Missing required features: {missing}")

    errors = []
    for feature in FEATURES:
        value = features[feature]
        lo, hi = FEATURE_BOUNDS[feature]
        if not (lo <= value <= hi):
            errors.append(f"  '{feature}' = {value} is outside valid range [{lo}, {hi}]")

    if errors:
        raise ValueError("Input validation failed:\n" + "\n".join(errors))


# ---------------------------------------------------------------------------
# Output dataclass
# ---------------------------------------------------------------------------

@dataclass
class RiskResult:
    probability: float   # 0.0 – 1.0
    label:       int     # 0 = not infected, 1 = infected
    risk_level:  str     # "Low" | "Medium" | "High"
    features:    dict    # echo back the input for traceability


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def predict_risk(features: dict[str, float]) -> RiskResult:
    """
    Predicts infection risk probability for a single patient node.

    Args:
        features: dict with keys matching FEATURES list.
                  Values must be within FEATURE_BOUNDS.

    Returns:
        RiskResult with probability, binary label, risk level, and input echo.

    Raises:
        ValueError: if features are missing or out of range.
        FileNotFoundError: if model/scaler artifacts are not found.
    """
    _validate(features)

    model, scaler = _load_artifacts()

    # Pass as DataFrame to preserve feature names — suppresses sklearn warning
    X = pd.DataFrame([features], columns=FEATURES)
    X_scaled = scaler.transform(X)

    probability = float(model.predict_proba(X_scaled)[0][1])
    probability = round(probability, 4)

    label = int(probability >= 0.5)
    risk_level = next(level for threshold, level in RISK_THRESHOLDS if probability >= threshold)

    return RiskResult(
        probability=probability,
        label=label,
        risk_level=risk_level,
        features=features,
    )


# ---------------------------------------------------------------------------
# CLI smoke test  —  python model.py
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    test_cases = [
        {
            "name": "High-risk patient (many infected neighbors, close to source)",
            "features": {"degree": 8, "infected_neighbors": 5, "exposure_time": 250, "shortest_path": 1, "centrality": 0.85},
        },
        {
            "name": "Low-risk patient (isolated, no infected neighbors)",
            "features": {"degree": 2, "infected_neighbors": 0, "exposure_time": 20, "shortest_path": 3, "centrality": 0.05},
        },
        {
            "name": "Moderate-risk patient",
            "features": {"degree": 10, "infected_neighbors": 2, "exposure_time": 130, "shortest_path": 2, "centrality": 0.45},
        },
    ]

    print("\n" + "=" * 52)
    print("  Vigilance-Net — model.py Smoke Test")
    print("=" * 52)

    for case in test_cases:
        result = predict_risk(case["features"])
        bar = "█" * int(result.probability * 20)
        print(f"\n  {case['name']}")
        print(f"  Probability : {result.probability:.4f}  {bar}")
        print(f"  Label       : {result.label}  ({result.risk_level} Risk)")

    print("\n" + "=" * 52)
    print("  Testing input validation...")
    try:
        predict_risk({"degree": 5, "infected_neighbors": 2, "exposure_time": 100, "shortest_path": 0, "centrality": 0.5})
    except ValueError as e:
        print(f"  Caught expected error:\n{e}")

    print("=" * 52 + "\n")