from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator

class ToolExecutionTrace(BaseModel):
    tool_name: str
    tool_input: Dict[str, Any]
    tool_output_summary: str
    status: str = "success"

class AgentChatRequest(BaseModel):
    message: Optional[str] = None
    query: Optional[str] = None
    conversation_id: Optional[str] = "conv_default"
    role: Optional[str] = "merchant"

    def get_text(self) -> str:
        return self.query or self.message or ""

class AgentChatResponse(BaseModel):
    response: str
    intent: str
    tools_used: List[str] = []
    reasoning_steps: List[str] = []
    traces: List[ToolExecutionTrace] = []
    suggested_actions: List[str] = []
    action_type: Optional[str] = None  # e.g., navigate_to_exceptions, run_reconciliation
    data_payload: Optional[Dict[str, Any]] = None

    @property
    def reply(self) -> str:
        return self.response

class AuditEventModel(BaseModel):
    id: str
    timestamp: str
    agent: str
    action: str
    tool_used: Optional[str] = None
    input_summary: str
    result_summary: str
    status: str
    confidence: float
