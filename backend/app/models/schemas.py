from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal, Dict, Any

class Point3D(BaseModel):
    x: float
    y: float
    z: float
    visibility: Optional[float] = None

class KinematicFrameModel(BaseModel):
    timestamp_ms: float = Field(..., alias="timestampMs")
    landmarks: List[List[Point3D]]
    handedness: List[str]
    fps: float
    model_config = ConfigDict(populate_by_name=True)

class TremorIngestPayload(BaseModel):
    patient_id: str = Field(..., description="Subject or session ID (must not contain direct PHI)")
    duration_ms: float
    average_fps: float
    series: List[KinematicFrameModel]

class SpiralPointModel(BaseModel):
    x: float
    y: float
    pressure: Optional[float] = 0.5
    timestamp_ms: float = Field(..., alias="timestampMs")
    model_config = ConfigDict(populate_by_name=True)

class SpiralIngestPayload(BaseModel):
    patient_id: str
    width: float = 500.0
    height: float = 500.0
    duration_ms: float
    points: List[SpiralPointModel]
    a: Optional[float] = 2.0
    b: Optional[float] = 6.0

class TaskSubmissionResponse(BaseModel):
    task_id: str
    status: str
    message: str

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None

# Legacy / Direct Computation Schemas
class TapEvent(BaseModel):
    zone: Literal["A", "B"]
    t_ms: float = Field(..., description="Timestamp in milliseconds since test start")

class TapAnalysisRequest(BaseModel):
    events: List[TapEvent]

class TapAnalysisResponse(BaseModel):
    tap_rate_hz: float
    amplitude_decay_pct: float
    rhythm_cv: float
    risk_score: float

class AcousticAnalysisRequest(BaseModel):
    sample_rate: int
    pcm: List[float] = Field(..., description="Mono float32 PCM samples, [-1, 1]")

class AcousticAnalysisResponse(BaseModel):
    mean_f0_hz: float
    jitter_pct: float
    shimmer_pct: float
    risk_score: float

class SpiralAnalysisResponse(BaseModel):
    rms_deviation_px: float
    velocity_reversals: int
    dominant_tremor_hz: float
    risk_score: float

class CompositeRiskRequest(BaseModel):
    motor: Optional[float] = None
    acoustic: Optional[float] = None
    spiral: Optional[float] = None

class CompositeRiskResponse(BaseModel):
    composite: float
    tier: Literal["low", "moderate", "high"]

class DossierRequest(BaseModel):
    motor: Optional[float] = None
    acoustic: Optional[float] = None
    spiral: Optional[float] = None
    tap_detail: Optional[TapAnalysisResponse] = None
    acoustic_detail: Optional[AcousticAnalysisResponse] = None
    spiral_detail: Optional[SpiralAnalysisResponse] = None

class CarePlanRequest(BaseModel):
    composite_score: float
    motor_score: Optional[float] = None
    acoustic_score: Optional[float] = None
    spiral_score: Optional[float] = None
    patient_tier: str
    details: Optional[Dict[str, Any]] = None

class CarePlanResponse(BaseModel):
    care_plan_markdown: str

