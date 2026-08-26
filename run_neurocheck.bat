@echo off
echo =======================================================
echo Starting NeuroCheck AI Platform (Production Stack)
echo =======================================================
echo.

echo [1/2] Starting FastAPI Backend Server (Modular Core)...
if exist ".venv\Scripts\python.exe" (
    start "NeuroCheck Backend" cmd /k "cd backend && ..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
) else (
    start "NeuroCheck Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
)

echo [2/2] Starting Vite Frontend Server...
start "NeuroCheck Frontend" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo =======================================================
echo Both services are spinning up!
echo Frontend Dashboard: http://localhost:5173
echo Backend API Docs:   http://localhost:8000/api/v1/docs
echo.
echo For full containerized Docker deployment with Celery + Redis:
echo Run: docker-compose up --build
echo =======================================================
pause
