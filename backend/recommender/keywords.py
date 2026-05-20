import httpx
import json
import os
import logging

logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

def getkeywords(user_input: str) -> list[str]:
    prompt = (
        "Extract 4-6 OpenLibrary subject search keywords from this request. "
        "Return ONLY a JSON array of strings, no explanation, no other text.\n"
        'Example output: ["mathematics", "popular science", "history"]\n'
        f"Request: {user_input}"
    )

    try:
        response = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": "mistral", "prompt": prompt, "stream": False},
            timeout=30.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as e:
        logger.error("Ollama request failed: %s", e)
        return []

    data = response.json()
    raw = data.get("response", "")

    try:
        keywords = json.loads(raw)
        return keywords if isinstance(keywords, list) else []
    except json.JSONDecodeError:
        logger.warning("Could not parse Ollama response as JSON: %s", raw)
        return []

if __name__ == "__main__":
    print(getkeywords("I want a dense mathematical book that reads like a story"))

    