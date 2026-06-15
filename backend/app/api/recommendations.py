from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import get_db
from app.services.recommendation_service import RecommendationService
from app.core.security import get_current_user_id

router = APIRouter()

@router.get("/")
def get_recommendations(
    algorithm: str = "hybrid",
    limit: int = 12,
    exclude_book_ids: Optional[str] = None,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get personalized recommendations for the user"""
    recommendation_service = RecommendationService(db)
    
    # Parse exclude_book_ids if provided
    exclude_ids = []
    if exclude_book_ids:
        try:
            exclude_ids = [int(x) for x in exclude_book_ids.split(",")]
        except:
            pass
    
    try:
        if algorithm == "content":
            books = recommendation_service.get_content_based_recommendations(
                user_id, limit, exclude_ids
            )
        elif algorithm == "collaborative":
            books = recommendation_service.get_collaborative_recommendations(
                user_id, limit, exclude_ids
            )
        else:  # hybrid (default)
            books = recommendation_service.get_hybrid_recommendations(
                user_id, limit, exclude_ids
            )
        
        # Log the recommendation
        for book in books:
            recommendation_service.log_recommendation(
                user_id=user_id,
                book_id=book.id,
                algorithm=algorithm,
                score=book.rating,
                reason=f"Based on {algorithm} filtering"
            )
        
        return {
            "algorithm": algorithm,
            "count": len(books),
            "books": books
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/similar/{book_id}")
def get_similar_books(
    book_id: int,
    limit: int = 6,
    db: Session = Depends(get_db)
):
    """Get books similar to a specific book"""
    from app.services.book_service import BookService
    
    book_service = BookService(db)
    books = book_service.get_similar_books(book_id, limit)
    
    return {
        "book_id": book_id,
        "count": len(books),
        "books": books
    }

@router.get("/trending")
def get_trending_books(
    limit: int = 8,
    db: Session = Depends(get_db)
):
    """Get trending books (highest rated)"""
    from app.services.book_service import BookService
    
    book_service = BookService(db)
    books = book_service.get_trending_books(limit)
    
    return {
        "count": len(books),
        "books": books
    }
