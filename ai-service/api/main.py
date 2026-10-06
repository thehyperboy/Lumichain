"""
LumiChain AI Layer - Step 10
============================
FastAPI REST API Service

Exposes the LumiChain prediction service and deterministic decision engine
via a high-performance RESTful API.

Endpoints:
    GET  /health  - Health check & model metadata
    POST /predict - Real-time streetlight failure inference and verification

Architecture:
    Frontend / Node.js Backend
            ↓
       POST /predict
            ↓
          FastAPI
            ↓
    prediction_service.py
            ↓
      Decision Engine
            ↓
       Final Decision (JSON Response)

Author  : LumiChain AI Team
Purpose : Production-ready API service for LumiChain AI Layer
"""

import sys
import logging
from pathlib import Path
from typing import List, Dict, Any

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from prediction.prediction_service import StreetlightPredictionService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("lumichain-ai-service")

# ---------------------------------------------------------------------------
# FastAPI Application Configuration
# ---------------------------------------------------------------------------
app = FastAPI(
    title="LumiChain AI Service",
    description="AI-powered autonomous streetlight failure detection and maintenance decision service.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS Configuration
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Model Service Singleton Initialization
# ---------------------------------------------------------------------------
# Pre-loaded once at module load to avoid reloading per request
try:
    prediction_service = StreetlightPredictionService()
    logger.info("Successfully loaded StreetlightPredictionService and model artifacts.")
except Exception as exc:
    logger.critical("Failed to initialize StreetlightPredictionService: %s", exc, exc_info=True)
    raise RuntimeError(f"Service initialization failure: {exc}") from exc


# ---------------------------------------------------------------------------
# Request & Response Schemas (Pydantic v2)
# ---------------------------------------------------------------------------
class PredictRequest(BaseModel):
    """Telemetry payload for streetlight condition assessment."""
    poleId: str = Field(
        ...,
        min_length=1,
        description="Unique streetlight pole identifier",
        example="SL-002"
    )
    current: float = Field(
        ...,
        description="Electrical current measurement in Amperes",
        example=0.02
    )
    voltage: float = Field(
        ...,
        description="Electrical voltage measurement in Volts",
        example=230.0
    )
    lightIntensity: float = Field(
        ...,
        description="Ambient light intensity in Lux",
        example=0.0
    )
    temperature: float = Field(
        ...,
        description="Operating temperature in degrees Celsius",
        example=31.0
    )
    neighborConfirmation: int = Field(
        ...,
        ge=0,
        le=2,
        description="Count of adjacent poles confirming abnormality (0, 1, or 2)",
        example=2
    )
    operatingHours: float = Field(
        ...,
        ge=0.0,
        description="Cumulative operating hours (must be >= 0)",
        example=4820.0
    )
    previousFailures: int = Field(
        ...,
        ge=0,
        description="Historical failure incidents count (must be >= 0)",
        example=3
    )


class PredictResponse(BaseModel):
    """LumiChain verified failure prediction and operational recommendation."""
    poleId: str = Field(..., description="Pole identifier matching the input request")
    failureDetected: bool = Field(..., description="True if any abnormal condition is identified")
    failureType: str = Field(..., description="Predicted failure class or WORKING")
    confidence: float = Field(..., description="ML classification model confidence score [0.0 - 1.0]")
    verificationStatus: str = Field(..., description="Verification tier: CONFIRMED, PROBABLE, UNCERTAIN, or NORMAL")
    priority: str = Field(..., description="Maintenance urgency: CRITICAL, HIGH, MEDIUM, or LOW")
    recommendation: str = Field(..., description="Operational action: CREATE_MAINTENANCE_COMPLAINT, REQUEST_RECHECK, or NO_ACTION")
    reason: str = Field(..., description="Deterministic justification combining ML, consensus, and sanity alerts")
    sensorAlerts: List[str] = Field(default_factory=list, description="List of physical sanity violations or domain warnings")


class HealthResponse(BaseModel):
    """API health and service metadata."""
    status: str
    service: str
    model: str
    version: str


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["System"],
    summary="Health Check and Service Metadata"
)
def get_health() -> Dict[str, str]:
    """
    Returns operational health status, service identity, and current active ML model.
    """
    return {
        "status": "healthy",
        "service": "LumiChain AI Service",
        "model": "Tuned Decision Tree",
        "version": "1.0.0",
    }


@app.post(
    "/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    tags=["Inference"],
    summary="Predict Streetlight Health and Generate Maintenance Decision"
)
def predict_streetlight_endpoint(request: PredictRequest) -> Dict[str, Any]:
    """
    Evaluates streetlight telemetry through the trained ML classifier and
    deterministic Decision Engine to yield an operational governance recommendation.
    """
    # 1. Map external camelCase API fields to internal snake_case prediction service names
    internal_payload = {
        "pole_id": request.poleId,
        "current": request.current,
        "voltage": request.voltage,
        "light_intensity": request.lightIntensity,
        "temperature": request.temperature,
        "neighbor_confirmation": request.neighborConfirmation,
        "operating_hours": request.operatingHours,
        "previous_failures": request.previousFailures,
    }

    # 2. Invoke prediction service with robust error handling
    try:
        decision = prediction_service.predict_streetlight(internal_payload)
        return decision

    except ValueError as val_err:
        logger.warning("Input validation error on pole '%s': %s", request.poleId, val_err)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err)
        ) from val_err

    except Exception as exc:
        logger.error(
            "Unexpected error while processing prediction for pole '%s': %s",
            request.poleId, exc, exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while processing the prediction."
        ) from exc
