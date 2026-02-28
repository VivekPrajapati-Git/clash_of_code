# feature_extractor/app.py
# ---------------------------------------------------------------
# FastAPI microservice: Graph Feature Extractor
#
# Accepts Neo4j graph JSON, extracts features per patient,
# calls the ML risk engine internally, and returns a single
# blended final_score — Node.js makes ONE call, gets everything.
#
# Endpoints:
#   GET  /                  — health check
#   GET  /health            — service + ML dependency status
#   POST /extract-features  — score a single patient
#   POST /extract-all       — score every patient, sorted by risk
#
# Run:
#   uvicorn app:app --reload --port 8001
#
# Expects ml-risk-engine running on:
#   ML_SERVICE_URL (default: http://localhost:8000)
# ---------------------------------------------------------------

from __future__ import annotations

import os
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, HTTPException

from config import REFERENCE_TIME_FORMAT, GROUP_PATIENT, RISK_THRESHOLDS
from extractor import extract_features, get_graph_context
from schemas import (
    ExtractedFeatures, FeatureRequest, FeatureResponse,
    FinalScore, GraphData, MLScore, RuleScore,
)
from scorer import compute_rule_score


# ---------------------------------------------------------------
# Config
# ---------------------------------------------------------------

ML_SERVICE_URL  = os.getenv("ML_SERVICE_URL", "http://localhost:8000")
ML_PREDICT_PATH = "/predict-risk"
ML_TIMEOUT_SEC  = 3.0   # fail fast — don't block dashboard for a slow ML service

RULE_WEIGHT = 0.6
ML_WEIGHT   = 0.4


# ---------------------------------------------------------------
# App
# ---------------------------------------------------------------

app = FastAPI(
    title="Vigilance-Net — Graph Feature Extractor",
    description=(
        "Accepts a Neo4j graph JSON (nodes + links), extracts infection-risk "
        "features per patient, calls the ML risk engine internally, and returns "
        "a blended final_score. Node.js makes one call and gets everything."
    ),
    version="3.0.0",
)


# ---------------------------------------------------------------
# ML service caller  (non-blocking on failure)
# ---------------------------------------------------------------

