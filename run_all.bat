@echo off
title VARISAI Full Stack Launcher
echo ==========================================================
echo    VARISAI: Smart Queue Management System
echo    Adaptive Priority Queue for Elderly and PwD
echo ==========================================================
echo.

set "ROOT=%~dp0"

echo [1/3] Starting Python FastAPI ML Service on port 8040...
start "VARISAI [1/3] ML Service :8040" cmd /k "cd /d "%ROOT%ml_service" && python -m uvicorn app:app --port 8040"

timeout /t 2 >nul

echo [2/3] Starting Node Express + Socket.IO Backend on port 8050...
start "VARISAI [2/3] Backend API :8050" cmd /k "cd /d "%ROOT%backend" && npm run dev"

timeout /t 2 >nul

echo [3/3] Starting React Vite Frontend on port 8060...
start "VARISAI [3/3] Frontend Portal :8060" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

echo.
echo All 3 services launched in separate windows!
echo ==========================================================
echo Frontend Portal : http://localhost:8060
echo Backend API     : http://localhost:8050
echo ML Microservice : http://localhost:8040
echo ==========================================================
echo Keep the service windows open while using VARISAI.
echo.
pause
