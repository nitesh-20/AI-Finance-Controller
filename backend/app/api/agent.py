from fastapi import APIRouter
from ..models.agent import AgentChatRequest, AgentChatResponse
from ..agents.finance_controller import finance_controller_agent

router = APIRouter(prefix="/agent", tags=["AI Copilot Agent"])

@router.post("/chat", response_model=AgentChatResponse)
async def chat_with_finance_agent(request: AgentChatRequest):
    """Interact with Central Finance Controller Agent with real tool execution & reasoning traces."""
    query_text = request.get_text()
    response = finance_controller_agent.process_query(
        query=query_text,
        conversation_id=request.conversation_id or "conv_default"
    )
    return response
