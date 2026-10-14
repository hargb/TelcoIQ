
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    create_engine,
    desc,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session


# --------------------------------------------------
# 1. PATHS AND CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

MODEL_PATH = BASE_DIR / "churn_model.joblib"
METADATA_PATH = BASE_DIR / "model_metadata.json"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

if not METADATA_PATH.exists():
    raise FileNotFoundError(f"Metadata not found: {METADATA_PATH}")

model = joblib.load(MODEL_PATH)

with open(METADATA_PATH, "r", encoding="utf-8") as file:
    metadata = json.load(file)

THRESHOLD = float(metadata["threshold"])

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL missing. Check your root .env file."
    )


# --------------------------------------------------
# 2. DATABASE CONNECTION
# --------------------------------------------------

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()


class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(
        String(100), nullable=False, index=True
    )

    prediction = Column(String(10), nullable=False)

    churn_probability = Column(Float, nullable=False)

    risk_level = Column(String(20), nullable=False)

    threshold = Column(Float, nullable=False)

    customer_features = Column(JSON, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )


# Create the table if it does not exist.
Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --------------------------------------------------
# 3. FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="TelcoIQ Customer Churn API",
    description=(
        "Customer churn prediction with PostgreSQL "
        "prediction history."
    ),
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://telco-iq.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --------------------------------------------------
# 4. CUSTOMER INPUT SCHEMA
# --------------------------------------------------

class CustomerData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customer_id: str | None = None

    gender: str
    SeniorCitizen: int
    Partner: str
    Dependents: str
    tenure: int
    PhoneService: str
    MultipleLines: str
    InternetService: str
    OnlineSecurity: str
    OnlineBackup: str
    DeviceProtection: str
    TechSupport: str
    StreamingTV: str
    StreamingMovies: str
    Contract: str
    PaperlessBilling: str
    PaymentMethod: str
    MonthlyCharges: float
    TotalCharges: float


# --------------------------------------------------
# 5. HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "Welcome to TelcoIQ Customer Churn API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "model_loaded": model is not None,
            "database_connected": True,
        }

    except Exception:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "error",
                "model_loaded": model is not None,
                "database_connected": False,
            },
        )


# --------------------------------------------------
# 6. CHURN PREDICTION
# --------------------------------------------------

@app.post("/predict")
def predict_churn(
    customer: CustomerData,
    db: Session = Depends(get_db),
):
    try:
        # Keep customer_id out of the model features.
        customer_features = customer.model_dump(
            exclude={"customer_id"}
        )

        customer_df = pd.DataFrame([customer_features])

        # Get the probability for the "Yes" class.
        probabilities = model.predict_proba(customer_df)[0]
        classes = list(model.classes_)

        if "Yes" not in classes:
            raise RuntimeError(
                "Trained model does not contain a 'Yes' class."
            )

        yes_index = classes.index("Yes")
        churn_probability = float(probabilities[yes_index])

        prediction = (
            "Yes"
            if churn_probability >= THRESHOLD
            else "No"
        )

        # Risk level follows the selected decision threshold.
        risk_level = "High" if prediction == "Yes" else "Low"

        customer_id = (
            customer.customer_id.strip()
            if customer.customer_id
            and customer.customer_id.strip()
            else "UNSPECIFIED"
        )

        record = PredictionHistory(
            customer_id=customer_id,
            prediction=prediction,
            churn_probability=churn_probability,
            risk_level=risk_level,
            threshold=THRESHOLD,
            customer_features=customer_features,
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "id": record.id,
            "customer_id": record.customer_id,
            "prediction": record.prediction,
            "churn_probability": round(
                record.churn_probability, 4
            ),
            "risk_level": record.risk_level,
            "threshold": record.threshold,
            "created_at": record.created_at.isoformat(),
        }

    except HTTPException:
        db.rollback()
        raise

    except (ValueError, KeyError) as error:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Invalid prediction input: {error}",
        )

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=(
                "Prediction failed. Check the backend terminal "
                "for the underlying error."
            ),
        )


# --------------------------------------------------
# 7. PREDICTION HISTORY
# --------------------------------------------------

@app.get("/history")
def get_prediction_history(
    limit: int = 50,
    db: Session = Depends(get_db),
):
    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100.",
        )

    try:
        records = (
            db.query(PredictionHistory)
            .order_by(desc(PredictionHistory.created_at))
            .limit(limit)
            .all()
        )

        return [
            {
                "id": record.id,
                "customer_id": record.customer_id,
                "prediction": record.prediction,
                "churn_probability": round(
                    record.churn_probability, 4
                ),
                "risk_level": record.risk_level,
                "threshold": record.threshold,
                "created_at": record.created_at.isoformat(),
            }
            for record in records
        ]

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Could not retrieve prediction history.",
        )
