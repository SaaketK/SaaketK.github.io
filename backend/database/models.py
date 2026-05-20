from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from typing import List, Optional
from datetime import datetime


class Base(DeclarativeBase):
    pass


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(100))
    author: Mapped[str] = mapped_column(String(100))
    type: Mapped[str] = mapped_column(String(10))        # casual/formal
    status: Mapped[str] = mapped_column(String(10))      # reading/finished/pending
    rating: Mapped[Optional[int]] = mapped_column(nullable=True)             
    thoughts: Mapped[Optional[str]] = mapped_column(nullable=True)           

    recommendations: Mapped[List["Recommendation"]] = relationship(back_populates="book")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(primary_key=True)
    author: Mapped[Optional[str]] = mapped_column(nullable=True)            
    comment: Mapped[str] = mapped_column(String(500))
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Get from Book table
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    book: Mapped["Book"] = relationship(back_populates="recommendations")


