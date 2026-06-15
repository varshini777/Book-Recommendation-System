from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.db import get_db
from app.db.models import User, Book, LibraryEntry, Rating, Review, VisitorLog, PageView, ActivityLog
from app.core.security import get_current_admin_id
from pydantic import BaseModel
from sqlalchemy import func, and_

router = APIRouter()

class AdminStats(BaseModel):
    total_users: int
    active_users: int
    total_books: int
    total_ratings: int
    total_reviews: int
    total_library_entries: int
    page_views_today: int
    unique_visitors_today: int

class UserManagement(BaseModel):
    user_id: int
    action: str  # 'activate', 'deactivate', 'delete'

@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Get overall platform statistics"""
    # User stats
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Book stats
    total_books = db.query(Book).filter(Book.is_active == True).count()
    
    # Engagement stats
    total_ratings = db.query(Rating).count()
    total_reviews = db.query(Review).count()
    total_library_entries = db.query(LibraryEntry).count()
    
    # Visitor stats (today)
    today = datetime.utcnow().date()
    page_views_today = db.query(VisitorLog).filter(
        func.date(VisitorLog.created_at) == today
    ).count()
    
    unique_visitors_today = db.query(VisitorLog).filter(
        func.date(VisitorLog.created_at) == today
    ).distinct(VisitorLog.session_id).count()
    
    return AdminStats(
        total_users=total_users,
        active_users=active_users,
        total_books=total_books,
        total_ratings=total_ratings,
        total_reviews=total_reviews,
        total_library_entries=total_library_entries,
        page_views_today=page_views_today,
        unique_visitors_today=unique_visitors_today
    )

@router.get("/users")
def get_all_users_admin(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Get all users with filtering (admin only)"""
    query = db.query(User)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            User.name.ilike(search_term) | User.email.ilike(search_term)
        )
    
    users = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar,
            "role": user.role,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "last_login": user.last_login
        }
        for user in users
    ]

@router.get("/users/{user_id}/stats")
def get_user_detailed_stats(
    user_id: int,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Get detailed statistics for a specific user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Library stats
    library_entries = db.query(LibraryEntry).filter(LibraryEntry.user_id == user_id).all()
    total_books = len(library_entries)
    avg_progress = sum(entry.progress for entry in library_entries) / total_books if total_books > 0 else 0
    
    # Shelf distribution
    shelf_counts = {}
    for entry in library_entries:
        shelf_counts[entry.shelf] = shelf_counts.get(entry.shelf, 0) + 1
    
    # Rating stats
    ratings = db.query(Rating).filter(Rating.user_id == user_id).all()
    avg_rating = sum(r.rating for r in ratings) / len(ratings) if ratings else 0
    
    # Review stats
    reviews = db.query(Review).filter(Review.user_id == user_id).count()
    
    # Activity stats (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_activity = db.query(ActivityLog).filter(
        ActivityLog.user_id == user_id,
        ActivityLog.created_at >= thirty_days_ago
    ).count()
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "last_login": user.last_login
        },
        "library_stats": {
            "total_books": total_books,
            "avg_progress": avg_progress,
            "shelf_counts": shelf_counts
        },
        "engagement_stats": {
            "total_ratings": len(ratings),
            "avg_rating": avg_rating,
            "total_reviews": reviews,
            "recent_activity": recent_activity
        }
    }

@router.put("/users/{user_id}/activate")
def activate_user_admin(
    user_id: int,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Activate a user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"User {user_id} activated successfully"}

@router.put("/users/{user_id}/deactivate")
def deactivate_user_admin(
    user_id: int,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Deactivate a user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"User {user_id} deactivated successfully"}

@router.delete("/users/{user_id}")
def delete_user_admin(
    user_id: int,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Delete a user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": f"User {user_id} deleted successfully"}

@router.get("/analytics/visitor")
def get_visitor_analytics(
    days: int = 7,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Get visitor analytics for the last N days"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily visitor counts
    daily_stats = db.query(
        func.date(VisitorLog.created_at).label('date'),
        func.count(VisitorLog.id).label('page_views'),
        func.count(func.distinct(VisitorLog.session_id)).label('unique_visitors')
    ).filter(
        VisitorLog.created_at >= start_date
    ).group_by(func.date(VisitorLog.created_at)).all()
    
    return [
        {
            "date": str(stat.date),
            "page_views": stat.page_views,
            "unique_visitors": stat.unique_visitors
        }
        for stat in daily_stats
    ]

@router.get("/analytics/popular-pages")
def get_popular_pages(
    limit: int = 10,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Get most popular pages"""
    pages = db.query(PageView).order_by(PageView.view_count.desc()).limit(limit).all()
    
    return [
        {
            "path": page.path,
            "view_count": page.view_count,
            "unique_visitors": page.unique_visitors,
            "last_viewed": page.last_viewed
        }
        for page in pages
    ]

@router.get("/analytics/top-books")
def get_top_books(
    limit: int = 10,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Get top books by library entries and ratings"""
    # Books with most library entries
    top_by_library = db.query(
        Book.id,
        Book.title,
        Book.author_id,
        func.count(LibraryEntry.id).label('library_count')
    ).join(LibraryEntry).group_by(Book.id).order_by(
        func.count(LibraryEntry.id).desc()
    ).limit(limit).all()
    
    # Books with highest average rating
    top_by_rating = db.query(
        Book.id,
        Book.title,
        Book.author_id,
        func.avg(Rating.rating).label('avg_rating'),
        func.count(Rating.id).label('rating_count')
    ).join(Rating).group_by(Book.id).having(
        func.count(Rating.id) >= 5
    ).order_by(func.avg(Rating.rating).desc()).limit(limit).all()
    
    return {
        "top_by_library": [
            {
                "book_id": book.id,
                "title": book.title,
                "library_count": book.library_count
            }
            for book in top_by_library
        ],
        "top_by_rating": [
            {
                "book_id": book.id,
                "title": book.title,
                "avg_rating": float(book.avg_rating),
                "rating_count": book.rating_count
            }
            for book in top_by_rating
        ]
    }

@router.get("/reviews/pending")
def get_pending_reviews(
    skip: int = 0,
    limit: int = 50,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Get pending reviews for moderation (admin only)"""
    reviews = db.query(Review).filter(
        Review.is_approved == False
    ).offset(skip).limit(limit).all()
    
    return [
        {
            "id": review.id,
            "user_id": review.user_id,
            "book_id": review.book_id,
            "content": review.content,
            "is_spoiler": review.is_spoiler,
            "created_at": review.created_at
        }
        for review in reviews
    ]

@router.put("/reviews/{review_id}/approve")
def approve_review(
    review_id: int,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Approve a review (admin only)"""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    review.is_approved = True
    review.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Review approved successfully"}

@router.delete("/reviews/{review_id}")
def delete_review(
    review_id: int,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Delete a review (admin only)"""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    db.delete(review)
    db.commit()
    
    return {"message": "Review deleted successfully"}
