from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db import get_db
from app.db.models import LibraryEntry, CartEntry, Book
from app.schemas.library import LibraryEntryCreate, LibraryEntryUpdate, LibraryEntryResponse, CartEntryCreate, CartEntryResponse
from app.core.security import get_current_user_id

router = APIRouter()

@router.get("/", response_model=List[LibraryEntryResponse])
def get_library(
    user_id: int = Depends(get_current_user_id),
    status_filter: str = None,
    is_favorite: bool = None,
    is_bookmarked: bool = None,
    db: Session = Depends(get_db)
):
    """Get user's library entries"""
    query = db.query(LibraryEntry).filter(LibraryEntry.user_id == user_id)
    
    if status_filter:
        query = query.filter(LibraryEntry.status == status_filter)
    if is_favorite is not None:
        query = query.filter(LibraryEntry.is_favorite == is_favorite)
    if is_bookmarked is not None:
        query = query.filter(LibraryEntry.is_bookmarked == is_bookmarked)
    
    entries = query.order_by(LibraryEntry.updated_at.desc()).all()
    
    result = []
    for entry in entries:
        book = db.query(Book).filter(Book.id == entry.book_id).first()
        result.append({
            "id": entry.id,
            "user_id": entry.user_id,
            "book_id": entry.book_id,
            "status": entry.status,
            "is_favorite": entry.is_favorite,
            "is_bookmarked": entry.is_bookmarked,
            "progress": entry.progress,
            "rating": entry.rating,
            "notes": entry.notes,
            "added_at": entry.added_at,
            "updated_at": entry.updated_at,
            "book": {
                "id": book.id,
                "title": book.title,
                "author_name": book.author.name if book.author else None,
                "cover_url": book.cover_url,
                "rating": book.rating
            } if book else None
        })
    
    return result

@router.post("/", response_model=LibraryEntryResponse, status_code=status.HTTP_201_CREATED)
def add_to_library(
    entry_data: LibraryEntryCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add a book to user's library"""
    book = db.query(Book).filter(Book.id == entry_data.book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    
    existing = db.query(LibraryEntry).filter(
        LibraryEntry.user_id == user_id,
        LibraryEntry.book_id == entry_data.book_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Book already in library")
    
    progress = entry_data.progress
    if entry_data.status == "completed":
        progress = 100
    
    new_entry = LibraryEntry(
        user_id=user_id,
        book_id=entry_data.book_id,
        status=entry_data.status,
        is_favorite=entry_data.is_favorite,
        is_bookmarked=entry_data.is_bookmarked,
        progress=progress,
        rating=entry_data.rating,
        notes=entry_data.notes
    )
    
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    
    return {
        "id": new_entry.id,
        "user_id": new_entry.user_id,
        "book_id": new_entry.book_id,
        "status": new_entry.status,
        "is_favorite": new_entry.is_favorite,
        "is_bookmarked": new_entry.is_bookmarked,
        "progress": new_entry.progress,
        "rating": new_entry.rating,
        "notes": new_entry.notes,
        "added_at": new_entry.added_at,
        "updated_at": new_entry.updated_at,
        "book": {
            "id": book.id,
            "title": book.title,
            "author_name": book.author.name if book.author else None,
            "cover_url": book.cover_url,
            "rating": book.rating
        }
    }

@router.put("/{entry_id}", response_model=LibraryEntryResponse)
def update_library_entry(
    entry_id: int,
    entry_data: LibraryEntryUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a library entry"""
    entry = db.query(LibraryEntry).filter(
        LibraryEntry.id == entry_id,
        LibraryEntry.user_id == user_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Library entry not found")
    
    if entry_data.status:
        if entry_data.status == "completed" and entry.status != "completed":
            entry.progress = 100
        elif entry.status == "completed" and entry_data.status != "completed":
            entry.progress = 90 if entry_data.status == "currently_reading" else 0
        entry.status = entry_data.status
    
    if entry_data.is_favorite is not None:
        entry.is_favorite = entry_data.is_favorite
    if entry_data.is_bookmarked is not None:
        entry.is_bookmarked = entry_data.is_bookmarked
    
    if entry_data.progress is not None:
        if entry_data.progress == 100 and entry.progress != 100:
            entry.status = "completed"
        elif entry_data.progress < 100 and entry.status == "completed":
            entry.status = "currently_reading"
        entry.progress = entry_data.progress
    
    if entry_data.rating is not None:
        entry.rating = entry_data.rating
    if entry_data.notes is not None:
        entry.notes = entry_data.notes
    
    db.commit()
    db.refresh(entry)
    
    book = db.query(Book).filter(Book.id == entry.book_id).first()
    return {
        "id": entry.id,
        "user_id": entry.user_id,
        "book_id": entry.book_id,
        "status": entry.status,
        "is_favorite": entry.is_favorite,
        "is_bookmarked": entry.is_bookmarked,
        "progress": entry.progress,
        "rating": entry.rating,
        "notes": entry.notes,
        "added_at": entry.added_at,
        "updated_at": entry.updated_at,
        "book": {
            "id": book.id,
            "title": book.title,
            "author_name": book.author.name if book.author else None,
            "cover_url": book.cover_url,
            "rating": book.rating
        } if book else None
    }

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_library(
    entry_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    entry = db.query(LibraryEntry).filter(LibraryEntry.id == entry_id, LibraryEntry.user_id == user_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Library entry not found")
    
    db.delete(entry)
    db.commit()
    return None

# --- Cart Endpoints ---

@router.get("/cart", response_model=List[CartEntryResponse])
def get_cart(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    entries = db.query(CartEntry).filter(CartEntry.user_id == user_id).all()
    result = []
    for entry in entries:
        book = db.query(Book).filter(Book.id == entry.book_id).first()
        result.append({
            "id": entry.id,
            "user_id": entry.user_id,
            "book_id": entry.book_id,
            "added_at": entry.added_at,
            "book": {
                "id": book.id,
                "title": book.title,
                "author_name": book.author.name if book.author else None,
                "cover_url": book.cover_url,
                "rating": book.rating
            } if book else None
        })
    return result

@router.post("/cart", response_model=CartEntryResponse, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    entry_data: CartEntryCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == entry_data.book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
        
    existing = db.query(CartEntry).filter(CartEntry.user_id == user_id, CartEntry.book_id == entry_data.book_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Book already in cart")
        
    new_entry = CartEntry(user_id=user_id, book_id=entry_data.book_id)
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    
    return {
        "id": new_entry.id,
        "user_id": new_entry.user_id,
        "book_id": new_entry.book_id,
        "added_at": new_entry.added_at,
        "book": {
            "id": book.id,
            "title": book.title,
            "author_name": book.author.name if book.author else None,
            "cover_url": book.cover_url,
            "rating": book.rating
        }
    }

@router.delete("/cart/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_cart(
    entry_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    entry = db.query(CartEntry).filter(CartEntry.id == entry_id, CartEntry.user_id == user_id).first()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart entry not found")
    
    db.delete(entry)
    db.commit()
    return None
