#!/usr/bin/env bash
# Ports configured above 8030:
# ML Service: 8040 | Backend API: 8050 | Frontend: 8060

echo "=========================================================="
echo "   VARISAI: Smart Queue Management System"
echo "   Adaptive Priority Queue for Elderly & PwD"
echo "=========================================================="

echo "[1/3] Starting Python FastAPI ML Service on port 8040..."
python3 -m uvicorn app:app --app-dir ml_service --port 8040 &
PID_ML=$!

sleep 2

echo "[2/3] Starting Node Express + Socket.IO Backend on port 8050..."
npm --prefix backend run dev &
PID_BACKEND=$!

sleep 3

echo "[3/3] Starting React Vite Frontend on port 8060..."
npm --prefix frontend run dev &
PID_FRONTEND=$!

echo ""
echo "All 3 services running on ports above 8030!"
echo "Frontend Portal : http://localhost:8060"
echo "Backend API     : http://localhost:8050"
echo "ML Microservice : http://localhost:8040"

trap "kill $PID_ML $PID_BACKEND $PID_FRONTEND" EXIT
wait
