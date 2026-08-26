import numpy as np
from scipy.fft import rfft, rfftfreq
from typing import Dict, Any, List

def compute_spiral_metrics(
    points: List[Dict[str, Any]],
    center_x: float = 250.0,
    center_y: float = 250.0,
    a: float = 2.0,
    b: float = 6.0
) -> Dict[str, Any]:
    """
    Computes RMS radial deviation from the theoretical Archimedes spiral (r = a + b * theta),
    velocity inversions, and FFT power spectrum to isolate physiological tremor (3-12 Hz).
    """
    if len(points) < 15:
        raise ValueError("Trace too short to analyze (minimum 15 points required)")

    xs = np.array([p["x"] for p in points], dtype=float)
    ys = np.array([p["y"] for p in points], dtype=float)
    ts = np.array([p.get("t_ms", p.get("timestamp_ms", p.get("timestampMs", i * 16.6))) for i, p in enumerate(points)], dtype=float)

    dx = xs - center_x
    dy = ys - center_y
    r = np.sqrt(dx**2 + dy**2)
    theta = np.unwrap(np.arctan2(dy, dx))

    # Archimedes ideal spiral
    theta_abs = np.abs(theta - theta[0])
    ideal_r = a + b * theta_abs
    rms_deviation = float(np.sqrt(np.mean((r - ideal_r) ** 2)))

    # Velocity reversals
    dtheta = np.diff(theta)
    signs = np.sign(dtheta)
    signs = signs[signs != 0]
    reversals = int(np.sum(np.diff(signs) != 0)) if len(signs) > 1 else 0

    # FFT of radial deviation signal
    dt = np.diff(ts) / 1000.0
    fs_est = 1.0 / np.median(dt) if len(dt) > 0 and np.median(dt) > 0 else 60.0
    deviation_signal = r - ideal_r
    deviation_signal = deviation_signal - deviation_signal.mean()
    
    if len(deviation_signal) > 4:
        spectrum = np.abs(rfft(deviation_signal))
        freqs = rfftfreq(len(deviation_signal), d=1 / fs_est)
        band = (freqs >= 3.0) & (freqs <= 12.0)
        dominant_hz = float(freqs[band][np.argmax(spectrum[band])]) if band.any() and spectrum[band].size else 0.0
    else:
        dominant_hz = 0.0

    risk = min(100.0, rms_deviation * 1.1 + reversals * 4.0)

    return {
        "rms_deviation_px": round(rms_deviation, 2),
        "mean_radial_deviation_px": round(float(np.mean(np.abs(deviation_signal))), 2),
        "velocity_reversals": reversals,
        "dominant_tremor_hz": round(dominant_hz, 2),
        "dysmetria_score": "Significant" if rms_deviation > 25.0 or reversals > 6 else "Minimal",
        "risk_score": round(float(risk), 2),
    }
