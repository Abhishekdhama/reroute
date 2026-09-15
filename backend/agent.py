import json
import os
from typing import Any

from pydantic import BaseModel, Field

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

class UpdateInsights(BaseModel):
    is_blocked: bool = Field(description="True if the update indicates the task cannot proceed.")
    blocker_reason: str | None = Field(description="The specific reason the work is blocked, if any.")
    suggested_unblock_question: str | None = Field(description="A concise, polite question to ask the owner to get this unblocked or clarify the ETA.")
    confidence: str = Field(description="High, Medium, or Low confidence in this extraction.")

def extract_insights_from_update(task_title: str, owner: str, update_text: str) -> UpdateInsights:
    """Uses an LLM to extract structured insights from a messy, human-written status update."""
    if not update_text or update_text.strip() == "":
        return UpdateInsights(
            is_blocked=False,
            blocker_reason=None,
            suggested_unblock_question=f"Hi {owner}, could you provide a status update for '{task_title}'?",
            confidence="High"
        )

    api_key = os.environ.get("GEMINI_API_KEY")
    if not HAS_GENAI or not api_key:
        is_blocked = "block" in update_text.lower() or "wait" in update_text.lower()
        reason = update_text if is_blocked else None
        question = f"Hi {owner}, what is needed to unblock '{task_title}' and what is the revised ETA?" if is_blocked else None
        
        return UpdateInsights(
            is_blocked=is_blocked,
            blocker_reason=reason,
            suggested_unblock_question=question,
            confidence="Medium (Mocked)"
        )

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    prompt = f"""
    You are an AI delivery-rescue agent.
    Analyze the following task update from a project board and extract the requested insights.
    
    Task: {task_title}
    Owner: {owner}
    Update text: "{update_text}"
    
    Return a JSON object exactly matching the requested schema.
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=UpdateInsights,
                temperature=0.1
            )
        )
        data = json.loads(response.text)
        return UpdateInsights(**data)
    except Exception:
        return UpdateInsights(
            is_blocked=False,
            blocker_reason=None,
            suggested_unblock_question=None,
            confidence="Low"
        )

if __name__ == "__main__":
    print(extract_insights_from_update(
        "Payment service API", 
        "Priya", 
        "Refund webhooks cannot be verified until the provider issues sandbox credentials. Ticket raised with their support team, no ETA yet."
    ))
