from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from backend.services.cyber_telemetry import get_clean_telemetry, query_cyber_copilot

router = APIRouter(prefix="/api/cyber", tags=["cyber"])

class ChatRequest(BaseModel):
    query: str

@router.get("/dashboard")
def get_cyber_dashboard():
    return get_clean_telemetry()

@router.post("/chat")
def chat_cyber_copilot(req: ChatRequest):
    return query_cyber_copilot(req.query)
