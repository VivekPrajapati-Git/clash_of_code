# feature_extractor/scorer.py
# ---------------------------------------------------------------
# Deterministic rule-based risk scorer.
# Works with ZERO labeled data — runs on live graph immediately.
# All weights live in config.py.
# ---------------------------------------------------------------

from __future__ import annotations

from schemas import ExtractedFeatures, RuleScore
from config import RULE_WEIGHTS, RULE_RAW_MIN, RULE_RAW_MAX, RISK_THRESHOLDS


def compute_rule_score(features: ExtractedFeatures) -> RuleScore:
    """
    Scores infection risk from extracted graph features using
    a weighted formula. Every component is returned in the
    breakdown for full explainability.

    Formula:
        raw  = Σ (feature_value × weight)
        score = 1 + (raw - raw_min) × 9 / (raw_max - raw_min)
        score = clamp(score, 1.0, 10.0)
    """
    w = RULE_WEIGHTS

    components: dict[str, float] = {
        "infected_neighbors":    features.infected_neighbors    * w["infected_neighbors"],
        "exposure_time":         features.exposure_time         * w["exposure_time"],
        "shortest_path_inv":     (1 / features.shortest_path)  * w["shortest_path_inv"],
        "centrality":            features.centrality            * w["centrality"],
        "high_risk_location":    features.high_risk_location    * w["high_risk_location"],
        "n_staff_contacts":      features.n_staff_contacts      * w["n_staff_contacts"],
        "indirect_exposure":     features.indirect_exposure_staff * w["indirect_exposure"],
        "auto_trigger_flag":     features.auto_trigger_flag     * w["auto_trigger_flag"],
        "high_risk_interaction": features.high_risk_interaction * w["high_risk_interaction"],
        "interactions_24h":      features.interactions_24h      * w["interactions_24h"],
    }

    raw  = sum(components.values())
    span = RULE_RAW_MAX - RULE_RAW_MIN

    risk_score = (
        round(max(1.0, min(10.0, 1.0 + (raw - RULE_RAW_MIN) * 9.0 / span)), 2)
        if span > 0 else 5.0
    )

    risk_level = next(
        level for threshold, level in RISK_THRESHOLDS
        if risk_score >= threshold
    )

    return RuleScore(
        raw_score=        round(raw, 4),
        risk_score=       risk_score,
        risk_level=       risk_level,
        weight_breakdown= {k: round(v, 4) for k, v in components.items()},
    )