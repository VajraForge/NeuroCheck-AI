# NeuroCheck AI: Non-Invasive Multimodal Neurological Screening Platform

## Abstract

NeuroCheck AI is an objective, software-based screening system designed for the quantitative detection and longitudinal monitoring of motor and vocal biomarkers associated with Parkinson's Disease (PD) and related movement disorders. 

Using standard consumer hardware (webcams, microphones, and touch/pointer interfaces), the platform captures and analyzes three distinct physiological signals aligned with the Movement Disorder Society - Unified Parkinson's Disease Rating Scale (MDS-UPDRS):
1. **Kinematic Finger Tapping:** Measures bradykinesia rate, fatigue decrement, and rhythm variation.
2. **Acoustic Phonation:** Analyzes fundamental frequency micro-perturbations (jitter) and amplitude variations (shimmer).
3. **Archimedes Spiral Kinematics:** Computes spatial deviation from theoretical Archimedean geometry and extracts tremor harmonics via Fast Fourier Transform (FFT).

The system features an asynchronous processing backend, a Protected Health Information (PHI) sanitization layer, and an LLM-assisted clinical regimen synthesis engine grounded in LSVT BIG and LSVT LOUD rehabilitation protocols.

---

## System Architecture

```
                                  +---------------------------------------+
                                  |         React 18 Frontend             |
                                  |  (Webcam / Web Audio / HTML5 Canvas)  |
                                  +-------------------+-------------------+
                                                      |
                                         HTTPS / JSON | Payloads
                                                      v
                                  +-------------------+-------------------+
                                  |          FastAPI Gateway              |
                                  |  (Authentication, Routing, Validation)|
                                  +---------+-------------------+---------+
                                            |                   |
                                            v                   v
                     +----------------------+------+     +------+----------------------+
                     |   Sync Analysis Engines     |     |   Async Pipeline (Celery)   |
                     |  - Kinematic (NumPy)        |     |  - Task Queue (Redis)       |
                     |  - Acoustic (SciPy DSP)     |     |  - Batch Result Storage     |
                     |  - Spiral FFT Analysis      |     |  - Background Worker Tasks  |
                     +--------------+--------------+     +-----------------------------+
                                    |
                                    v
                     +--------------+--------------+
                     |    PHI Sanitization Layer   |
                     | (Regex & Pattern Scrubber)  |
                     +--------------+--------------+
                                    |
                                    v
                     +--------------+--------------+
                     |    LLM Care Plan Engine     |
                     |  (Gemini + Medical Fallback)|
                     +-----------------------------+
```

### Core Components

* **Client Layer:** Single-page application built with React 18, Vite, and Tailwind CSS. Employs HTML5 Canvas for high-frequency coordinate tracking and the Web Audio API for uncompressed PCM audio capture.
* **API & Compute Layer:** FastAPI application orchestrating synchronous digital signal processing routines and delegating compute-heavy batch tasks to Celery workers via Redis.
* **Signal Processing Engines:** Python implementations leveraging NumPy and SciPy for numerical transforms, autocorrelation pitch tracking, bandpass filtering, and spectral decomposition.
* **Care Regimen Synthesis:** LangChain-integrated Gemini model producing structured 7-day rehabilitation protocols, backed by a deterministic clinical rule engine for offline operation.
* **Privacy Layer:** Middleware sanitizing direct patient identifiers (names, dates, medical IDs) prior to external model ingestion.

---

## Biomarker Methodology and Formulations

### 1. Kinematic Finger-Tap Analysis (MDS-UPDRS Item 3.4)

The test evaluates rapid alternating movements between the thumb and index finger over a 10-second window.

* **Tap Frequency ($f_{tap}$):** Calculated as the inverse of mean inter-tap intervals ($\Delta t_i$):
  $$\bar{f} = \frac{N - 1}{\sum_{i=1}^{N-1} (t_{i+1} - t_i)}$$
* **Amplitude Decay / Fatigue Decrement ($\Delta A_{decay}$):** Quantifies progressive reduction in speed and movement amplitude between initial and final intervals:
  $$\Delta A_{decay} = \max\left(0, \frac{\bar{f}_{first\_3s} - \bar{f}_{last\_3s}}{\bar{f}_{first\_3s}}\right) \times 100\%$$
* **Rhythm Coefficient of Variation ($CV_{rhythm}$):** Reflects movement dysrhythmia:
  $$CV = \frac{\sigma_{\Delta t}}{\mu_{\Delta t}}$$

### 2. Acoustic Phonation Stability

Patients sustain the vowel sound /a/ into the microphone for 3 seconds. The raw PCM stream (16 kHz) undergoes pre-filtering (70 Hz to 500 Hz bandpass).

* **Pitch Tracking ($F_0$):** Extracted via normalized autocorrelation of windowed signal frames:
  $$R_{xx}(\tau) = \sum_{n} x[n] x[n + \tau]$$
* **Local Jitter (Period Perturbation):** Mean absolute difference between consecutive fundamental periods normalized by the mean period:
  $$\text{Jitter (\%)} = \frac{\frac{1}{N-1}\sum_{i=1}^{N-1} |T_i - T_{i+1}|}{\frac{1}{N}\sum_{i=1}^{N} T_i} \times 100\%$$
