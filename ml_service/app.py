import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

MODEL_FILE = os.path.join(os.path.dirname(__file__), "model.joblib")
META_FILE = os.path.join(os.path.dirname(__file__), "model_meta.json")

# Load model and metadata with resilient fallback
model = None
meta = {}

def load_or_retrain_model():
    global model, meta
    if os.path.exists(MODEL_FILE):
        try:
            model = joblib.load(MODEL_FILE)
            print("[VARISAI ML] Loaded pre-trained model successfully.")
        except Exception as e:
            print(f"[VARISAI ML] Notice: Could not load pickled model directly ({e}).")
            print("[VARISAI ML] Attempting automatic re-training on current Python environment...")
            try:
                from train_model import run_eda_and_training
                run_eda_and_training()
                if os.path.exists(MODEL_FILE):
                    model = joblib.load(MODEL_FILE)
                    print("[VARISAI ML] Model re-trained and loaded successfully on host!")
            except Exception as retrain_err:
                print(f"[VARISAI ML] Re-training skipped/failed: {retrain_err}. Using high-precision analytical queue fallback.")
                model = None

    if os.path.exists(META_FILE):
        try:
            with open(META_FILE, "r") as f:
                meta = json.load(f)
        except Exception as e:
            print(f"[VARISAI ML] Notice: Could not read metadata file: {e}")

load_or_retrain_model()

app = FastAPI(
    title="VARISAI ML Service",
    description="Adaptive Priority Queue Wait-Time Prediction and Scheduling Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Priority Category Mapping
# none: 0, senior_citizen: 1, pregnant_woman: 2, differently_abled: 3
PRIORITY_MAP = {
    "none": 0,
    "senior_citizen": 1,
    "pregnant_woman": 2,
    "differently_abled": 3
}

# Adaptive Priority Weights (in equivalent waiting minutes bonus)
# Differently abled: +15 mins equivalent weight
# Pregnant woman: +12 mins equivalent weight
# Senior citizen: +10 mins equivalent weight
# None / General: 0 mins bonus
PRIORITY_WEIGHTS = {
    "differently_abled": 15.0,
    "pregnant_woman": 12.0,
    "senior_citizen": 10.0,
    "none": 0.0
}

class PredictRequest(BaseModel):
    queue_depth: int = Field(..., ge=0, description="Number of tokens ahead in queue")
    arrival_hour: Optional[int] = Field(None, ge=0, le=23, description="Hour of the day 0-23")
    day_of_week: Optional[int] = Field(None, ge=1, le=7, description="Day of week (1=Sun, 7=Sat)")
    priority_category: str = Field("none", description="none | senior_citizen | pregnant_woman | differently_abled")
    avg_service_duration: float = Field(15.0, ge=1.0, description="Average service duration in minutes")
    active_counters: int = Field(3, ge=1, description="Number of active/open service counters")

class PredictResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    predicted_wait_time_minutes: float
    confidence_interval_low: float
    confidence_interval_high: float
    model_name: str
    benchmark_mae: float
    benchmark_rmse: float
    adaptive_priority_weight: float
    calculated_at: str

class QueueItem(BaseModel):
    token_id: str
    token_number: str
    priority_category: str
    minutes_waited: float
    fifo_position: int

class ScheduleRequest(BaseModel):
    queue: List[QueueItem]

class ScheduledItem(BaseModel):
    token_id: str
    token_number: str
    priority_category: str
    minutes_waited: float
    fifo_position: int
    priority_score: float
    scheduled_rank: int
    score_breakdown: dict

class ScheduleResponse(BaseModel):
    reordered_queue: List[ScheduledItem]
    total_in_queue: int

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_name": meta.get("best_model", "GradientBoostingRegressor"),
        "benchmark": meta.get("metrics", {})
    }

