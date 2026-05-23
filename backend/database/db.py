import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from database.models import Base
# 1. Import the dotenv loader
from dotenv import load_dotenv 

# 2. Automatically look for a .env file and load its variables into os.environ
load_dotenv() 

DATABASE_URL = os.getenv("DATABASE_URL")

# Safety Check: If you forgot to create the .env file, this will give you a clear error
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is missing! Check your .env file.")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()