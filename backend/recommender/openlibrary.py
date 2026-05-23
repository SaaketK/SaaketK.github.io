import httpx

BASE_URL = "https://openlibrary.org/search.json"

def search_books(keywords: list[str], limit: int = 200) -> list[dict]:
    # If Mistral gave us nothing, exit early
    if not keywords:
        return []

    # Wrap each phrase in quotes and join with a Solr "OR" operator
    query = " OR ".join(f'"{kw}"' for kw in keywords)

    response = httpx.get(
        BASE_URL,
        params={
            "q": query,
            "limit": limit,
            "fields": "title,author_name,subject,first_sentence,key,first_publish_year",
        },
        timeout=30.0,
    )
    response.raise_for_status()
    docs = response.json().get("docs", [])

    seen_pairs = set()
    cleaned_docs = []

    for d in docs:
        title = d.get("title", "").strip()
        title_lower = title.lower()

        # Extract author name cleanly
        authors = d.get("author_name", ["Unknown Author"])
        primary_author = authors[0].lower().strip() if authors else "unknown"

        # ─── THE NEW ROBUST AUTHOR NORMALIZATION 
        # 1. Strip commas and periods
        clean_author = primary_author.replace(",", "").replace(".", "").strip()
        
        # 2. Split the name into individual words, sort them alphabetically, and join
        # This converts both "john m howie" and "howie john m" -> "howie john m"
        sorted_author_words = " ".join(sorted(clean_author.split()))

        # Normalize the title string to drop volume/edition tags
        base_title = title_lower.split(" - ")[0].split(" -- ")[0].split(" (")[0].strip()
        
        # ─── USE THE SORTED AUTHOR STRING FOR THE FINGERPRINT 
        unique_book_fingerprint = (base_title, sorted_author_words)

        if unique_book_fingerprint in seen_pairs:
            # Duplicate edition or flipped author format successfully caught!
            continue
            
        seen_pairs.add(unique_book_fingerprint)
        cleaned_docs.append(d)

    return cleaned_docs

if __name__ == "__main__":
    # Test your specific problematic array manually
    test_keywords = ['real analysis', 'advanced mathematics', 'graduate level']
    results = search_books(test_keywords)
    print(f"Got {len(results)} books")
    if results:
        print("First result:", results[0].get("title"))