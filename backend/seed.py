"""
Run once to populate the books table from the hardcoded data in script.js.
Usage: DATABASE_URL=... python seed.py
"""
from database.db import SessionLocal, init_db
from database.models import Book

BOOKS = [
    # Currently reading
    {"title": "The Denial of Death",                          "author": "Ernest Becker",         "type": "casual", "status": "reading"},
    {"title": "Inferno",                                      "author": "Dante Alighieri",        "type": "casual", "status": "reading"},
    {"title": "Partial Differential Equations: An Introduction", "author": "Walter A. Strauss",   "type": "formal", "status": "reading"},
    # Finished — casual
    {"title": "The Human Stain",                              "author": "Philip Roth",            "type": "casual", "status": "finished"},
    {"title": "Chaos",                                        "author": "James Gleick",           "type": "casual", "status": "finished"},
    {"title": "Atomic Habits",                                "author": "James Clear",            "type": "casual", "status": "finished"},
    {"title": "Crime and Punishment",                         "author": "Fyodor Dostoevsky",      "type": "casual", "status": "finished"},
    {"title": "48 Laws of Power",                             "author": "Robert Greene",          "type": "casual", "status": "finished"},
    {"title": "How to Be a Stoic",                            "author": "Massimo Pigliucci",      "type": "casual", "status": "finished"},
    {"title": "The Fractal Geometry of Nature",               "author": "Benoit B. Mandelbrot",   "type": "casual", "status": "finished"},
    {"title": "Notes from Underground",                       "author": "Fyodor Dostoevsky",      "type": "casual", "status": "finished"},
    {"title": "The Idiot",                                    "author": "Fyodor Dostoevsky",      "type": "casual", "status": "finished"},
    # Finished — formal
    {"title": "The Information",                              "author": "James Gleick",           "type": "formal", "status": "finished"},
    {"title": "Computer Architecture: A Quantitative Approach", "author": "Hennessy & Patterson", "type": "formal", "status": "finished"},
]

def seed():
    init_db()
    db = SessionLocal()
    try:
        if db.query(Book).count() > 0:
            print("Database already seeded — skipping.")
            return
        for data in BOOKS:
            db.add(Book(**data))
        db.commit()
        print(f"Seeded {len(BOOKS)} books.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
