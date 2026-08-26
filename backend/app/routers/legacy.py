import io
from datetime import datetime
import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.models.schemas import (
    TapAnalysisRequest, TapAnalysisResponse,
    AcousticAnalysisRequest, AcousticAnalysisResponse,
    SpiralIngestPayload, SpiralAnalysisResponse,
    CompositeRiskRequest, CompositeRiskResponse,
    DossierRequest, CarePlanRequest, CarePlanResponse
)
from app.services.kinematic_engine import compute_tap_metrics
from app.services.acoustic_engine import compute_acoustic_from_pcm
from app.services.spiral_engine import compute_spiral_metrics
from app.services.llm_care_engine import generate_gemini_care_plan

router = APIRouter(tags=["Synchronous / Direct Analysis"])

@router.post("/analyze/tap", response_model=TapAnalysisResponse)
def analyze_tap(req: TapAnalysisRequest):
    try:
        res = compute_tap_metrics([e.model_dump() for e in req.events])
        return TapAnalysisResponse(**res)
    except ValueError as e:
        raise HTTPException(422, str(e))

@router.post("/analyze/acoustic", response_model=AcousticAnalysisResponse)
def analyze_acoustic(req: AcousticAnalysisRequest):
    try:
        res = compute_acoustic_from_pcm(req.pcm, req.sample_rate)
        return AcousticAnalysisResponse(**res)
    except ValueError as e:
        raise HTTPException(422, str(e))

@router.post("/analyze/spiral", response_model=SpiralAnalysisResponse)
def analyze_spiral(req: SpiralIngestPayload):
    try:
        res = compute_spiral_metrics(
            points=[p.model_dump(by_alias=True) for p in req.points],
            center_x=req.width / 2.0,
            center_y=req.height / 2.0,
            a=req.a or 2.0,
            b=req.b or 6.0
        )
        return SpiralAnalysisResponse(**res)
    except ValueError as e:
        raise HTTPException(422, str(e))

def _stratify(composite: float) -> str:
    if composite < 31:
        return "low"
    if composite < 66:
        return "moderate"
    return "high"

@router.post("/risk/composite", response_model=CompositeRiskResponse)
def composite_risk(req: CompositeRiskRequest):
    vals = [v for v in (req.motor, req.acoustic, req.spiral) if v is not None]
    if not vals:
        raise HTTPException(422, "At least one modality score is required")
    composite = float(np.mean(vals))
    return CompositeRiskResponse(composite=round(composite, 2), tier=_stratify(composite))

@router.post("/export/dossier")
def export_dossier(req: DossierRequest):
    vals = [v for v in (req.motor, req.acoustic, req.spiral) if v is not None]
    if not vals:
        raise HTTPException(422, "No scores to export")
    composite = float(np.mean(vals))
    tier = _stratify(composite)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=22 * mm, bottomMargin=22 * mm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", parent=styles["Title"], fontSize=18)
    body = styles["BodyText"]

    tier_hex = {"low": "#1d9e75", "moderate": "#ba7517", "high": "#a32d2d"}[tier]

    elements = [
        Paragraph("NeuroCheck AI — Clinical Dossier", title_style),
        Spacer(1, 4 * mm),
        Paragraph(f"Generated {datetime.now().strftime('%Y-%m-%d %H:%M')}", body),
        Spacer(1, 8 * mm),
        Paragraph(f"Composite risk index: <b>{composite:.1f} / 100</b> (<font color='{tier_hex}'>{tier} risk</font>)", body),
        Spacer(1, 6 * mm),
    ]

    rows = [["Modality", "Score", "Detail"]]
    if req.motor is not None:
        d = req.tap_detail
        detail = f"{d.tap_rate_hz} Hz tap rate, {d.amplitude_decay_pct}% decay" if d else "—"
        rows.append(["Kinematic (tap)", f"{req.motor:.1f}", detail])
    if req.acoustic is not None:
        d = req.acoustic_detail
        detail = f"{d.jitter_pct}% jitter, {d.shimmer_pct}% shimmer" if d else "—"
        rows.append(["Acoustic (voice)", f"{req.acoustic:.1f}", detail])
    if req.spiral is not None:
        d = req.spiral_detail
        detail = f"{d.rms_deviation_px}px RMS dev, {d.velocity_reversals} reversals" if d else "—"
        rows.append(["Fine-motor (spiral)", f"{req.spiral:.1f}", detail])

    table = Table(rows, colWidths=[45 * mm, 25 * mm, 90 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#12201c")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 10 * mm))
    elements.append(Paragraph(
        "Note: Scoring in this dossier is produced by the NeuroCheck AI multi-modal composite risk model for clinical triage.",
        styles["Italic"]
    ))

    doc.build(elements)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=neurocheck_dossier.pdf"},
    )

@router.post("/generate-care-plan", response_model=CarePlanResponse)
def generate_care_plan(req: CarePlanRequest):
    plan_md = generate_gemini_care_plan(
        composite_score=req.composite_score,
        patient_tier=req.patient_tier,
        motor_score=req.motor_score,
        acoustic_score=req.acoustic_score,
        spiral_score=req.spiral_score,
        details=req.details
    )
    return CarePlanResponse(care_plan_markdown=plan_md)

