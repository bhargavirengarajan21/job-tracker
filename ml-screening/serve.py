"""FastAPI service exposing the fine-tuned DistilBERT resume-screening model.

Run:  uvicorn serve:app --host 127.0.0.1 --port 8000
      (set MODEL_DIR to the trained model directory; default ./distilbert-screen)

POST /predict  {"resume": "...", "job_description": "..."}
  -> {"decision": "select"|"reject", "score": 0.87}
"""
import os
import torch
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_DIR = os.getenv("MODEL_DIR", "distilbert-screen")
MAX_LEN = int(os.getenv("MAX_LEN", "256"))

app = FastAPI(title="Resume Screening Model (DistilBERT)")
_tok = None
_model = None


def get_model():
    global _tok, _model
    if _model is None:
        _tok = AutoTokenizer.from_pretrained(MODEL_DIR)
        _model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
        _model.eval()
    return _tok, _model


class ScreenRequest(BaseModel):
    resume: str
    job_description: str = ""


class ScreenResponse(BaseModel):
    decision: str
    score: float


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_DIR}


@app.post("/predict", response_model=ScreenResponse)
def predict(req: ScreenRequest):
    tok, model = get_model()
    inputs = tok(req.resume, req.job_description, truncation=True,
                 max_length=MAX_LEN, return_tensors="pt")
    with torch.no_grad():
        logits = model(**inputs).logits[0]
    score = float(torch.softmax(logits, dim=-1)[1])  # P(select)
    return ScreenResponse(
        decision="select" if score >= 0.5 else "reject",
        score=round(score, 4),
    )
