from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

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
    book: dict  # Will include book details
    
    class Config:
        from_attributes = True

class CartEntryCreate(BaseModel):
    book_id: int

class CartEntryResponse(BaseModel):
    id: int
    user_id: int
    book_id: int
    added_at: datetime
    book: dict
    
    class Config:
        from_attributes = True
