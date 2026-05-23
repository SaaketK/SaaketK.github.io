import httpx
import json
import os
import logging
# 1. Import dotenv to ensure this file can read your .env configuration
from dotenv import load_dotenv 

logger = logging.getLogger(__name__)

# 2. Load the .env file explicitly
load_dotenv()

# 3. Swap 'localhost' to '127.0.0.1' as the bulletproof fallback address
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")

def getkeywords(user_input: str) -> list[str]:
    prompt = (
        "Extract 4-6 OpenLibrary subject search keywords from this request. "
        "Return ONLY a JSON array of strings, no explanation, no other text.\n"
        "Strip out general structural words like 'book', 'novel', 'read', 'story', etc. Focus on specific themes, topics, or genres.\n"
        "If the query is under 4 words, use the entire stripped query as a keyword\n"
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
        # This will now print the exact URL it tried to hit if it fails
        logger.error("Ollama request failed at URL %s: %s", OLLAMA_URL, e)
        return []

    data = response.json()
    raw = data.get("response", "")

    try:
        keywords = json.loads(raw)
        print(f"\n[MISTRAL OUTPUT ARRAY]: {keywords} (Raw text: '{raw.strip()}')\n")
        return keywords if isinstance(keywords, list) else []
    except json.JSONDecodeError:
        logger.warning("Could not parse Ollama response as JSON: %s", raw)
        return []

if __name__ == "__main__":
    print(getkeywords("I want a dense mathematical book that reads like a story"))