from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel):
    data: List[Any]
    pagination: PaginationMeta


class LibraryEntryBase(BaseModel):
    book_id: int
    status: str = Field(default="want_to_read", pattern="^(want_to_read|currently_reading|completed)$")
    is_favorite: bool = Field(default=False)
    is_bookmarked: bool = Field(default=False)
    progress: int = Field(default=0, ge=0, le=100)
    rating: int = Field(default=0, ge=0, le=5)
    notes: Optional[str] = None


class LibraryEntryCreate(LibraryEntryBase):
    pass


class LibraryEntryUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(want_to_read|currently_reading|completed)$")
    is_favorite: Optional[bool] = None
    is_bookmarked: Optional[bool] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    rating: Optional[int] = Field(None, ge=0, le=5)
    notes: Optional[str] = None


class LibraryEntryResponse(BaseModel):
    id: int
    user_id: int
    book_id: int
    status: str
    is_favorite: bool
    is_bookmarked: bool
    progress: int
    rating: int
    notes: Optional[str]
    added_at: datetime
    updated_at: datetime
    book: Optional[dict] = None

    class Config:
        from_attributes = True


class CartEntryCreate(BaseModel):
    book_id: int


class CartEntryResponse(BaseModel):
    id: int
    user_id: int
    book_id: int
    added_at: datetime
    book: Optional[dict] = None

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    is_spoiler: bool = False


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    book_id: int
    content: str
    is_spoiler: bool
    is_approved: bool
    created_at: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


class ReadingGoalCreate(BaseModel):
    target_books: int = Field(..., ge=1, le=500)
    target_year: int = Field(..., ge=2020, le=2100)


class ReadingGoalResponse(BaseModel):
    id: int
    user_id: int
    target_books: int
    target_year: int
    current_books: int
    created_at: datetime

    class Config:
        from_attributes = True
