"""
app.py
------
FastAPI entry point for the Vigilance-Net Infection Risk Engine.

Endpoints:
    GET  /              — health check
    GET  /health        — detailed service health (model load status)
    POST /predict-risk  — infection risk prediction for a patient node

Run:
    uvicorn app:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from schemas import RiskRequest, RiskResponse
from .risk_model_engine import predict_risk
# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Vigilance-Net — Infection Risk Engine",
    description=(
        "Predicts infection risk probability for hospital patient nodes "
        "based on contact graph features. Part of the Vigilance-Net "
        "proactive infection intelligence system."
    ),
    version="1.0.0",
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", tags=["Health"])
def root() -> dict:
    return {
        "service": "Vigilance-Net Infection Risk Engine",
        "status":  "running",
        "version": "1.0.0",
        "docs":    "/docs",
    }


@app.get("/health", tags=["Health"])
def health() -> dict:
    """
    Verifies that the model and scaler artifacts are loaded and ready.
    Returns 503 if artifacts are missing so the orchestration layer
    can detect an unhealthy instance before routing traffic to it.
    """
    try:
        _load_artifacts()
        return {"status": "healthy", "model": "loaded", "scaler": "loaded"}
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/predict-risk", response_model=RiskResponse, tags=["Prediction"])
def predict(request: RiskRequest) -> RiskResponse:
    """
    Accepts patient graph features and returns an infection risk score.

    - **probability** is calibrated between 0.0 (no risk) and 1.0 (certain infection)
    - **risk_level** is Low / Medium / High based on probability thresholds
    - **label** is the binary prediction: 1 = infected, 0 = not infected
    - **features_received** echoes the input for audit traceability
    """
    try:
        result = predict_risk(request.features.model_dump())
    except ValueError as e:
        # Catches domain-level validation errors from model.py
        raise HTTPException(status_code=422, detail=str(e))
    except FileNotFoundError as e:
        # Model artifacts missing — server misconfiguration
        raise HTTPException(status_code=503, detail=str(e))

    return RiskResponse(
        risk_probability=result.probability,
        risk_level=result.risk_level,
        label=result.label,
        features_received=request.features,
    )