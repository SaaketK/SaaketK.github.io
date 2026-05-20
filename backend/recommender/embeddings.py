from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")

def build_book_text(book: dict) -> str:
    title = book.get("title", "")
    authors = ", ".join(book.get("author_name") or [])
    subjects = ", ".join((book.get("subject") or [])[:5])
    return f"{title} by {authors}. {subjects}"

def rank_books(query: str, books: list[dict], top_n: int = 20) -> list[dict]:
    if not books:
        return []

    book_texts = [build_book_text(b) for b in books]
    query_emb = model.encode([query])
    book_emb = model.encode(book_texts)

    query_norm = query_emb / np.linalg.norm(query_emb)
    norms = np.linalg.norm(book_emb, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    book_norm = book_emb / norms

    similarities = (book_norm @ query_norm.T).flatten()
    best_matches = np.argsort(similarities)[::-1][:top_n]
    return [books[i] for i in best_matches]

if __name__ == "__main__":
    fake_books = [
        {"title": "Chaos", "author_name": "James Gleick", "subject": ["mathematics", "science"]},
        {"title": "Crime and Punishment", "author_name": "Fyodor Dostoevsky", "subject": ["fiction", "russian literature"]},
    ]
    results = rank_books("mathematical books about nature", fake_books, top_n=2)
    for r in results:
        print(r["title"])
