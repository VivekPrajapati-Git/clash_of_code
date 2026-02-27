# app.py
from fastapi import FastAPI
from schemas import RankingRequest, RankingResponse
from ranking_logic import compute_priority

app = FastAPI(
    title="Vigilance-Net — Report Ranking Service",
    description="Deterministic, explainable clinical urgency scoring for medical reports.",
    version="1.0.0",
)


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok", "service": "report-ranking"}


@app.post("/rank", response_model=RankingResponse)
def rank_report(request: RankingRequest) -> RankingResponse:
    """
    Accepts a medical report's metadata and returns a priority score (1–10)
    with an explanatory breakdown of contributing weights.
    """
    return compute_priority(request)