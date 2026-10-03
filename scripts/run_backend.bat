@echo off
cd /d "%~dp0\..\backend"
echo Starting STORE STING API on http://127.0.0.1:8000 ...
.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
pause
