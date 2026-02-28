# config.py
# All scoring weights live here. Adjust without touching business logic.

# Raw weight contributions (will be summed and normalized to 1–10)
# Max possible raw score = 4 + 3 + 2 + 1 = 10  (already in range, but we clamp for safety)

DISEASE_WEIGHTS = {
    "MDR_Bacteria": 4,
    "COVID-19": 3,
    "TB": 3,
    "General_Infection": 1
}

STATUS_WEIGHTS: dict[str, int] = {
    "POSITIVE": 3,
    "BORDERLINE": 1,
    "NEGATIVE": -2
}

SEVERITY_WEIGHTS: dict[str, int] = {
    "Critical": 3,
    "Moderate": 1,
    "Stable": 0,
}

WARD_WEIGHTS: dict[str, int] = {
    "ICU": 2,
    "Isolation": 1,
    "General": 0,
}

# Normalization bounds
RAW_MIN: int = -1   # Negative + Stable + General + General_Infection
RAW_MAX: int = 12  # Positive + Critical + ICU + MDR_Bacteria

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