# utils.py
from config import PRIORITY_THRESHOLDS, RAW_MIN, RAW_MAX


def normalize_score(raw, raw_min, raw_max):
    if raw_max == raw_min:
        return 5

    normalized = 1 + (raw - raw_min) * 9 / (raw_max - raw_min)
    return max(1, min(10, round(normalized)))

def get_priority_level(score: int) -> str:
    """
    Returns a human-readable priority label based on configured thresholds.
    Falls back to 'Unknown' if thresholds are misconfigured.
    """
    for level, (low, high) in PRIORITY_THRESHOLDS.items():
        if low <= score <= high:
            return level
    return "Unknown"