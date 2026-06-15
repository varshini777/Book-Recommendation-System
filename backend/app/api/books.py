from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import get_db
from app.db.models import Book, Author, Genre
from app.schemas.book import BookCreate, BookUpdate, BookResponse, BookSearchRequest
from app.core.security import get_current_user_id, get_current_admin_id

router = APIRouter()

@router.get("/", response_model=List[BookResponse])
def get_books(
    query: Optional[str] = None,
    genre: Optional[str] = None,
    language: Optional[str] = None,
    year: Optional[int] = None,
    min_rating: Optional[float] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all books with filtering and pagination"""
    books_query = db.query(Book).filter(Book.is_active == True)
    
    if query:
        search_term = f"%{query}%"
        books_query = books_query.filter(
            Book.title.ilike(search_term) |
            Book.description.ilike(search_term)
        )
    
    if genre:
        books_query = books_query.join(Book.genres).filter(Genre.name == genre)
    
    if language:
        books_query = books_query.filter(Book.language == language)
    
    if year:
        books_query = books_query.filter(Book.year == year)
    
    if min_rating:
        books_query = books_query.filter(Book.rating >= min_rating)
    
    # Pagination
    offset = (page - 1) * page_size
    books = books_query.offset(offset).limit(page_size).all()
    
    return books

@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: int, db: Session = Depends(get_db)):
    """Get a specific book by ID"""
    book = db.query(Book).filter(Book.id == book_id, Book.is_active == True).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    return book

@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book_data: BookCreate,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Create a new book (admin only)"""
    # Find or create author
    author = db.query(Author).filter(Author.name == book_data.author_name).first()
    if not author:
        author = Author(name=book_data.author_name)
        db.add(author)
        db.commit()
        db.refresh(author)
    
    # Create book
    new_book = Book(
        title=book_data.title,
        author_id=author.id,
        cover_url=book_data.cover_url,
        language=book_data.language,
        year=book_data.year,
        pages=book_data.pages,
        isbn=book_data.isbn,
        description=book_data.description,
        tags=book_data.tags
    )
    
    # Add genres
    for genre_name in book_data.genres:
        genre = db.query(Genre).filter(Genre.name == genre_name).first()
        if not genre:
            genre = Genre(name=genre_name)
            db.add(genre)
            db.commit()
            db.refresh(genre)
        new_book.genres.append(genre)
    
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    
    return new_book

@router.put("/{book_id}", response_model=BookResponse)
def update_book(
    book_id: int,
    book_data: BookUpdate,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Update a book (admin only)"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    # Update fields
    if book_data.title is not None:
        book.title = book_data.title
    if book_data.author_name is not None:
        author = db.query(Author).filter(Author.name == book_data.author_name).first()
        if not author:
            author = Author(name=book_data.author_name)
            db.add(author)
            db.commit()
            db.refresh(author)
        book.author_id = author.id
    if book_data.cover_url is not None:
        book.cover_url = book_data.cover_url
    if book_data.language is not None:
        book.language = book_data.language
    if book_data.year is not None:
        book.year = book_data.year
    if book_data.pages is not None:
        book.pages = book_data.pages
    if book_data.isbn is not None:
        book.isbn = book_data.isbn
    if book_data.description is not None:
        book.description = book_data.description
    if book_data.tags is not None:
        book.tags = book_data.tags
    if book_data.is_active is not None:
        book.is_active = book_data.is_active
    
    # Update genres if provided
    if book_data.genres is not None:
        book.genres.clear()
        for genre_name in book_data.genres:
            genre = db.query(Genre).filter(Genre.name == genre_name).first()
            if not genre:
                genre = Genre(name=genre_name)
                db.add(genre)
                db.commit()
                db.refresh(genre)
            book.genres.append(genre)
    
    db.commit()
    db.refresh(book)
    
    return book

@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Delete a book (admin only)"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    db.delete(book)
    db.commit()
    
    return None

@router.get("/genres/list")
def get_genres(db: Session = Depends(get_db)):
    """Get all available genres"""
    genres = db.query(Genre).all()
    return [{"id": g.id, "name": g.name} for g in genres]

@router.get("/authors/list")
def get_authors(db: Session = Depends(get_db)):
    """Get all authors"""
    authors = db.query(Author).all()
    return [{"id": a.id, "name": a.name} for a in authors]
