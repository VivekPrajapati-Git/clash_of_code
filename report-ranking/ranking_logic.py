# ranking_logic.py
from schemas import RankingRequest, RankingResponse
from utils import normalize_score, get_priority_level
from config import (
    DISEASE_WEIGHTS,
    RAW_MAX,
    RAW_MIN,
    STATUS_WEIGHTS,
    SEVERITY_WEIGHTS,
    WARD_WEIGHTS,
    DEFAULT_DISEASE_WEIGHT,
    DEFAULT_STATUS_WEIGHT,
    DEFAULT_SEVERITY_WEIGHT,
    DEFAULT_WARD_WEIGHT,
)


def compute_priority(request):

    test_type = request.test_data.type
    result = request.test_data.result.upper()

    severity = None
    ward = None

    if request.patient_context:
        severity = request.patient_context.severity
        ward = request.patient_context.ward_type

    # Correct weight extraction
    disease_weight = DISEASE_WEIGHTS.get(test_type, DEFAULT_DISEASE_WEIGHT)
    status_weight = STATUS_WEIGHTS.get(result, DEFAULT_STATUS_WEIGHT)
    severity_weight = SEVERITY_WEIGHTS.get(severity, DEFAULT_SEVERITY_WEIGHT)
    ward_weight = WARD_WEIGHTS.get(ward, DEFAULT_WARD_WEIGHT)

    raw_score = (
        disease_weight
        + status_weight
        + severity_weight
        + ward_weight
    )

    print("Raw score:", raw_score)

    return normalize_score(raw_score, RAW_MIN, RAW_MAX)