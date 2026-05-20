import httpx

BASE_URL = "https://openlibrary.org/search.json"

def search_books(keywords: list[str], limit: int = 200) -> list[dict]:
    query = " ".join(keywords)

    response = httpx.get(
        BASE_URL,
        params={
            "q": query,
            "limit": limit,
            "fields": "title,author_name,subject,first_sentence,key",
        },
        timeout=30.0,
    )
    response.raise_for_status()
    return response.json().get("docs", [])

if __name__ == "__main__":
    results = search_books(["mathematics", "popular science"])
    print(f"Got {len(results)} books")
    if results:
        print(results[0])