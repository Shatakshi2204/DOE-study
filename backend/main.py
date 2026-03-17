"""
main.py — FastAPI backend for DOE Dashboard
Deploy on Render (free tier) → your React frontend calls this
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from doe_engine import run_full_doe, predict_strength, calculate_coq

app = FastAPI(
    title="DOE Study API — PCB Soldering Process",
    description="Apple PQE Internship Portfolio | 2³ Factorial DOE Backend",
    version="1.0.0",
)

# CORS — allow your Vercel frontend + local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.vercel.app",   # your deployed frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Models ────────────────────────────────────────────

class PredictRequest(BaseModel):
    temperature: float = Field(..., ge=180, le=300, description="°C")
    pressure:    float = Field(..., ge=0.1, le=3.0,  description="MPa")
    time:        float = Field(..., ge=1,   le=15,   description="seconds")


class CoQRequest(BaseModel):
    volume:               int   = Field(50000, ge=1000)
    baseline_defect_pct:  float = Field(4.2,  ge=0.1, le=100)
    optimized_defect_pct: float = Field(0.8,  ge=0.1, le=100)


# ── Endpoints ─────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "project": "DOE Study — PCB Soldering Process",
        "author": "Apple PQE Internship Portfolio",
        "endpoints": ["/doe", "/predict", "/coq", "/health"]
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/doe")
def get_full_doe():
    """
    Run the complete 2³ factorial DOE analysis.
    Returns: design matrix, effects, optimal settings, CoQ.
    """
    try:
        return run_full_doe()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict")
def predict(req: PredictRequest):
    """
    Predict joint strength for any temperature/pressure/time combo.
    Encodes values to [-1, +1] scale automatically.
    """
    try:
        # Encode to [-1, +1]
        temp_c = (req.temperature - 220) / (260 - 220) * 2 - 1
        pres_c = (req.pressure    - 0.5) / (1.5 - 0.5) * 2 - 1
        time_c = (req.time        - 3)   / (7   - 3)   * 2 - 1

        # Clamp to [-1, 1] (extrapolation outside design space)
        temp_c = max(-1.5, min(1.5, temp_c))
        pres_c = max(-1.5, min(1.5, pres_c))
        time_c = max(-1.5, min(1.5, time_c))

        result = predict_strength(temp_c, pres_c, time_c)
        return {
            "inputs": {
                "temperature": req.temperature,
                "pressure": req.pressure,
                "time": req.time,
            },
            "coded": {
                "temp_coded": round(temp_c, 3),
                "pres_coded": round(pres_c, 3),
                "time_coded": round(time_c, 3),
            },
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/coq")
def coq_analysis(req: CoQRequest):
    """
    Cost of Quality analysis with custom parameters.
    """
    try:
        return calculate_coq(
            volume=req.volume,
            baseline_defect_pct=req.baseline_defect_pct,
            optimized_defect_pct=req.optimized_defect_pct,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
