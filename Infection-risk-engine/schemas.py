# schemas.py

from pydantic import BaseModel


class RiskFeatures(BaseModel):
    degree: int
    infected_neighbors: int
    exposure_time: int
    shortest_path: int
    centrality: float


class RiskRequest(BaseModel):
    features: RiskFeatures


class RiskResponse(BaseModel):
    risk_probability: float
    risk_level: str
    label: int
    features_received: RiskFeatures