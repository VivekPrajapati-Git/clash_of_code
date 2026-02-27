# config.py
# All scoring weights live here. Adjust without touching business logic.

# Raw weight contributions (will be summed and normalized to 1–10)
# Max possible raw score = 4 + 3 + 2 + 1 = 10  (already in range, but we clamp for safety)

DISEASE_WEIGHTS: dict[str, int] = {
    "MDR_Bacteria": 4,
    "TB": 3,
    "COVID": 2,
    "General_Infection": 1,
}

STATUS_WEIGHTS: dict[str, int] = {
    "Positive": 3,
    "Borderline": 2,
    "Negative": 1,
}

SEVERITY_WEIGHTS: dict[str, int] = {
    "Critical": 2,
    "Moderate": 1,
    "Stable": 0,
}

WARD_WEIGHTS: dict[str, int] = {
    "ICU": 1,
    "Isolation": 1,
    "General": 0,
}

# Normalization bounds
RAW_MIN: int = 2   # Negative + Stable + General + General_Infection
RAW_MAX: int = 10  # Positive + Critical + ICU + MDR_Bacteria

# Priority thresholds (applied to final 1–10 score)
PRIORITY_THRESHOLDS: dict[str, tuple[int, int]] = {
    "Low":    (1, 4),
    "Medium": (5, 7),
    "High":   (8, 10),
}

# Fallback defaults when an unknown enum value is received
DEFAULT_DISEASE_WEIGHT: int = 1
DEFAULT_STATUS_WEIGHT: int = 1
DEFAULT_SEVERITY_WEIGHT: int = 0
DEFAULT_WARD_WEIGHT: int = 0