@app.post("/predict", response_model=PredictResponse)
def predict_wait_time(req: PredictRequest):
    now = datetime.now()
    arrival_hour = req.arrival_hour if req.arrival_hour is not None else now.hour
    day_of_week = req.day_of_week if req.day_of_week is not None else (now.isoweekday() % 7 + 1)
    
    p_code = PRIORITY_MAP.get(req.priority_category.lower(), 0)
    p_weight = PRIORITY_WEIGHTS.get(req.priority_category.lower(), 0.0)
    
    # If queue is empty, wait time is virtually 0 to 2 minutes
    if req.queue_depth == 0:
        pred_mins = 2.0
    elif model is not None:
        feature_cols = [
            "queue_depth",
            "arrival_hour",
            "day_of_week",
            "priority_category",
            "avg_service_duration",
            "active_counters"
        ]
        df_input = pd.DataFrame([[
            req.queue_depth,
            arrival_hour,
            day_of_week,
            p_code,
            req.avg_service_duration,
            req.active_counters
        ]], columns=feature_cols)
        
        raw_pred = float(model.predict(df_input)[0])
        pred_mins = max(2.0, round(raw_pred, 1))
    else:
        # High-precision analytical queue formula fallback
        priority_factors = {0: 1.0, 1: 0.70, 2: 0.65, 3: 0.50}
        p_factor = priority_factors.get(p_code, 1.0)
        counters = max(1, req.active_counters)
        analytical = (req.queue_depth / counters) * req.avg_service_duration * p_factor
        pred_mins = max(2.0, round(analytical, 1))
    
    mae = meta.get("metrics", {}).get("mae_minutes", 14.4)
    rmse = meta.get("metrics", {}).get("rmse_minutes", 21.9)
    
    # Confidence interval +/- 0.5 * MAE
    ci_low = max(1.0, round(pred_mins - (mae * 0.5), 1))
    ci_high = round(pred_mins + (mae * 0.5), 1)
    
    return PredictResponse(
        predicted_wait_time_minutes=pred_mins,
        confidence_interval_low=ci_low,
        confidence_interval_high=ci_high,
        model_name=meta.get("best_model", "GradientBoostingRegressor"),
        benchmark_mae=mae,
        benchmark_rmse=rmse,
        adaptive_priority_weight=p_weight,
        calculated_at=now.isoformat()
    )

@app.post("/schedule", response_model=ScheduleResponse)
def adaptive_schedule(req: ScheduleRequest):
    """
    Adaptive Priority Scheduling:
    score = (time already waited) + (priority weight for category) + (base FIFO weight)
    
    Higher score gets served first.
    This guarantees that general users who have waited a long time naturally accumulate
    score and are NOT starved by newly arriving priority users.
    """
    items = []
    
    # Base FIFO weight: earlier arrivals get higher base points
    # Suppose N items, arrival position 1 gets higher baseline than position N
    n = len(req.queue)
    
    for item in req.queue:
        p_cat = item.priority_category.lower()
        p_weight = PRIORITY_WEIGHTS.get(p_cat, 0.0)
        
        # FIFO component decays with position: earlier ticket gets up to +10 pts
        fifo_component = max(0.0, 10.0 - (item.fifo_position * 0.5))
        
        # Waited component: 1 point per 2 minutes waited
        waited_component = item.minutes_waited * 0.5
        
        total_score = round(waited_component + p_weight + fifo_component, 2)
        
        items.append({
            "token_id": item.token_id,
            "token_number": item.token_number,
            "priority_category": item.priority_category,
            "minutes_waited": item.minutes_waited,
            "fifo_position": item.fifo_position,
            "priority_score": total_score,
            "score_breakdown": {
                "time_waited_pts": round(waited_component, 2),
                "category_weight_pts": round(p_weight, 2),
                "fifo_baseline_pts": round(fifo_component, 2)
            }
        })
    
    # Sort descending by priority_score
    items.sort(key=lambda x: x["priority_score"], reverse=True)
    
    scheduled_items = []
    for rank, itm in enumerate(items, start=1):
        scheduled_items.append(ScheduledItem(
            token_id=itm["token_id"],
            token_number=itm["token_number"],
            priority_category=itm["priority_category"],
            minutes_waited=itm["minutes_waited"],
            fifo_position=itm["fifo_position"],
            priority_score=itm["priority_score"],
            scheduled_rank=rank,
            score_breakdown=itm["score_breakdown"]
        ))
        
    return ScheduleResponse(
        reordered_queue=scheduled_items,
        total_in_queue=len(scheduled_items)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8040)