async def _call_ml_service(ml_features: dict) -> MLScore:
    """
    POSTs extracted features to the ml-risk-engine.
    Returns MLScore(available=False) if the service is unreachable,
    so the rest of the pipeline continues without interruption.
    """
    payload = {"features": ml_features}
    try:
        async with httpx.AsyncClient(timeout=ML_TIMEOUT_SEC) as client:
            resp = await client.post(
                f"{ML_SERVICE_URL}{ML_PREDICT_PATH}",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return MLScore(
                probability=data["risk_probability"],
                risk_level= data["risk_level"],
                available=  True,
            )
    except Exception:
        # ML service down, slow, or returned an error — degrade gracefully
        return MLScore(probability=0.0, risk_level="Unknown", available=False)


# ---------------------------------------------------------------
# Blend rule + ML scores
# ---------------------------------------------------------------

def _blend(rule_score: RuleScore, ml_score: MLScore) -> FinalScore:
    """
    Combines rule-based and ML scores into a single final score.

    When ML is available:
        final = (rule_score × 0.6) + (ml_probability × 10 × 0.4)

    When ML is unavailable:
        final = rule_score  (pure fallback, mode='rule_only')
    """
    if ml_score.available:
        raw   = (rule_score.risk_score * RULE_WEIGHT) + (ml_score.probability * 10 * ML_WEIGHT)
        score = round(max(1.0, min(10.0, raw)), 2)
        mode  = "blended"
    else:
        score = rule_score.risk_score
        mode  = "rule_only"

    risk_level = next(lvl for threshold, lvl in RISK_THRESHOLDS if score >= threshold)

    return FinalScore(
        score=       score,
        risk_level=  risk_level,
        rule_weight= RULE_WEIGHT,
        ml_weight=   ML_WEIGHT,
        mode=        mode,
    )


# ---------------------------------------------------------------
# Core builder  (async — awaits ML call)
# ---------------------------------------------------------------

async def _build_response(
    patient_id: str,
    graph:      GraphData,
    ref_time:   datetime,
) -> FeatureResponse:
    features   = extract_features(patient_id, graph, ref_time)
    rule_score = compute_rule_score(features)
    context    = get_graph_context(patient_id, graph)

    ml_ready = {
        "degree":             features.degree,
        "infected_neighbors": features.infected_neighbors,
        "exposure_time":      features.exposure_time,
        "shortest_path":      features.shortest_path,
        "centrality":         features.centrality,
    }

    ml_score    = await _call_ml_service(ml_ready)
    final_score = _blend(rule_score, ml_score)

    return FeatureResponse(
        patient_id=        patient_id,
        features=          features,
        rule_score=        rule_score,
        ml_score=          ml_score,
        final_score=       final_score,
        ml_ready_features= ml_ready,
        graph_context=     context,
    )


# ---------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------

def _resolve_reference_time(raw: str | None) -> datetime:
    if raw:
        try:
            return datetime.strptime(raw, REFERENCE_TIME_FORMAT)
        except ValueError:
            raise HTTPException(
                status_code=422,
                detail=f"reference_time must be in format: {REFERENCE_TIME_FORMAT}",
            )
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ---------------------------------------------------------------
# Routes
# ---------------------------------------------------------------

@app.get("/", tags=["Health"])
def root() -> dict:
    return {
        "service":      "Vigilance-Net Graph Feature Extractor",
        "version":      "3.0.0",
        "status":       "running",
        "ml_service":   ML_SERVICE_URL,
        "docs":         "/docs",
    }


@app.get("/health", tags=["Health"])
async def health() -> dict:
    """
    Checks this service and whether the ML risk engine is reachable.
    Safe to poll — ML check is a lightweight GET /health.
    """
    ml_status = "unreachable"
    try:
        async with httpx.AsyncClient(timeout=ML_TIMEOUT_SEC) as client:
            r = await client.get(f"{ML_SERVICE_URL}/health")
            if r.status_code == 200:
                ml_status = "healthy"
    except Exception:
        pass

    return {
        "status":             "healthy",
        "ml_risk_engine":     ml_status,
        "ml_service_url":     ML_SERVICE_URL,
        "fallback_on_ml_down": True,
    }


@app.post("/extract-features", response_model=FeatureResponse, tags=["Extraction"])
async def extract_single(request: FeatureRequest) -> FeatureResponse:
    """
    Extracts features and computes all three scores for a **single patient**.

    **Node.js sends:**
    ```json
    {
      "patient_id": "PFID_B_6436",
      "reference_time": "2026-02-27 15:00:00",
      "graph": {
        "nodes": [{"id": "...", "group": "Patient", "flagged": false}, ...],
        "links": [{"source": "...", "target": "...", "type": "...", "time": "..."}]
      }
    }
    ```

    **Returns:**
    - `rule_score`   — deterministic, works with zero labels
    - `ml_score`     — from trained LogisticRegression (second signal)
    - `final_score`  — blended score, **use this on the dashboard**
    - `graph_context`— human-readable summary for audit log
    """
    ref_time    = _resolve_reference_time(request.reference_time)
    patient_ids = {n.id for n in request.graph.nodes if n.group == GROUP_PATIENT}

    if request.patient_id not in patient_ids:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Patient '{request.patient_id}' not found in graph. "
                f"Patient nodes present: {sorted(patient_ids)}"
            ),
        )

    return await _build_response(request.patient_id, request.graph, ref_time)


@app.post("/extract-all", response_model=list[FeatureResponse], tags=["Extraction"])
async def extract_all(request: FeatureRequest) -> list[FeatureResponse]:
    """
    Extracts features and scores for **all patients** in the graph.

    Results are sorted by `final_score.score` descending —
    highest-risk patient is always first.

    Use for full dashboard refreshes or real-time priority queue updates.
    The `patient_id` field in the request body is ignored.
    """
    ref_time    = _resolve_reference_time(request.reference_time)
    patient_ids = sorted(n.id for n in request.graph.nodes if n.group == GROUP_PATIENT)

    if not patient_ids:
        raise HTTPException(
            status_code=404,
            detail="No Patient nodes found in the provided graph.",
        )

    import asyncio
    results = await asyncio.gather(*[
        _build_response(pid, request.graph, ref_time)
        for pid in patient_ids
    ])

    results = sorted(results, key=lambda r: r.final_score.score, reverse=True)
    return results