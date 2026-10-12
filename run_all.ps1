# VARISAI — Full Stack Launcher (Windows PowerShell)
# Ports configured above 8030:
# ML Service: 8040 | Backend API: 8050 | Frontend: 8060

$root = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }

Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "   VARISAI: Smart Queue Management System" -ForegroundColor DarkYellow
Write-Host "   Adaptive Priority Queue for Elderly & PwD" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "Root Directory: $root`n" -ForegroundColor Gray

# 1. Start ML Microservice (Port 8040)
Write-Host "[1/3] Starting Python FastAPI ML Service on port 8040..." -ForegroundColor Cyan
Start-Process cmd.exe -ArgumentList "/k title VARISAI [1/3] ML Service :8040 && cd /d `"$root\ml_service`" && python -m uvicorn app:app --port 8040"

Start-Sleep -Seconds 2

# 2. Start Backend API & WebSocket Server (Port 8050)
Write-Host "[2/3] Starting Node Express + Socket.IO Backend on port 8050..." -ForegroundColor Cyan
Start-Process cmd.exe -ArgumentList "/k title VARISAI [2/3] Backend API :8050 && cd /d `"$root\backend`" && npm run dev"

Start-Sleep -Seconds 2

# 3. Start Frontend Dev Server (Port 8060)
Write-Host "[3/3] Starting React Vite Frontend on port 8060..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k title VARISAI [3/3] Frontend Portal :8060 && cd /d `"$root\frontend`" && npm run dev"

Write-Host "`nAll 3 services launched in dedicated terminal windows!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "Frontend Portal : http://localhost:8060" -ForegroundColor Yellow
Write-Host "Backend API     : http://localhost:8050" -ForegroundColor White
Write-Host "ML Microservice : http://localhost:8040" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "Tip: Keep the 3 service windows open while using VARISAI." -ForegroundColor Gray
