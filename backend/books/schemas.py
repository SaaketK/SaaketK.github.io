from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime


class BookOut(BaseModel):
    id: int
    title: str
    author: str
    type: str
    status: str
    rating: Optional[int]
    thoughts: Optional[str]

    model_config = {"from_attributes": True}


class BookCreate(BaseModel):
    title: str
    author: str
    type: str    # casual / formal
    status: str  # reading / finished / pending


class BookUpdate(BaseModel):
    status: Optional[str] = None
    rating: Optional[int] = None
    thoughts: Optional[str] = None


class RecommendationIn(BaseModel):
    title: str
    author: Optional[str] = None
    type: str = "casual"
    note: Optional[str] = None
    submitter: Optional[str] = None


class RecommendationOut(BaseModel):
    id: int
    author: Optional[str]
    comment: str
    submitted_at: datetime
    book: BookOut

    model_config = {"from_attributes": True}


class RecommendRequest(BaseModel):
    query: str
    top_n: int = 20


class RecommendedBook(BaseModel):
    title: str
    author_name: list[str] = []
    subject: list[str] = []
    first_sentence: Optional[Any] = None
    key: Optional[str] = None
