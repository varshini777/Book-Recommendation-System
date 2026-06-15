from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class BookBase(BaseModel):
    title: str
    author_name: str
    cover_url: Optional[str] = None
    language: str = "English"
    year: Optional[int] = None
    pages: Optional[int] = None
    isbn: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class BookCreate(BookBase):
    genres: List[str] = []

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author_name: Optional[str] = None
    cover_url: Optional[str] = None
    language: Optional[str] = None
    year: Optional[int] = None
    pages: Optional[int] = None
    isbn: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    genres: Optional[List[str]] = None
    is_active: Optional[bool] = None

class BookResponse(BaseModel):
    id: int
    title: str
    author_name: str
    cover_url: Optional[str]
    language: str
    year: Optional[int]
    pages: Optional[int]
    isbn: Optional[str]
    rating: float
    rating_count: int
    description: Optional[str]
    tags: Optional[List[str]]
    genres: List[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class BookSearchRequest(BaseModel):
    query: Optional[str] = None
    genre: Optional[str] = None
    language: Optional[str] = None
    year: Optional[int] = None
    min_rating: Optional[float] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
