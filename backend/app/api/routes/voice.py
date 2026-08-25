from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.models.agent import AgentChatRequest, AgentChatResponse
from app.agents.finance_controller import finance_controller_agent
from app.agents.voice_agent import voice_agent

router = APIRouter(prefix="", tags=["AI Copilot & Voice Agent"])

class VoiceQueryRequest(BaseModel):
    transcript: str
    session_id: Optional[str] = "voice_session"

@router.post("/agent/chat", response_model=AgentChatResponse)
async def chat_with_finance_agent(request: AgentChatRequest):
    """Interact with Central Finance Controller Agent with real tool execution & reasoning traces."""
    response = finance_controller_agent.process_query(
        query=request.message,
        conversation_id=request.conversation_id or "conv_default"
    )
    return response

@router.post("/voice/query")
async def process_voice_interaction(request: VoiceQueryRequest):
    """Native voice endpoint returning TTS-optimized speech and UI data cards."""
    return voice_agent.process_voice_query(
        transcript=request.transcript,
        session_id=request.session_id or "voice_session"
    )
