from pydantic import BaseModel
from typing import Optional


# --- Test Data From Lab ---
class TestData(BaseModel):
    type: str
    result: str
    lab_tech_id: str


# --- Patient Context From Backend (Mongo/DB) ---
class PatientContext(BaseModel):
    severity: Optional[str] = None
    ward_type: Optional[str] = None


# --- Main Request Model ---
class RankingRequest(BaseModel):
    test_data: TestData
    patient_context: Optional[PatientContext] = None


# --- Response Model ---
class RankingResponse(BaseModel):
    priority_score: int
    priority_level: str