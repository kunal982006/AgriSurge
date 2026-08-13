from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import RiskPredictionInput, RiskPredictionOutput, RiskFactor
from .predictor import run_prediction

app = FastAPI(
    title="AgriSurge Risk Service",
    description="Agricultural/crop-failure risk prediction. Pricing is NOT computed here — see lib/pricing on the frontend.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production to the Next.js app's origin
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict-risk", response_model=RiskPredictionOutput, response_model_by_alias=True)
def predict_risk(payload: RiskPredictionInput):
    try:
        record = payload.model_dump(by_alias=False)
        result = run_prediction(record)
        return RiskPredictionOutput(
            risk_score=result["risk_score"],
            risk_level=result["risk_level"],
            model_name=result["model_name"],
            model_version=result["model_version"],
            generated_at=result["generated_at"],
            factors=[RiskFactor(**f) for f in result["factors"]],
            is_mock=result["is_mock"],
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Risk model inference failed: {exc}") from exc
