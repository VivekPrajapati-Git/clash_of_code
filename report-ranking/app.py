from fastapi import FastAPI
from schemas import RankingRequest, RankingResponse
from ranking_logic import compute_priority

app = FastAPI()


@app.post("/rank", response_model=RankingResponse)
def rank_report(request: RankingRequest):

    score = compute_priority(request)

    if score >= 8:
        level = "High"
    elif score >= 4:
        level = "Medium"
    else:
        level = "Low"

    return {
        "priority_score": score,
        "priority_level": level
    }