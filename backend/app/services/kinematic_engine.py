import numpy as np
import scipy.signal
from typing import Dict, Any, List

def compute_tap_metrics(events: List[Dict[str, Any]]) -> Dict[str, float]:
    """Analyzes alternating tap timestamps to calculate bradykinesia rate, decay, and rhythm CV."""
    if len(events) < 4:
        raise ValueError("Need at least 4 alternating taps to analyze")

    t = np.array([e["t_ms"] for e in events], dtype=float)
    intervals = np.diff(t)

    duration_s = (t[-1] - t[0]) / 1000.0
    tap_rate_hz = (len(events) - 1) / duration_s if duration_s > 0 else 0.0

    half = len(intervals) // 2
    first_mean = intervals[:half].mean() if half > 0 else intervals.mean()
    second_mean = intervals[half:].mean() if len(intervals) - half > 0 else first_mean
    decay_ratio = second_mean / first_mean if first_mean > 0 else 1.0

    cv = intervals.std() / intervals.mean() if intervals.mean() > 0 else 0.0

    risk = 0.0
    risk += max(0.0, 3.5 - tap_rate_hz) * 18
    risk += max(0.0, decay_ratio - 1) * 120
    risk += min(40.0, cv * 80)
    risk = min(100.0, risk)

    return {
        "tap_rate_hz": round(float(tap_rate_hz), 3),
        "amplitude_decay_pct": round(float((decay_ratio - 1) * 100), 2),
        "rhythm_cv": round(float(cv), 4),
        "risk_score": round(float(risk), 2),
    }

def compute_hand_tremor_kinematics(series: List[Dict[str, Any]], average_fps: float = 30.0) -> Dict[str, Any]:
    """
    Extracts 21-point MediaPipe hand landmark kinematic series.
    Calculates index finger Euclidean velocity and Welch PSD to detect resting vs action tremor (3-12 Hz).
    """
    timestamps = []
    disp_x, disp_y = [], []

    for frame in series:
        landmarks = frame.get("landmarks", [])
        if landmarks and len(landmarks[0]) > 8:
            timestamps.append(frame.get("timestampMs", frame.get("timestamp_ms", 0)) / 1000.0)
            # Landmark 8: Index Finger Tip
            disp_x.append(landmarks[0][8]["x"])
            disp_y.append(landmarks[0][8]["y"])

    if len(disp_x) < 20:
        raise ValueError("Insufficient tracking frames for spectral analysis (minimum 20 required)")

    t_arr = np.array(timestamps)
    dt = np.diff(t_arr)
    dt[dt <= 0] = 1.0 / average_fps

    dx = np.diff(np.array(disp_x)) / dt
    dy = np.diff(np.array(disp_y)) / dt
    velocity = np.sqrt(dx**2 + dy**2)

    # Welch's Power Spectral Density
    nperseg = min(len(velocity), 128)
    if nperseg < 8:
        nperseg = len(velocity)
        
    freqs, psd = scipy.signal.welch(velocity, fs=average_fps, nperseg=nperseg)

    # 3-12 Hz Tremor window
    mask = (freqs >= 3.0) & (freqs <= 12.0)
    if np.any(mask):
        peak_freq = float(freqs[mask][np.argmax(psd[mask])])
        tremor_power = float(np.sum(psd[mask]))
    else:
        peak_freq = 0.0
        tremor_power = 0.0

    classification = "Normal"
    risk_score = 15.0
    if tremor_power > 0.03:
        if 4.0 <= peak_freq <= 6.0:
            classification = "Parkinsonian Resting Tremor Spectrum (4-6 Hz)"
            risk_score = min(95.0, 50.0 + tremor_power * 100)
        elif 6.0 < peak_freq <= 10.0:
            classification = "Postural / Kinetic Tremor Spectrum (6-10 Hz)"
            risk_score = min(85.0, 40.0 + tremor_power * 80)
        else:
            classification = "Physiological Oscillatory Activity"
            risk_score = 30.0

    return {
        "dominant_frequency_hz": round(peak_freq, 2),
        "spectral_power": round(tremor_power, 4),
        "total_frames_analyzed": len(series),
        "clinical_classification": classification,
        "risk_score": round(float(risk_score), 2),
    }
