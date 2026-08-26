import pytest
import io
import struct
import math
import numpy as np
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.security import create_access_token
from app.services.kinematic_engine import compute_tap_metrics
from app.services.acoustic_engine import compute_acoustic_from_wav_bytes
from app.services.spiral_engine import compute_spiral_metrics

@pytest.fixture
def auth_headers():
    token = create_access_token(data={"sub": "clinician_tester", "role": "investigator"})
    return {"Authorization": f"Bearer {token}"}

def generate_mock_wav_bytes(duration_sec: float = 2.0, sample_rate: int = 16000, freq: float = 220.0) -> bytes:
    """Generates synthetic 16-bit PCM 16kHz mono audio WAV buffer."""
    num_samples = int(duration_sec * sample_rate)
    t = np.linspace(0, duration_sec, num_samples, endpoint=False)
    signal = 0.5 * np.sin(2 * np.pi * freq * t)
    pcm_samples = (signal * 32767).astype(np.int16)

    bio = io.BytesIO()
    bio.write(b"RIFF")
    bio.write(struct.pack("<I", 36 + len(pcm_samples) * 2))
    bio.write(b"WAVE")
    bio.write(b"fmt ")
    bio.write(struct.pack("<I", 16))
    bio.write(struct.pack("<H", 1))
    bio.write(struct.pack("<H", 1))
    bio.write(struct.pack("<I", sample_rate))
    bio.write(struct.pack("<I", sample_rate * 2))
    bio.write(struct.pack("<H", 2))
    bio.write(struct.pack("<H", 16))
    bio.write(b"data")
    bio.write(struct.pack("<I", len(pcm_samples) * 2))
    bio.write(pcm_samples.tobytes())
    return bio.getvalue()

def generate_synthetic_kinematic_payload():
    series = []
    for i in range(50):
        t_ms = i * 33.3
        tremor_offset = 0.02 * math.sin(2 * math.pi * 5.0 * (t_ms / 1000.0))
        landmarks = [[
            {"x": 0.5 + tremor_offset, "y": 0.5 + tremor_offset, "z": 0.0, "visibility": 0.99}
            for _ in range(21)
        ]]
        series.append({
            "timestampMs": round(t_ms, 2),
            "landmarks": landmarks,
            "handedness": ["Right"],
            "fps": 30.0
        })
    return {
        "patient_id": "TEST_SUBJ_001",
        "duration_ms": 1666.0,
        "average_fps": 30.0,
        "series": series
    }

def generate_synthetic_spiral_payload():
    points = []
    for i in range(50):
        theta = i * 0.2
        r = 2.0 + 6.0 * theta
        points.append({
            "x": round(250 + r * math.cos(theta), 2),
            "y": round(250 + r * math.sin(theta), 2),
            "pressure": 0.6,
            "timestampMs": round(i * 20.0, 2)
        })
    return {
        "patient_id": "TEST_SUBJ_001",
        "width": 500.0,
        "height": 500.0,
        "duration_ms": 1000.0,
        "points": points,
        "a": 2.0,
        "b": 6.0
    }

@pytest.mark.asyncio
async def test_patient_registration_and_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register new patient
        username = f"patient_{int(np.random.randint(10000, 99999))}"
        reg_payload = {
            "username": username,
            "password": "securepassword123",
            "full_name": "Alice Johnson",
            "age": 62,
            "email": f"{username}@example.com",
            "medical_id": "PT-9012"
        }
        res_reg = await client.post("/api/v1/auth/register", json=reg_payload)
        assert res_reg.status_code == 201
        data_reg = res_reg.json()
        assert "access_token" in data_reg
        assert data_reg["user"]["full_name"] == "Alice Johnson"

        # Login with created account
        res_login = await client.post("/api/v1/auth/login", json={
            "username": username,
            "password": "securepassword123"
        })
        assert res_login.status_code == 200
        data_login = res_login.json()
        assert "access_token" in data_login
        token = data_login["access_token"]
        patient_headers = {"Authorization": f"Bearer {token}"}

        # Save screening result
        save_payload = {
            "composite_score": 38.5,
            "risk_tier": "moderate",
            "motor_score": 32.0,
            "acoustic_score": 28.0,
            "spiral_score": 45.0,
            "details": {"test": "ok"}
        }
        res_save = await client.post("/api/v1/screening/save-result", json=save_payload, headers=patient_headers)
        assert res_save.status_code == 200
        assert res_save.json()["status"] == "saved"

        # Retrieve screening history
        res_hist = await client.get("/api/v1/screening/history", headers=patient_headers)
        assert res_hist.status_code == 200
        hist_data = res_hist.json()
        assert len(hist_data["history"]) >= 1
        assert hist_data["history"][0]["composite_score"] == 38.5

@pytest.mark.asyncio
async def test_health_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r1 = await client.get("/health")
        assert r1.status_code == 200
        assert r1.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_screening_ingest_endpoints(auth_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Tremor
        res_tremor = await client.post("/api/v1/screening/tremor", json=generate_synthetic_kinematic_payload(), headers=auth_headers)
        assert res_tremor.status_code == 202
        assert "task_id" in res_tremor.json()

        # Spiral
        res_spiral = await client.post("/api/v1/screening/spiral", json=generate_synthetic_spiral_payload(), headers=auth_headers)
        assert res_spiral.status_code == 202
        assert "task_id" in res_spiral.json()

        # Audio
        wav_bytes = generate_mock_wav_bytes(duration_sec=1.5)
        files = {"file": ("test.wav", io.BytesIO(wav_bytes), "audio/wav")}
        data = {"patient_id": "TEST_01"}
        res_audio = await client.post("/api/v1/screening/audio", data=data, files=files, headers=auth_headers)
        assert res_audio.status_code == 202
        assert "task_id" in res_audio.json()

@pytest.mark.asyncio
async def test_direct_algorithms():
    # Kinematic
    taps = compute_tap_metrics([{"t_ms": 0.0}, {"t_ms": 320.0}, {"t_ms": 650.0}, {"t_ms": 990.0}])
    assert taps["tap_rate_hz"] > 0

    # Acoustic
    wav = generate_mock_wav_bytes(duration_sec=1.0)
    ac = compute_acoustic_from_wav_bytes(wav)
    assert ac["mean_f0_hz"] > 0

    # Spiral
    pts = [{"x": 250 + i, "y": 250 + i, "timestamp_ms": i * 16.6} for i in range(25)]
    sp = compute_spiral_metrics(pts)
    assert sp["rms_deviation_px"] >= 0
