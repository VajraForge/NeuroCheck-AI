import os
from typing import Dict, Any, Optional

def generate_clinical_care_summary(modality: str, sanitized_metrics: Dict[str, Any]) -> str:
    """
    Generates sanitized clinical observations without leaking biometric tensors or PII.
    Only aggregated statistical metrics are evaluated.
    """
    if modality == "Tremor Kinematics":
        freq = sanitized_metrics.get("dominant_frequency_hz", 0)
        power = sanitized_metrics.get("spectral_power", 0)
        cls_name = sanitized_metrics.get("clinical_classification", "Normal")
        if power > 0.03:
            return (
                f"Automated Clinical Observation: Rhythmic oscillatory displacement observed at {freq} Hz "
                f"({cls_name}). Power density: {power}. Recommend MDS-UPDRS Part III clinical review."
            )
        return "Kinematic trajectory exhibits smooth finger-tapping rhythm within normative reference values."

    elif modality == "Acoustic Biomarkers":
        jitter = sanitized_metrics.get("jitter_pct", 0)
        hnr = sanitized_metrics.get("hnr_db", 0)
        dys = sanitized_metrics.get("dysphonia_indicator", "Normal")
        if dys == "Elevated":
            return (
                f"Acoustic phonation instability detected: Local Jitter {jitter}%, HNR {hnr} dB. "
                "Suggests phonatory perturbation and glottal micro-tremor."
            )
        return "Vocal stability parameters demonstrate consistent fundamental frequency and intact harmonic-to-noise ratio."

    elif modality == "Archimedes Spiral":
        rms = sanitized_metrics.get("rms_deviation_px", 0)
        rev = sanitized_metrics.get("velocity_reversals", 0)
        tremor_hz = sanitized_metrics.get("dominant_tremor_hz", 0)
        if rms > 20.0 or rev > 5:
            return (
                f"Spatial tracking reveals marked radial departure ({rms}px RMS error, {rev} velocity reversals). "
                f"Peak fine-motor tremor frequency: {tremor_hz} Hz."
            )
        return "Archimedes spiral drawing reflects intact spatial trajectory maintenance and smooth motor execution."

    return "Assessment complete. Quantitative biomarkers stored securely."

def generate_gemini_care_plan(
    composite_score: float,
    patient_tier: str,
    motor_score: Optional[float] = None,
    acoustic_score: Optional[float] = None,
    spiral_score: Optional[float] = None
) -> str:
    """
    Calls Google Gemini via LangChain if GEMINI_API_KEY is present,
    or falls back to a deterministic clinical care regimen.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            from langchain_core.prompts import PromptTemplate
            from langchain_google_genai import ChatGoogleGenerativeAI

            llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", google_api_key=api_key)
            template = """
            You are a clinical neurologist and rehabilitation specialist.
            Assessment Results:
            - Composite Risk Score: {composite_score}/100 (Tier: {patient_tier})
            - Motor Score: {motor_score}
            - Acoustic Score: {acoustic_score}
            - Fine-motor Spiral Score: {spiral_score}

            Generate a structured, personalized 7-day physical therapy regimen and home care checklist in Markdown format.
            """
            prompt = PromptTemplate(
                input_variables=["composite_score", "patient_tier", "motor_score", "acoustic_score", "spiral_score"],
                template=template
            )
            res = llm.invoke(prompt.format(
                composite_score=composite_score,
                patient_tier=patient_tier,
                motor_score=motor_score or "N/A",
                acoustic_score=acoustic_score or "N/A",
                spiral_score=spiral_score or "N/A"
            ))
            return str(res.content)
        except Exception as e:
            # Fallback to clinical template
            pass

    # Deterministic Clinical Care Regimen
    return f"""# 7-Day Neurological Motor & Speech Rehabilitation Regimen

**Patient Risk Stratification:** {patient_tier.upper()} (Composite Score: {composite_score:.1f}/100)

---

### Day 1–3: Fine Motor Coordination & Finger Agility
* **Task 1: Rapid Finger-Thumb Opposition**
  * 3 sets of 20 repetitions per hand. Focus on maximum excursion and rhythmic consistency.
* **Task 2: Targeted Tracing & Spiral Control**
  * Trace Archimedean templates on tablet or paper twice daily to reinforce spatial stability.

---

### Day 4–5: Vocal Phonation & Respiratory Support
* **Task 1: Sustained Vowel Exercises**
  * Hold steady "ah" phonation for 10–15 seconds at steady pitch, 5 repetitions morning and evening.
* **Task 2: Pitch Glides (Ascending & Descending)**
  * Smooth vocal frequency transitions to enhance laryngeal muscle control.

---

### Day 6–7: Bilateral Dual-Task Integration & Balance
* **Task 1: Tandem Walking with Cognitive Counting**
  * 10 minutes walking heel-to-toe while counting backwards by 3s.
* **Task 2: Large-Amplitude Hand Movements (LSVT BIG principles)**
  * High-velocity reach-and-grasp drills to counteract bradykinesia decrement.

---

*Clinical Note: Re-evaluate with NeuroCheck AI screening at the conclusion of Day 7.*
"""
