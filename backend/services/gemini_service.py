from services.brand_identity import brand_system_instruction  # TAKEGRID_BRANDING_V1

import os

from dotenv import load_dotenv
from services.gemini_model_router import client_for

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing in .env")

client = client_for("general")  # Resilient per-feature model routing


def generate_text(prompt: str) -> str:
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("A non-empty prompt is required")

    prompt = prompt.strip()

    if len(prompt) > 12000:
        raise ValueError("Prompt exceeds maximum length")

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config={"system_instruction": brand_system_instruction("You are a creative filmmaking assistant.")},
    )

    result = (response.text or "").strip()

    if not result:
        raise RuntimeError("AI returned an empty response")

    return result
