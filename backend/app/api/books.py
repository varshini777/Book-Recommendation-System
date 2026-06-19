from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.db import get_db
from app.db.models import Book, Author, Genre
from app.schemas.book import BookCreate, BookUpdate, BookResponse
from app.core.security import get_current_user_id, get_current_admin_id
from app.services.book_service import BookService

router = APIRouter()


def _book_to_response(book: Book) -> dict:
    return {
        "id": book.id,
        "title": book.title,
        "author_name": book.author.name if book.author else "Unknown",
        "cover_url": book.cover_url,
        "language": book.language,
        "year": book.year,
        "pages": book.pages,
        "isbn": book.isbn,
        "rating": book.rating,
        "rating_count": book.rating_count,
        "description": book.description,
        "tags": book.tags or [],
        "genres": [g.name for g in book.genres] if book.genres else [],
        "is_active": book.is_active,
        "created_at": book.created_at.isoformat() if book.created_at else None,
    }


@router.get("/search")
def search_books(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db)
):
    book_service = BookService(db)
    books = book_service.search_books(q, limit)
    return {
        "query": q,
        "count": len(books),
        "books": [_book_to_response(b) for b in books]
    }


@router.get("/genres/list")
def get_genres(db: Session = Depends(get_db)):
    genres = db.query(Genre).all()
    return [{"id": g.id, "name": g.name, "description": g.description} for g in genres]


@router.get("/authors/list")
def get_authors(
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Author)
    if search:
        query = query.filter(Author.name.ilike(f"%{search}%"))
    authors = query.order_by(Author.name).limit(limit).all()
    return [{"id": a.id, "name": a.name} for a in authors]


@router.get("/")
def get_books(
    query: Optional[str] = None,
    genre: Optional[str] = None,
    language: Optional[str] = None,
    year: Optional[int] = None,
    min_rating: Optional[float] = None,
    author: Optional[str] = None,
    sort_by: str = Query("rating_desc", pattern="^(rating_desc|rating_asc|year_desc|year_asc|title_asc|title_desc|popularity|newest)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    book_service = BookService(db)
    books, total = book_service.get_all_books(
        query=query, genre=genre, language=language,
        year=year, min_rating=min_rating, author=author,
        sort_by=sort_by, page=page, page_size=page_size
    )

    total_pages = (total + page_size - 1) // page_size

    return {
        "books": [_book_to_response(b) for b in books],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
        "filters": {
            "query": query,
            "genre": genre,
            "language": language,
            "year": year,
            "min_rating": min_rating,
            "author": author,
            "sort_by": sort_by,
        }
    }


@router.get("/{book_id}")
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).options(
        joinedload(Book.author), joinedload(Book.genres)
    ).filter(Book.id == book_id, Book.is_active == True).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    return _book_to_response(book)


@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book_data: BookCreate,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    author = db.query(Author).filter(Author.name == book_data.author_name).first()
    if not author:
        author = Author(name=book_data.author_name)
        db.add(author)
        db.commit()
        db.refresh(author)

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

    book = db.query(Book).options(
        joinedload(Book.author), joinedload(Book.genres)
    ).filter(Book.id == new_book.id).first()
    return _book_to_response(book)


@router.put("/{book_id}", response_model=BookResponse)
def update_book(
    book_id: int,
    book_data: BookUpdate,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )

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

    book = db.query(Book).options(
        joinedload(Book.author), joinedload(Book.genres)
    ).filter(Book.id == book.id).first()
    return _book_to_response(book)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )

    db.delete(book)
    db.commit()

    return None
