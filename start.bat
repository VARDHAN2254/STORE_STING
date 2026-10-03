@echo off
echo ===================================================
echo   STORE STING — Shopping, reimagined.
echo   Launching Backend API, Worker, and Frontend...
echo ===================================================

start "STORE STING API" cmd /k "scripts\run_backend.bat"
start "STORE STING Worker" cmd /k "scripts\run_worker.bat"
start "STORE STING Frontend" cmd /k "scripts\run_frontend.bat"

echo.
echo All services launched!
echo Open your browser to: http://localhost:5173
echo.
pause
