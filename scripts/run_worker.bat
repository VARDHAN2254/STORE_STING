@echo off
cd /d "%~dp0\..\backend"
echo Starting STORE STING PostgreSQL Background Worker ...
.venv\Scripts\python.exe -m app.worker
pause
