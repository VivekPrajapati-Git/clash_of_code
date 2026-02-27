# schemas.py
from enum import Enum
from pydantic import BaseModel, Field


class TestType(str, Enum):
    blood = "Blood"
    pcr = "PCR"
    culture = "Culture"


class TestFor(str, Enum):
    mdr_bacteria = "MDR_Bacteria"
    covid = "COVID"
    tb = "TB"
    general_infection = "General_Infection"


class Status(str, Enum):
    positive = "Positive"
    negative = "Negative"
    borderline = "Borderline"


class PatientSeverity(str, Enum):
    stable = "Stable"
    moderate = "Moderate"
    critical = "Critical"


class WardType(str, Enum):
    general = "General"
    isolation = "Isolation"
    icu = "ICU"


class RankingRequest(BaseModel):
    type_of_test: TestType = Field(..., description="Type of diagnostic test performed")
    test_for: TestFor = Field(..., description="Disease or condition being tested for")
    status: Status = Field(..., description="Test result status")
    patient_severity: PatientSeverity = Field(..., description="Current clinical severity of patient")
    ward_type: WardType = Field(..., description="Ward where the patient is admitted")


class RankingResponse(BaseModel):
    priority_score: int = Field(..., ge=1, le=10, description="Urgency score from 1 (lowest) to 10 (highest)")
    priority_level: str = Field(..., description="Low | Medium | High")
    score_breakdown: dict[str, int] = Field(..., description="Individual weight contributions for explainability")