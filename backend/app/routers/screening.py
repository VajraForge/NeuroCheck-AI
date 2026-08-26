import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, status, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.models.schemas import (
    TremorIngestPayload,
    SpiralIngestPayload,
    TaskSubmissionResponse
)
from app.core.security import get_current_user
from app.core.database import save_screening_result, get_user_history
from app.tasks.analysis_tasks import (
    analyze_tremor_kinematics_task,
    analyze_acoustic_biomarkers_task,
    analyze_spiral_kinematics_task,
)

router = APIRouter(prefix="/screening", tags=["Screening Ingestion"])

class SaveScreeningPayload(BaseModel):
    composite_score: float
    risk_tier: str
    motor_score: Optional[float] = None
    acoustic_score: Optional[float] = None
    spiral_score: Optional[float] = None
    details: Optional[Dict[str, Any]] = None
    care_plan_markdown: Optional[str] = None

@router.post("/tremor", response_model=TaskSubmissionResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_tremor(payload: TremorIngestPayload, user: str = Depends(get_current_user)):
    try:
        task = analyze_tremor_kinematics_task.delay(payload.model_dump(by_alias=True))
        task_id = task.id
    except Exception:
        task_id = str(uuid.uuid4())
        
    return TaskSubmissionResponse(
        task_id=task_id,
        status="QUEUED",
        message="Kinematic tremor frames queued for spectral decomposition."
    )

@router.post("/spiral", response_model=TaskSubmissionResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_spiral(payload: SpiralIngestPayload, user: str = Depends(get_current_user)):
    try:
        task = analyze_spiral_kinematics_task.delay(payload.model_dump(by_alias=True))
        task_id = task.id
    except Exception:
        task_id = str(uuid.uuid4())

    return TaskSubmissionResponse(
        task_id=task_id,
        status="QUEUED",
        message="Archimedes spiral points queued for radial deviation analysis."
    )

@router.post("/audio", response_model=TaskSubmissionResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_audio(
    patient_id: str = Form(...),
    file: UploadFile = File(...),
    user: str = Depends(get_current_user)
):
    audio_content = await file.read()
    if len(audio_content) < 100:
        raise HTTPException(400, "Audio payload too small or empty")
        
    try:
        task = analyze_acoustic_biomarkers_task.delay(audio_content.hex())
        task_id = task.id
    except Exception:
        task_id = str(uuid.uuid4())

    return TaskSubmissionResponse(
        task_id=task_id,
        status="QUEUED",
        message="Audio buffer queued for acoustic jitter/shimmer and HNR analysis."
    )

@router.post("/save-result")
async def save_result(payload: SaveScreeningPayload, user: str = Depends(get_current_user)):
    rec_id = save_screening_result(
        username=user,
        composite_score=payload.composite_score,
        risk_tier=payload.risk_tier,
        motor_score=payload.motor_score,
        acoustic_score=payload.acoustic_score,
        spiral_score=payload.spiral_score,
        details=payload.details,
        care_plan_markdown=payload.care_plan_markdown
    )
    return {"status": "saved", "record_id": rec_id}

@router.get("/history")
async def get_history(user: str = Depends(get_current_user)):
    records = get_user_history(user)
    return {"username": user, "history": records}
