from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, ForgotPasswordRequest
from app.services.auth_service import AuthService
from app.core.security import get_current_user_id

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        auth_service = AuthService(db)
        user = auth_service.register_user(user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return tokens"""
    try:
        auth_service = AuthService(db)
        user, access_token, refresh_token = auth_service.authenticate_user(login_data)
        return Token(
            access_token=access_token,
            refresh_token=refresh_token
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """Refresh access token"""
    try:
        auth_service = AuthService(db)
        new_access_token, new_refresh_token = auth_service.refresh_tokens(refresh_token)
        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

@router.post("/logout")
def logout(access_token: str, db: Session = Depends(get_db)):
    """Logout user"""
    auth_service = AuthService(db)
    success = auth_service.logout_user(access_token)
    if success:
        return {"message": "Logged out successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session not found"
        )

@router.get("/me", response_model=UserResponse)
def get_current_user(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Get current user information"""
    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send password reset email (placeholder)"""
    # TODO: Implement email sending
    return {"message": "Password reset email sent (not implemented yet)"}

@router.post("/reset-password")
def reset_password(token: str, new_password: str, db: Session = Depends(get_db)):
    """Reset password with token (placeholder)"""
    # TODO: Implement password reset
    return {"message": "Password reset successful (not implemented yet)"}
