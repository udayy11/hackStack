"""
Chat API — AI assistant endpoint.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict
from ai.chat_assistant import chat_assistant

router = APIRouter(prefix="/api/chat", tags=["Chat"])


class ChatMessage(BaseModel):
    message: str
    context: Optional[Dict] = None
    session_id: Optional[str] = None


@router.post("")
async def chat(msg: ChatMessage):
    """Send a message to the AI assistant."""
    response = chat_assistant.respond(msg.message, msg.context)
    return response


@router.get("/suggestions")
async def get_suggestions():
    """Get suggested questions for the chat panel."""
    return {
        "suggestions": [
            "Why is my shipment delayed?",
            "What's the current risk level?",
            "Show me alternative routes",
            "How can I reduce carbon emissions?",
            "What's the demand forecast for Electronics?",
            "Which supplier has the best reliability?",
            "What actions were taken today?",
            "Help me understand the dashboard",
        ]
    }
