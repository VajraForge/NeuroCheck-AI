from app.celery_app import celery_app
from app.services.kinematic_engine import compute_hand_tremor_kinematics
from app.services.acoustic_engine import compute_acoustic_from_wav_bytes
from app.services.spiral_engine import compute_spiral_metrics
from app.services.llm_care_engine import generate_clinical_care_summary

@celery_app.task(bind=True, name="tasks.analyze_tremor_kinematics")
def analyze_tremor_kinematics_task(self, payload: dict) -> dict:
    self.update_state(state="PROCESSING", meta={"step": "Spectral Decomposition & PSD Estimation"})
    series = payload.get("series", [])
    avg_fps = payload.get("average_fps", payload.get("averageFps", 30.0))
    
    results = compute_hand_tremor_kinematics(series, average_fps=avg_fps)
    results["care_engine_notes"] = generate_clinical_care_summary("Tremor Kinematics", results)
    return results

@celery_app.task(bind=True, name="tasks.analyze_acoustic_biomarkers")
def analyze_acoustic_biomarkers_task(self, audio_bytes_hex: str) -> dict:
    self.update_state(state="PROCESSING", meta={"step": "Librosa Acoustic Jitter & Shimmer Extraction"})
    raw_bytes = bytes.fromhex(audio_bytes_hex)
    
    results = compute_acoustic_from_wav_bytes(raw_bytes)
    results["care_engine_notes"] = generate_clinical_care_summary("Acoustic Biomarkers", results)
    return results

@celery_app.task(bind=True, name="tasks.analyze_spiral_kinematics")
def analyze_spiral_kinematics_task(self, payload: dict) -> dict:
    self.update_state(state="PROCESSING", meta={"step": "Archimedes Radial Deviation & Tremor FFT"})
    points = payload.get("points", [])
    width = payload.get("width", 500.0)
    height = payload.get("height", 500.0)
    
    results = compute_spiral_metrics(
        points=points,
        center_x=width / 2.0,
        center_y=height / 2.0,
        a=payload.get("a", 2.0),
        b=payload.get("b", 6.0)
    )
    results["care_engine_notes"] = generate_clinical_care_summary("Archimedes Spiral", results)
    return results
