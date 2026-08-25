"""
Voice Agent Module
Provides native conversational voice interface, natural language intent resolution,
and tool dispatch for the AI Finance Controller.
"""
from typing import Dict, Any, List
from app.agents.finance_controller import finance_controller_agent
from app.models.agent import AgentChatResponse

class VoiceAgent:
    def __init__(self):
        self.controller = finance_controller_agent

    def process_voice_query(self, transcript: str, session_id: str = "voice_session") -> Dict[str, Any]:
        """
        Process speech transcript through the Finance Controller agent workflow
        and format response for both voice synthesis (TTS) and UI visual render.
        """
        if not transcript or not transcript.strip():
            return {
                "spoken_response": "I didn't catch that. You can ask me about reconciliation rates, settlement variances, or today's cash position.",
                "text_response": "Please speak or type a financial query.",
                "tools_used": [],
                "data_payload": None,
                "suggested_actions": ["Why is today's reconciliation rate low?", "Show me the largest settlement discrepancy", "How much cash is expected tomorrow?"]
            }

        agent_response: AgentChatResponse = self.controller.process_query(
            query=transcript.strip(),
            conversation_id=session_id
        )

        # Craft concise, natural spoken response for TTS
        spoken_text = agent_response.reply
        # Clean markdown headers or asterisks for clean audio speech synthesis
        spoken_text = spoken_text.replace("**", "").replace("#", "").replace("- ", "").strip()

        return {
            "transcript": transcript,
            "spoken_response": spoken_text,
            "text_response": agent_response.reply,
            "tools_used": agent_response.tools_used,
            "reasoning_steps": agent_response.reasoning_steps,
            "data_payload": agent_response.data_payload,
            "suggested_actions": agent_response.suggested_actions,
            "action_type": agent_response.action_type
        }

voice_agent = VoiceAgent()
