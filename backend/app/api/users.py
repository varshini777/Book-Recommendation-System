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
