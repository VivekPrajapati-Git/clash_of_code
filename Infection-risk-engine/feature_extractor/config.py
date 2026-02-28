# feature_extractor/config.py
# ---------------------------------------------------------------
# All domain constants and scoring weights.
# Change behaviour by editing ONLY this file.
# ---------------------------------------------------------------

# Node group identifiers — must match Neo4j graph JSON exactly
GROUP_PATIENT:   str = "Patient"
GROUP_STAFF:     str = "Staff"
GROUP_LOCATION:  str = "Location"
GROUP_EQUIPMENT: str = "Equipment"

# Locations considered clinically high-risk
HIGH_RISK_LOCATIONS: set[str] = {"ICU_01", "OP_THEATER_1"}

# Interaction types with direct patient contact
HIGH_RISK_INTERACTIONS: set[str] = {"TREATMENT", "SCAN", "DOCTOR_VERIFY", "TRANSFER"}

# Timestamp formats present in Neo4j link JSON
TIMESTAMP_FORMATS: list[str] = [
    "%Y-%m-%dT%H:%M:%S.%fZ",   # "2026-02-25T03:09:46.000Z"
    "%Y-%m-%dT%H:%M:%SZ",       # "2026-02-25T03:09:46Z"
    "%Y-%m-%d %H:%M:%S",        # "2026-02-25 03:09:46"
]

# Reference timestamp format used in API request field
REFERENCE_TIME_FORMAT: str = "%Y-%m-%d %H:%M:%S"

# Lookback window for "recent interactions" feature
RECENT_WINDOW_HOURS: int = 24

# ---------------------------------------------------------------
# ML feature caps — must match FEATURE_BOUNDS in train.py
# ---------------------------------------------------------------
ML_FEATURE_CAPS: dict[str, int | float] = {
    "degree":             24,
    "infected_neighbors": 5,
    "exposure_time":      300,
    "centrality":         1.0,
}

# ---------------------------------------------------------------
# Rule-based scorer weights (epidemiologically motivated)
# ---------------------------------------------------------------
RULE_WEIGHTS: dict[str, float] = {
    "infected_neighbors":    3.0,   # flagged patients sharing staff/location
    "exposure_time":         0.008, # per minute  (300 min max → 2.4 pts)
    "shortest_path_inv":     2.0,   # multiplied by (1 / shortest_path)
    "centrality":            2.0,   # hub score 0–1
    "high_risk_location":    1.5,   # ICU / OP_THEATER present
    "n_staff_contacts":      0.2,   # per distinct staff member
    "indirect_exposure":     0.4,   # per staff who touched other patients
    "auto_trigger_flag":     1.0,   # system already flagged this patient
    "high_risk_interaction": 0.8,   # TREATMENT / SCAN / etc. present
    "interactions_24h":      0.15,  # per interaction in last 24 h
}

# Normalisation bounds → final score mapped to 1.0–10.0
RULE_RAW_MIN: float = 0.0
RULE_RAW_MAX: float = 20.0

# Risk level cut-offs (applied to normalised 1–10 score)
RISK_THRESHOLDS: list[tuple[float, str]] = [
    (8.0, "High"),
    (5.0, "Medium"),
    (0.0, "Low"),
]