# NeuroCheck AI — full-stack prototype

Matches the tech stack from the architecture doc: React frontend for capture,
FastAPI + NumPy/SciPy backend for signal processing, ReportLab for the
clinical PDF export.

```
neurocheck/
├── backend/
│   ├── main.py            FastAPI app: tap/acoustic/spiral analysis, risk engine, PDF export
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── styles.css
        └── components/
            ├── TapTest.jsx
            ├── AcousticTest.jsx
            ├── SpiralTest.jsx
            └── RiskPanel.jsx
```

## Run the backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Verify it's up: `curl http://localhost:8000/health` → `{"status":"ok"}`

Interactive API docs (Swagger UI) are auto-generated at `http://localhost:8000/docs`.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. It talks to the backend at
`http://localhost:8000` by default — override with a `.env` file:

```
VITE_API_BASE=http://localhost:8000
```

## What's real vs. illustrative

| Piece | Status |
|---|---|
| Tap timing capture, backend rate/decay/CV math | Real — NumPy on your actual tap timestamps |
| Mic capture, backend jitter/shimmer | Real — SciPy bandpass filter, autocorrelation pitch tracking, Hilbert envelope |
| Spiral capture, backend deviation/FFT | Real — NumPy RMS deviation + SciPy FFT for dominant tremor frequency |
| Composite risk engine | Real, but a simple demo weighting — not a validated clinical model |
| PDF dossier export | Real — generated server-side with ReportLab |
| Facility finder | Static/illustrative — swap in the Geolocation API + a real places API |
| Rehab plan generator | Static/illustrative — swap in the LangChain + LLM call from the architecture doc |

## Endpoints

- `POST /analyze/tap` — `{events: [{zone, t_ms}]}` → tap rate, amplitude decay, risk
- `POST /analyze/acoustic` — `{sample_rate, pcm: [float]}` → F0, jitter, shimmer, risk
- `POST /analyze/spiral` — `{points, center_x, center_y, a, b}` → RMS deviation, reversals, dominant tremor Hz, risk
- `POST /risk/composite` — `{motor?, acoustic?, spiral?}` → composite score + tier
- `POST /export/dossier` — same shape as composite, plus optional `*_detail` blocks → PDF stream
