from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import get_db
from app.services.user_service import UserService
from app.core.security import get_current_user_id, get_current_admin_id
from pydantic import BaseModel

router = APIRouter()

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None

class UserPreferencesUpdate(BaseModel):
    preferred_genres: Optional[List[str]] = None
    preferred_languages: Optional[List[str]] = None
    preferred_authors: Optional[List[str]] = None
    onboarding_completed: Optional[bool] = None

class OnboardingSubmit(BaseModel):
    genres: List[str]
    authors: List[str]
    interests: List[str]
    reading_goal: int
    selected_books: List[int]

class ReadingGoalUpdate(BaseModel):
    target_books: int


@router.get("/me")
def get_current_user_profile(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    user_service = UserService(db)
    user = user_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_service.check_and_update_onboarding(user_id)
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar": user.avatar,
        "role": user.role,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "onboarded": user.onboarded,
        "created_at": user.created_at
    }

@router.put("/me")
def update_current_user_profile(
    profile_data: UserProfileUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    user_service = UserService(db)
    
    try:
        user = user_service.update_user_profile(
            user_id=user_id,
            name=profile_data.name,
            avatar=profile_data.avatar
        )
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar,
            "role": user.role,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/me/preferences")
def get_current_user_preferences(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get current user's preferences"""
    user_service = UserService(db)
    from app.db.models import UserPreference
    
    preferences = db.query(UserPreference).filter(
        UserPreference.user_id == user_id
    ).first()
    
    if not preferences:
        # Return default preferences
        return {
            "preferred_genres": [],
            "preferred_languages": ["English"],
            "preferred_authors": [],
            "onboarding_completed": False
        }
    
    return {
        "preferred_genres": preferences.preferred_genres or [],
        "preferred_languages": preferences.preferred_languages or [],
        "preferred_authors": preferences.preferred_authors or [],
        "onboarding_completed": preferences.onboarding_completed
    }

@router.put("/me/preferences")
def update_current_user_preferences(
    preferences_data: UserPreferencesUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update current user's preferences"""
    user_service = UserService(db)
    
    try:
        preferences = user_service.update_user_preferences(
            user_id=user_id,
            preferred_genres=preferences_data.preferred_genres,
            preferred_languages=preferences_data.preferred_languages,
            preferred_authors=preferences_data.preferred_authors,
            onboarding_completed=preferences_data.onboarding_completed
        )
        
        return {
            "preferred_genres": preferences.preferred_genres or [],
            "preferred_languages": preferences.preferred_languages or [],
            "preferred_authors": preferences.preferred_authors or [],
            "onboarding_completed": preferences.onboarding_completed
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/me/onboarding")
def submit_onboarding(
    onboarding_data: OnboardingSubmit,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Submit user onboarding data and generate personalized recommendation profile"""
    user_service = UserService(db)
    user = user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    try:
        # 1. Update user.onboarded to True
        user.onboarded = True
        
        # 2. Update user preferences
        user_service.update_user_preferences(
            user_id=user_id,
            preferred_genres=onboarding_data.genres,
            preferred_authors=onboarding_data.authors,
            preferred_languages=["English"],
            onboarding_completed=True
        )
        
        from app.db.models import UserGenre, UserAuthor, UserInterest, ReadingGoal, OnboardingLikedBook, Genre, Author, Book
        from datetime import datetime
        
        # 3. Clear existing UserGenre and write new ones
        db.query(UserGenre).filter(UserGenre.user_id == user_id).delete()
        for g_name in onboarding_data.genres:
            genre_obj = db.query(Genre).filter(Genre.name.ilike(g_name)).first()
            if genre_obj:
                db.add(UserGenre(user_id=user_id, genre_id=genre_obj.id))
                
        # 4. Clear existing UserAuthor and write new ones
        db.query(UserAuthor).filter(UserAuthor.user_id == user_id).delete()
        for a_name in onboarding_data.authors:
            author_obj = db.query(Author).filter(Author.name.ilike(a_name)).first()
            if not author_obj:
                author_obj = Author(name=a_name)
                db.add(author_obj)
                db.flush()
            db.add(UserAuthor(user_id=user_id, author_id=author_obj.id))
            
        # 5. Clear existing UserInterest and write new ones
        db.query(UserInterest).filter(UserInterest.user_id == user_id).delete()
        for interest_str in onboarding_data.interests:
            db.add(UserInterest(user_id=user_id, interest=interest_str))
            
        # 6. Save Reading Goal for current year
        current_year = datetime.utcnow().year
        goal_obj = db.query(ReadingGoal).filter(
            ReadingGoal.user_id == user_id,
            ReadingGoal.target_year == current_year
        ).first()
        if goal_obj:
            goal_obj.target_books = onboarding_data.reading_goal
        else:
            db.add(ReadingGoal(
                user_id=user_id,
                target_books=onboarding_data.reading_goal,
                target_year=current_year
            ))
            
        # 7. Save Selected Books to onboarding_liked_books table
        db.query(OnboardingLikedBook).filter(OnboardingLikedBook.user_id == user_id).delete()
        for book_id in onboarding_data.selected_books:
            book_exists = db.query(Book).filter(Book.id == book_id).first()
            if book_exists:
                db.add(OnboardingLikedBook(user_id=user_id, book_id=book_id))
                
        db.commit()
        return {"status": "success", "message": "Onboarding completed successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/me/reading-goal")
def get_reading_goal(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    from app.db.models import ReadingGoal, LibraryEntry
    from datetime import datetime
    current_year = datetime.utcnow().year
    
    current_books_count = db.query(LibraryEntry).filter(
        LibraryEntry.user_id == user_id,
        LibraryEntry.status == 'completed'
    ).count()
    
    goal = db.query(ReadingGoal).filter(
        ReadingGoal.user_id == user_id,
        ReadingGoal.target_year == current_year
    ).first()
    
    if not goal:
        return {"target_books": 10, "current_books": current_books_count, "target_year": current_year}
    
    if goal.current_books != current_books_count:
        goal.current_books = current_books_count
        db.commit()
        
    return {
        "target_books": goal.target_books,
        "current_books": current_books_count,
        "target_year": goal.target_year
    }

@router.put("/me/reading-goal")
def update_reading_goal(
    goal_data: ReadingGoalUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    from app.db.models import ReadingGoal, LibraryEntry
    from datetime import datetime
    current_year = datetime.utcnow().year
    
    current_books_count = db.query(LibraryEntry).filter(
        LibraryEntry.user_id == user_id,
        LibraryEntry.status == 'completed'
    ).count()
    
    goal = db.query(ReadingGoal).filter(
        ReadingGoal.user_id == user_id,
        ReadingGoal.target_year == current_year
    ).first()
    
    if goal:
        goal.target_books = goal_data.target_books
        goal.current_books = current_books_count
        goal.updated_at = datetime.utcnow()
    else:
        goal = ReadingGoal(
            user_id=user_id,
            target_books=goal_data.target_books,
            target_year=current_year,
            current_books=current_books_count
        )
        db.add(goal)
    
    db.commit()
    return {
        "target_books": goal.target_books,
        "current_books": goal.current_books,
        "target_year": goal.target_year
    }

@router.get("/me/stats")
def get_current_user_stats(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get current user's statistics"""
    user_service = UserService(db)
    stats = user_service.get_user_stats(user_id)
    return stats

@router.get("/")
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    user_service = UserService(db)
    users = user_service.get_all_users(skip, limit)
    
    return [
        {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar,
            "role": user.role,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at
        }
        for user in users
    ]

@router.put("/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Deactivate a user (admin only)"""
    user_service = UserService(db)
    
    try:
        user = user_service.deactivate_user(user_id)
        return {"message": f"User {user_id} deactivated successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.put("/{user_id}/activate")
def activate_user(
    user_id: int,
    admin_id: int = Depends(get_current_admin_id),
    db: Session = Depends(get_db)
):
    """Activate a user (admin only)"""
    user_service = UserService(db)
    
    try:
        user = user_service.activate_user(user_id)
        return {"message": f"User {user_id} activated successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
