from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tools.yt_downloader import router as yt_router
from tools.gds_scraper import router as gds_router
from tools.heic_converter import router as heic_router
from tools.clipboard import router as clipboard_router
from books.router import router as books_router
from database.db import init_db

app = FastAPI(title="SaaketK Backend")

# Allow requests from GitHub Pages site and localhost for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://saaketk.github.io",
        "http://localhost:3000",
        "http://127.0.0.1",
    ],
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["*"],
)

app.include_router(yt_router,        prefix="/yt",        tags=["YouTube"])
app.include_router(gds_router,       prefix="/gds",       tags=["GDS Menu"])
app.include_router(heic_router,      prefix="/heic",      tags=["HEIC Converter"])
app.include_router(clipboard_router, prefix="/clipboard", tags=["Clipboard"])
app.include_router(books_router,     prefix="/books",     tags=["Books"])


@app.get("/health")
def health():
    return {"status": "ok"}

@app.on_event("startup")
def startup():
    init_db()