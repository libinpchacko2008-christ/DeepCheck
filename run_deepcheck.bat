@echo off
title DeepCheck Launcher
set "PATH=C:\Users\Libin P Chacko\Python311;C:\Users\Libin P Chacko\Python311\Scripts;C:\Users\Libin P Chacko\node-v20;%PATH%"

echo ===================================================
echo           Starting DeepCheck Localhost
echo ===================================================

echo Starting Backend API (Port 8000)...
start "DeepCheck Backend" /min cmd /k "cd /d \"%~dp0backend\" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo Starting Frontend UI (Port 5173)...
start "DeepCheck Frontend" /min cmd /k "cd /d \"%~dp0frontend\" && npm run dev -- --host 127.0.0.1 --port 5173"

echo Waiting for servers to initialize...
timeout /t 4 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo Done! DeepCheck is running at http://localhost:5173
