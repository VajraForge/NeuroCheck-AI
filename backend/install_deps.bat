@echo off
echo =======================================================
echo NeuroCheck AI Backend - Dependency Installation Script
echo =======================================================

echo.
echo [1/3] Creating Python virtual environment (venv)...
python -m venv venv

echo.
echo [2/3] Activating virtual environment and upgrading pip...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip

echo.
echo [3/3] Installing required packages...
pip install fastapi uvicorn[standard] numpy scipy reportlab python-multipart langchain langchain-google-genai python-dotenv

echo.
echo =======================================================
echo Setup Complete!
echo You can now run the app using: python app.py
echo =======================================================
pause
