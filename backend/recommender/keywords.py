import httpx
import json 
import os

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

def getkeywords(user_input: str) -> list[str]:
    prompt = f"""Extract 4-6 OpenLibrary subject search keywords from this request. Return ONLY a JSON array of strings, no explanation, no other text. 
    Example output: ["mathematics", "popular science", "history"]
    Request: {user_input}"""
    
    response = httpx.post(f"{OLLAMA_URL}/api/generate", json = {"model":"mistral", "prompt": prompt, "stream": False})
    data = response.json()
    print(data)
    raw = data["response"]

    try:
        keywords = json.loads(raw)
        return keywords
    except json.JSONDecodeError: 
        return []

if __name__ == "__main__":
    print(getkeywords("I want a dense mathematical book that reads like a story"))

    