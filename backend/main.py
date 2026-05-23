from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from tools.yt_downloader import router as yt_router
from tools.gds_scraper import router as gds_router
from tools.heic_converter import router as heic_router
from tools.clipboard import router as clipboard_router
from books.router import router as books_router
from database.db import init_db, SessionLocal
import os
from dotenv import load_dotenv

# Force load the .env file explicitly from the project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI(title="SaaketK Backend")

# Allow requests from GitHub Pages site and localhost for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://saaketk.github.io"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["*"],
)

app.include_router(yt_router,        prefix="/yt",        tags=["YouTube"])
app.include_router(gds_router,       prefix="/gds",       tags=["GDS Menu"])
app.include_router(heic_router,      prefix="/heic",      tags=["HEIC Converter"])
app.include_router(clipboard_router, prefix="/clipboard", tags=["Clipboard"])
app.include_router(books_router,     prefix="/books",     tags=["Books"])


@app.get("/ping")
def ping():
    return {"status": "pong"}

@app.get("/health")
def health():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "ok"
    except Exception:
        db_status = "unavailable"
    return {"status": "ok", "db": db_status}

@app.on_event("startup")
def startup():
    init_db()