"""
schemas.py
----------
Pydantic request/response models for the Vigilance-Net
infection risk prediction API.

Provides input validation, range enforcement, and structured
output — keeping all contract definitions in one place.
"""

from pydantic import BaseModel, Field, model_validator


# ---------------------------------------------------------------------------
# Input
# ---------------------------------------------------------------------------

class RiskFeatures(BaseModel):
    degree: int = Field(
        ...,
        ge=0, le=24,
        description="Number of direct contacts this patient node has in the graph",
        examples=[10],
    )
    infected_neighbors: int = Field(
        ...,
        ge=0, le=5,
        description="Number of direct contacts who are currently infected",
        examples=[3],
    )
    exposure_time: int = Field(
        ...,
        ge=0, le=300,
        description="Cumulative exposure duration in minutes",
        examples=[150],
    )
    shortest_path: int = Field(
        ...,
        ge=1, le=3,
        description="Graph distance (hops) to the nearest confirmed infection source. Minimum 1.",
        examples=[2],
    )
    centrality: float = Field(
        ...,
        ge=0.0, le=1.0,
        description="Betweenness centrality score — how central this node is in the contact graph",
        examples=[0.65],
    )

    @model_validator(mode="after")
    def infected_neighbors_cannot_exceed_degree(self) -> "RiskFeatures":
        """
        A patient cannot have more infected neighbors than total neighbors.
        This is a domain-level constraint that type hints alone cannot catch.
        """
        if self.infected_neighbors > self.degree:
            raise ValueError(
                f"infected_neighbors ({self.infected_neighbors}) "
                f"cannot exceed degree ({self.degree})"
            )
        return self


class RiskRequest(BaseModel):
    features: RiskFeatures


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

class RiskResponse(BaseModel):
    risk_probability: float = Field(
        ...,
        ge=0.0, le=1.0,
        description="Model-predicted infection probability (0.0 = no risk, 1.0 = certain infection)",
        examples=[0.8732],
    )
    risk_level: str = Field(
        ...,
        description="Human-readable risk category: Low | Medium | High",
        examples=["High"],
    )
    label: int = Field(
        ...,
        ge=0, le=1,
        description="Binary prediction: 1 = infected, 0 = not infected",
        examples=[1],
    )
    features_received: RiskFeatures = Field(
        ...,
        description="Echo of input features for traceability and audit logging",
    )