from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.db import get_db
from app.db.models import Book, Author, Genre, LibraryEntry, Rating, UserPreference, SearchLog
from app.services.recommendation_service import RecommendationService
from app.services.book_service import BookService
from app.core.security import get_current_user_id, get_current_admin_id

router = APIRouter()


def _book_to_dict(book: Book, explanation: str = None, score: float = None):
    data = {
        "id": book.id,
        "title": book.title,
        "author_name": book.author.name if book.author else "Unknown",
        "author_id": book.author.id if book.author else None,
        "cover_url": book.cover_url,
        "rating": book.rating,
        "rating_count": book.rating_count,
        "year": book.year,
        "language": book.language,
        "genres": [g.name for g in book.genres] if book.genres else [],
        "description": book.description[:200] + "..." if book.description and len(book.description) > 200 else book.description,
        "isbn": book.isbn,
    }
    if explanation is None:
        genres_list = [g.name for g in book.genres] if book.genres else []
        if book.rating and book.rating >= 4.3:
            explanation = "Highly rated choice loved by readers"
        elif genres_list:
            explanation = f"Popular choice in {genres_list[0]}"
        else:
            explanation = "Trending choice among readers this week"
    data["explanation"] = explanation
    if score is not None:
        data["score"] = round(score, 4)
    return data


@router.get("/")
def get_recommendations(
    algorithm: str = "hybrid",
    limit: int = 12,
    exclude_book_ids: Optional[str] = None,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)

    exclude_ids = []
    if exclude_book_ids:
        try:
            exclude_ids = [int(x) for x in exclude_book_ids.split(",")]
        except:
            pass

    try:
        explained = recommendation_service.get_explained_recommendations(
            user_id, limit, exclude_ids, algorithm
        )

        for book, explanation, score in explained:
            recommendation_service.log_recommendation(
                user_id=user_id, book_id=book.id, algorithm=algorithm,
                score=score, reason=explanation
            )

        return {
            "algorithm": algorithm,
            "count": len(explained),
            "books": [_book_to_dict(b, e, s) for b, e, s in explained]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/personalized")
def get_personalized_picks(
    limit: int = 12,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    explained = recommendation_service.get_explained_recommendations(user_id, limit, [], "hybrid")
    return {
        "count": len(explained),
        "books": [_book_to_dict(b, e, s) for b, e, s in explained]
    }


@router.get("/cold-start")
def get_cold_start(
    limit: int = 12,
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    books = recommendation_service.get_cold_start_recommendations(limit)
    return {
        "count": len(books),
        "books": [_book_to_dict(b, explanation="Trending choice among readers this week") for b in books]
    }


@router.get("/similar/{book_id}")
def get_similar_books(
    book_id: int,
    limit: int = 6,
    db: Session = Depends(get_db)
):
    book_service = BookService(db)
    books = book_service.get_similar_books(book_id, limit)
    return {
        "book_id": book_id,
        "count": len(books),
        "books": [_book_to_dict(b, explanation="Readers who enjoyed this also liked") for b in books]
    }


@router.get("/also-enjoyed/{book_id}")
def get_also_enjoyed(
    book_id: int,
    limit: int = 8,
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    books = recommendation_service.get_readers_also_enjoyed(book_id, limit)
    return {
        "book_id": book_id,
        "count": len(books),
        "books": [_book_to_dict(b, explanation="Readers who enjoyed this also liked") for b in books]
    }


@router.get("/same-genre/{book_id}")
def get_same_genre(
    book_id: int,
    limit: int = 6,
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    books = recommendation_service.get_same_genre_books(book_id, limit)
    return {
        "book_id": book_id,
        "count": len(books),
        "books": [_book_to_dict(b, explanation="Matches your selected genres") for b in books]
    }


@router.get("/similar-author/{author_id}")
def get_similar_author(
    author_id: int,
    limit: int = 8,
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    books = recommendation_service.get_similar_authors(author_id, limit)
    return {
        "author_id": author_id,
        "count": len(books),
        "books": [_book_to_dict(b, explanation=f"Based on your interest in {b.author.name}" if b.author else "Based on your interest in this author") for b in books]
    }


@router.get("/trending")
def get_trending_books(
    limit: int = 8,
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    books = recommendation_service.get_trending(limit)
    return {
        "count": len(books),
        "books": [_book_to_dict(b, explanation="Trending choice among readers this week") for b in books]
    }


@router.get("/new-releases")
def get_new_releases(
    limit: int = 8,
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    books = recommendation_service.get_new_releases(limit)
    return {
        "count": len(books),
        "books": [_book_to_dict(b, explanation="New release choice for you") for b in books]
    }


@router.get("/top-rated")
def get_top_rated(
    limit: int = 8,
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    books = recommendation_service.get_top_rated(limit)
    return {
        "count": len(books),
        "books": [_book_to_dict(b, explanation=f"Highly rated ({b.rating:.1f}/5) by readers") for b in books]
    }


@router.get("/hidden-gems")
def get_hidden_gems(
    limit: int = 8,
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    books = recommendation_service.get_hidden_gems(limit)
    return {
        "count": len(books),
        "books": [_book_to_dict(b, explanation="Hidden gem loved by readers") for b in books]
    }


@router.get("/by-genre/{genre}")
def get_by_genre(
    genre: str,
    limit: int = 8,
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    books = recommendation_service.get_by_genre(genre, limit)
    return {
        "genre": genre,
        "count": len(books),
        "books": [_book_to_dict(b, explanation=f"Popular in {genre}") for b in books]
    }


@router.get("/by-author/{author_id}")
def get_by_author(
    author_id: int,
    limit: int = 8,
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    books = recommendation_service.get_by_author(author_id, limit)
    return {
        "author_id": author_id,
        "count": len(books),
        "books": [_book_to_dict(b, explanation=f"Popular book by {b.author.name}" if b.author else "Popular book by this author") for b in books]
    }


@router.get("/metrics")
def get_recommendation_metrics(
    user_id: Optional[int] = None,
    k: int = 10,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    return recommendation_service.calculate_metrics(user_id, k)


@router.get("/search-suggestions")
def search_suggestions(
    q: str = Query(..., min_length=1),
    limit: int = 8,
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    return {"suggestions": recommendation_service.get_search_suggestions(q, limit)}


@router.get("/popular-searches")
def popular_searches(
    limit: int = 8,
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    return {"searches": recommendation_service.get_popular_searches(limit)}


@router.get("/analytics")
def get_analytics(
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    recommendation_service = RecommendationService(db)
    return recommendation_service.get_dataset_stats()
