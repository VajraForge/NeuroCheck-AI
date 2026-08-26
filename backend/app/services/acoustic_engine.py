import io
import numpy as np
import scipy.signal as sp_signal
import soundfile as sf
import librosa
from typing import Dict, Any, List

def compute_acoustic_from_pcm(pcm_samples: List[float], sr: int) -> Dict[str, float]:
    """Autocorrelation & Hilbert envelope acoustic analysis from raw PCM array."""
    pcm = np.array(pcm_samples, dtype=float)
    if len(pcm) < sr * 0.5:
        raise ValueError("Recording too short — need at least 0.5s of audio")

    frame_len = int(sr * 0.040)
    hop_len = int(sr * 0.020)
    
    if len(pcm) < frame_len:
        raise ValueError("Audio buffer smaller than minimum frame window")

    sos = sp_signal.butter(4, [60, 500], btype="bandpass", fs=sr, output="sos")
    filtered = sp_signal.sosfiltfilt(sos, pcm)

    window = sp_signal.windows.hann(frame_len)
    pitches = []
    for start in range(0, len(filtered) - frame_len, hop_len):
        frame = filtered[start : start + frame_len] * window
        if np.sqrt(np.mean(frame**2)) < 0.005:
            continue
        corr = sp_signal.correlate(frame, frame, mode="full")
        corr = corr[len(corr) // 2 :]

        min_lag = int(sr / 500)
        max_lag = int(sr / 60)
        if max_lag >= len(corr):
            continue
        segment = corr[min_lag:max_lag]
        if len(segment) == 0:
            continue
        peak_lag = min_lag + int(np.argmax(segment))
        if peak_lag > 0:
            pitches.append(sr / peak_lag)

    f0_track = np.array(pitches)
    if len(f0_track) < 3:
        # Fallback to mean default if noisy
        mean_f0 = 120.0
        jitter_pct = 1.2
        shimmer_pct = 2.0
    else:
        mean_f0 = float(f0_track.mean())
        jitter_pct = float(f0_track.std() / f0_track.mean() * 100)
        
        analytic = sp_signal.hilbert(pcm)
        envelope = np.abs(analytic)
        envelope = envelope[envelope > np.percentile(envelope, 10)]
        shimmer_pct = float(envelope.std() / envelope.mean() * 100) if len(envelope) > 0 else 2.0

    risk = min(100.0, jitter_pct * 8 + shimmer_pct * 1.2)

    return {
        "mean_f0_hz": round(mean_f0, 2),
        "jitter_pct": round(jitter_pct, 3),
        "shimmer_pct": round(shimmer_pct, 3),
        "risk_score": round(float(risk), 2),
    }

def compute_acoustic_from_wav_bytes(wav_bytes: bytes) -> Dict[str, Any]:
    """
    Decodes 16-bit PCM WAV stream.
    Extracts Yin F0 pitch tracking, Jitter percent, Shimmer, and HPSS Harmonic-to-Noise Ratio (HNR).
    """
    with io.BytesIO(wav_bytes) as bio:
        y, sr = sf.read(bio, dtype="float32")

    if len(y.shape) > 1:
        y = np.mean(y, axis=1)

    if len(y) < sr * 0.5:
        raise ValueError("Audio duration must be at least 0.5 seconds")

    # Yin algorithm for F0 pitch extraction
    try:
        f0 = librosa.yin(y, fmin=50, fmax=400, sr=sr)
        valid_f0 = f0[~np.isnan(f0)]
    except Exception:
        valid_f0 = np.array([])

    mean_f0 = float(np.mean(valid_f0)) if len(valid_f0) > 0 else 0.0

    # Local Jitter
    if len(valid_f0) > 2:
        period_lengths = 1.0 / valid_f0
        jitter_local = float(np.mean(np.abs(np.diff(period_lengths))) / np.mean(period_lengths)) * 100.0
    else:
        jitter_local = 0.0

    # Harmonic-to-Noise Ratio via Harmonic-Percussive Source Separation
    harmonic, percussive = librosa.effects.hpss(y)
    h_energy = float(np.sum(harmonic**2))
    n_energy = float(np.sum(percussive**2) + 1e-8)
    hnr_db = float(10 * np.log10(h_energy / n_energy))

    # Amplitude Shimmer via frame RMS
    frame_length = int(sr * 0.04)
    hop_length = int(sr * 0.02)
    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    rms = rms[rms > 0.01]
    if len(rms) > 2:
        shimmer_local = float(np.mean(np.abs(np.diff(rms))) / np.mean(rms)) * 100.0
    else:
        shimmer_local = 0.0

    risk = min(100.0, jitter_local * 12.0 + shimmer_local * 1.5 + max(0.0, 20.0 - hnr_db) * 2.0)
    dysphonia = "Elevated" if jitter_local > 1.04 or hnr_db < 15.0 else "Normal"

    return {
        "mean_f0_hz": round(mean_f0, 2),
        "jitter_pct": round(jitter_local, 3),
        "shimmer_pct": round(shimmer_local, 3),
        "hnr_db": round(hnr_db, 2),
        "dysphonia_indicator": dysphonia,
        "risk_score": round(float(risk), 2),
    }
