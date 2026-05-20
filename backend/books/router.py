from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from database.models import Book, Recommendation
from books.schemas import (
    BookOut, BookCreate, BookUpdate,
    RecommendationIn, RecommendationOut,
    RecommendRequest, RecommendedBook,
)
from recommender.keywords import getkeywords
from recommender.openlibrary import search_books
from recommender.embeddings import rank_books

router = APIRouter()


# ── User's book list ──────────────────────────────────────────────────────────

@router.get("", response_model=list[BookOut])
def list_books(
    status: str | None = None,
    type: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Book)
    if status:
        q = q.filter(Book.status == status)
    if type:
        q = q.filter(Book.type == type)
    return q.all()


@router.post("", response_model=BookOut, status_code=201)
def create_book(body: BookCreate, db: Session = Depends(get_db)):
    book = Book(**body.model_dump())
    db.add(book)
    db.commit()
    db.refresh(book)
    return book


@router.patch("/{book_id}", response_model=BookOut)
def update_book(book_id: int, body: BookUpdate, db: Session = Depends(get_db)):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(book, field, value)
    db.commit()
    db.refresh(book)
    return book


# ── Visitor recommendations ───────────────────────────────────────────────────

@router.post("/recommendations", response_model=RecommendationOut, status_code=201)
def submit_recommendation(body: RecommendationIn, db: Session = Depends(get_db)):
    book = Book(
        title=body.title,
        author=body.author or "Unknown",
        type=body.type,
        status="pending",
    )
    db.add(book)
    db.flush()

    rec = Recommendation(
        author=body.submitter,
        comment=body.note or "",
        book_id=book.id,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@router.get("/recommendations", response_model=list[RecommendationOut])
def list_recommendations(db: Session = Depends(get_db)):
    return (
        db.query(Recommendation)
        .order_by(Recommendation.submitted_at.desc())
        .all()
    )


# ── AI recommender ────────────────────────────────────────────────────────────
# Pipeline: query → Ollama keywords → OpenLibrary search → embeddings rerank
#
# TODO: once the Vamana C++ index is ready, swap in:
#   candidates = search_books(keywords, limit=10_000)
#   candidates = vamana_filter(candidates, query, top_k=200)
#   ranked = rank_books(query, candidates, top_n=body.top_n)

@router.post("/recommend", response_model=list[RecommendedBook])
def recommend_books(body: RecommendRequest):
    keywords = getkeywords(body.query)
    if not keywords:
        raise HTTPException(
            status_code=503,
            detail="Could not extract keywords — is Ollama running?",
        )

    candidates = search_books(keywords, limit=200)
    if not candidates:
        raise HTTPException(status_code=404, detail="No books found for those keywords")

    ranked = rank_books(body.query, candidates, top_n=body.top_n)
    return ranked