* **Local Shimmer (Amplitude Perturbation):** Mean absolute difference between consecutive peak amplitudes:
  $$\text{Shimmer (\%)} = \frac{\frac{1}{N-1}\sum_{i=1}^{N-1} |A_i - A_{i+1}|}{\frac{1}{N}\sum_{i=1}^{N} A_i} \times 100\%$$

### 3. Archimedes Spiral Kinematics

Participants trace a continuous spiral from center outward on a calibrated canvas.

* **Ideal Geometric Model:** $r(\theta) = a + b\theta$ in polar coordinates.
* **Root Mean Square Deviation ($RMS_{dev}$):** Radial departure of recorded points $(x_k, y_k)$ from theoretical radius $r_k$:
  $$RMS_{dev} = \sqrt{\frac{1}{N}\sum_{k=1}^N \left( \sqrt{(x_k - x_c)^2 + (y_k - y_c)^2} - (a + b\theta_k) \right)^2}$$
* **Spectral Tremor Extraction:** Velocity time series $v(t) = \sqrt{\dot{x}^2 + \dot{y}^2}$ is converted to the frequency domain via Discrete Fourier Transform (DFT):
  $$V(f) = \sum_{n=0}^{N-1} v[n] e^{-j 2\pi f n / N}$$
  The dominant peak is inspected in the diagnostic range of 4.0 Hz to 7.0 Hz (Parkinsonian resting and postural tremor harmonic).

---

## API Endpoints

### Direct Analysis Endpoints (Synchronous)

| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/analyze/tap` | Processes discrete tap timestamp events; returns frequency, decay %, and risk sub-score. |
| `POST` | `/analyze/acoustic` | Accepts 16 kHz PCM floats; returns $F_0$, jitter %, shimmer %, and vocal stability index. |
| `POST` | `/analyze/spiral` | Takes coordinate sequence $(x, y, t)$; returns RMS error, velocity reversals, and dominant tremor Hz. |
| `POST` | `/risk/composite` | Computes weighted composite risk score (0–100) and assigns clinical tier (`low`, `moderate`, `high`). |
| `POST` | `/generate-care-plan` | Triggers LLM synthesis of personalized 7-day physical and speech rehabilitation regimens. |
| `POST` | `/export/dossier` | Generates a binary PDF report containing clinical scores and session telemetry. |

### Asynchronous Pipeline Endpoints (Celery)

| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/screening/submit-batch` | Queues multi-modal raw payloads into Redis for distributed worker processing. |
| `GET` | `/api/v1/screening/task-status/{task_id}` | Polls status of a queued task (`PENDING`, `STARTED`, `SUCCESS`, `FAILURE`). |
| `POST` | `/api/v1/screening/save-result` | Persists evaluated screening session to local database with JWT authentication. |

---

## Directory Structure

```
NeuroCheck AI/
├── backend/
│   ├── app/
│   │   ├── core/           Config, database session, security utilities
│   │   ├── middleware/     PHI scrubbing and request logging
│   │   ├── models/         SQLAlchemy ORM models & Pydantic schemas
│   │   ├── routers/        FastAPI route handlers (auth, screening, tasks, legacy)
│   │   ├── services/       DSP engines (kinematic, acoustic, spiral, LLM care engine)
│   │   ├── tasks/          Celery background analysis tasks
│   │   ├── celery_app.py   Celery worker initialization
│   │   └── main.py         Application factory and middleware registration
│   ├── tests/              PyTest test suite
│   ├── Dockerfile          Backend container definition
│   └── requirements.txt    Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     React UI components (tests, charts, care plan, clinic finder)
│   │   ├── utils/          API clients and audio processing helpers
│   │   ├── App.jsx         Root view and navigation router
│   │   ├── main.jsx        Entrypoint
│   │   └── styles.css      Tailwind design tokens and print stylesheets
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml      Full stack composition (Nginx, API, Redis, Worker)
└── run_neurocheck.bat      Local development launcher script
```

---

## Installation and Local Setup

### Prerequisites

* Python 3.11+ (tested on Python 3.14)
* Node.js 18+ and npm
* Redis (optional, required only for asynchronous task queue mode)

### 1. Backend Setup

```powershell
cd backend
python -m venv ..\.venv
..\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verify backend health:
```bash
curl http://localhost:8000/health
```

Interactive OpenAPI documentation will be accessible at `http://localhost:8000/docs`.

### 2. Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

The interface will be served at `http://localhost:5173`.

### 3. One-Click Launch (Windows)

To start both services simultaneously in separate shells:
```powershell
.\run_neurocheck.bat
```

---

## Automated Testing

To execute the backend unit and integration test suite:

```powershell
cd backend
..\.venv\Scripts\python.exe -m pytest -v
```

To run frontend production builds:

```powershell
cd frontend
npm run build
```

---

## Compliance and Privacy Notice

* **Data Minimization:** Raw video feeds and audio waveforms are processed in-memory. No continuous visual or acoustic recordings are persisted without user consent.
* **PHI De-identification:** The system removes direct personal identifiers using deterministic redaction rules before transmitting any payload to external model providers.
* **Clinical Disclaimer:** NeuroCheck AI is intended as a non-invasive screening aid and decision-support tool. It does not replace comprehensive clinical evaluation by a board-certified neurologist or movement disorder specialist.
