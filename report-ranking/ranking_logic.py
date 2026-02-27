# ranking_logic.py
from schemas import RankingRequest, RankingResponse
from utils import normalize_score, get_priority_level
from config import (
    DISEASE_WEIGHTS,
    STATUS_WEIGHTS,
    SEVERITY_WEIGHTS,
    WARD_WEIGHTS,
    DEFAULT_DISEASE_WEIGHT,
    DEFAULT_STATUS_WEIGHT,
    DEFAULT_SEVERITY_WEIGHT,
    DEFAULT_WARD_WEIGHT,
)


def compute_priority(request: RankingRequest) -> RankingResponse:
    """
    Computes a clinical urgency score from weighted input factors.

    Formula:
        raw_score = disease_weight + status_weight + severity_weight + ward_weight
        priority_score = normalize(raw_score) → clamped to [1, 10]
    """
    disease_weight   = DISEASE_WEIGHTS.get(request.test_for.value, DEFAULT_DISEASE_WEIGHT)
    status_weight    = STATUS_WEIGHTS.get(request.status.value, DEFAULT_STATUS_WEIGHT)
    severity_weight  = SEVERITY_WEIGHTS.get(request.patient_severity.value, DEFAULT_SEVERITY_WEIGHT)
    ward_weight      = WARD_WEIGHTS.get(request.ward_type.value, DEFAULT_WARD_WEIGHT)

    raw_score = disease_weight + status_weight + severity_weight + ward_weight

    priority_score = normalize_score(raw_score)
    priority_level = get_priority_level(priority_score)

    return RankingResponse(
        priority_score=priority_score,
        priority_level=priority_level,
        score_breakdown={
            "disease_weight":  disease_weight,
            "status_weight":   status_weight,
            "severity_weight": severity_weight,
            "ward_weight":     ward_weight,
            "raw_score":       raw_score,
        },
    )