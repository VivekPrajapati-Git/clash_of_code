# feature_extractor/schemas.py
# ---------------------------------------------------------------
# Pydantic models for graph-JSON-based feature extraction.
# Input mirrors the Neo4j graph format exactly.
# ---------------------------------------------------------------

from __future__ import annotations

from pydantic import BaseModel, Field


# ---------------------------------------------------------------
# Graph input models  (mirrors Neo4j JSON structure)
# ---------------------------------------------------------------

class GraphNode(BaseModel):
    """A single node in the Neo4j graph."""
    id:      str  = Field(..., description="Unique node identifier, e.g. PFID_B_6436, ICU_01, ADM_303")
    label:   str  = Field(..., description="Display label")
    group:   str  = Field(..., description="Node type: Patient | Staff | Location | Equipment")
    flagged: bool = Field(False, description="True if this patient was auto-triggered / system-flagged")


class GraphLink(BaseModel):
    """A single directed edge in the Neo4j graph."""
    source: str        = Field(..., description="Source node ID")
    target: str        = Field(..., description="Target node ID")
    type:   str        = Field(..., description="Relationship type: VISITED, TREATMENT, CLEANING, LOCATED_AT, etc.")
    time:   str | None = Field(None, description="ISO-8601 timestamp of the interaction (optional)")


class GraphData(BaseModel):
    """The Neo4j graph payload — nodes + links."""
    nodes: list[GraphNode] = Field(..., description="All nodes in the graph")
    links: list[GraphLink] = Field(..., description="All edges in the graph")


class FeatureRequest(BaseModel):
    """
    Request body for /extract-features and /extract-all.

    Node.js sends the full hospital graph (all patients, staff,
    locations, equipment) plus the target patient_id.
    reference_time defaults to current UTC if omitted.
    """
    patient_id:     str        = Field(..., description="Patient node ID to score, e.g. PFID_B_6436")
    graph:          GraphData  = Field(..., description="Full Neo4j graph snapshot")
    reference_time: str | None = Field(None, description="Scoring reference time (YYYY-MM-DD HH:MM:SS). Defaults to now.")


# ---------------------------------------------------------------
# Output models
# ---------------------------------------------------------------

class ExtractedFeatures(BaseModel):
    """All features derived from the patient's graph neighbourhood."""

    # ML model inputs (fed directly to /predict-risk)
    degree:             int   = Field(..., description="Total unique nodes directly connected to this patient")
    infected_neighbors: int   = Field(..., description="Flagged patients sharing staff or location with this patient")
    exposure_time:      int   = Field(..., description="Minutes between first and last timestamped interaction")
    shortest_path:      int   = Field(..., description="1=same location as flagged patient, 2=shared staff, 3=no link")
    centrality:         float = Field(..., description="Fraction of other patients reachable via this patient's connections")

    # Extra graph features (rule scorer + dashboard)
    n_staff_contacts:        int = Field(..., description="Distinct staff who interacted with this patient")
    n_locations_visited:     int = Field(..., description="Distinct locations this patient has been recorded in")
    n_interaction_types:     int = Field(..., description="Distinct interaction types on edges touching this patient")
    high_risk_location:      int = Field(..., description="1 if patient was in ICU or OP_THEATER, else 0")
    high_risk_interaction:   int = Field(..., description="1 if any TREATMENT/SCAN/TRANSFER edge exists, else 0")
    interactions_24h:        int = Field(..., description="Timestamped interactions within the last 24 hours")
    indirect_exposure_staff: int = Field(..., description="Staff who also have edges to other patients")
    auto_trigger_flag:       int = Field(..., description="1 if this patient node has flagged=true, else 0")
    shared_equipment_count:  int = Field(..., description="Equipment pieces located in this patient's locations")


class RuleScore(BaseModel):
    """Output of the deterministic, label-free rule scorer."""
    raw_score:        float            = Field(..., description="Unnormalised weighted sum")
    risk_score:       float            = Field(..., description="Normalised score 1.0–10.0")
    risk_level:       str              = Field(..., description="Low | Medium | High")
    weight_breakdown: dict[str, float] = Field(..., description="Per-component contribution for explainability")


class MLScore(BaseModel):
    """Output from the ml-risk-engine (port 8000)."""
    probability: float = Field(..., description="Infection probability 0.0–1.0 from trained LogisticRegression")
    risk_level:  str   = Field(..., description="Low | Medium | High")
    available:   bool  = Field(..., description="False if ML service was unreachable — final_score falls back to rule only")


class FinalScore(BaseModel):
    """
    Blended score combining rule-based and ML signals.

    Formula (when ML available):
        final = (rule_score × 0.6) + (ml_probability × 10 × 0.4)

    Rule score carries 60% weight — grounded in live graph data.
    ML carries 40% weight — trained on synthetic data; weight increases
    as real lab Positive results accumulate and model is retrained.

    If ML service is unreachable, final_score = rule_score (graceful fallback).
    """
    score:       float = Field(..., description="Blended final score 1.0–10.0")
    risk_level:  str   = Field(..., description="Low | Medium | High")
    rule_weight: float = Field(0.6, description="Weight applied to rule_score in blend")
    ml_weight:   float = Field(0.4, description="Weight applied to ml_probability × 10 in blend")
    mode:        str   = Field(..., description="'blended' or 'rule_only' when ML service is unavailable")


class FeatureResponse(BaseModel):
    """Complete response for a single patient — primary output for the dashboard."""
    patient_id:        str               = Field(..., description="Patient this response belongs to")
    features:          ExtractedFeatures = Field(..., description="All extracted graph features")
    rule_score:        RuleScore         = Field(..., description="Rule-based risk score (no labels required)")
    ml_score:          MLScore           = Field(..., description="ML model output (second signal)")
    final_score:       FinalScore        = Field(..., description="Blended score — use this on the dashboard")
    ml_ready_features: dict[str, float]  = Field(..., description="5-feature dict that was sent to /predict-risk")
    graph_context:     dict              = Field(..., description="Human-readable context for dashboard/debug")