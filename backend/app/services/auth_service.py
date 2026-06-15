from sqlalchemy.orm import Session
from app.db.models import User, Session as SessionModel
from app.schemas.auth import UserCreate, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from datetime import datetime, timedelta
import secrets

class AuthService:
    def __init__(self, db: Session):
        self.db = db
    
    def register_user(self, user_data: UserCreate) -> User:
        """Register a new user"""
        # Check if email already exists
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise ValueError("Email already registered")
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        
        # Check if this is the first user; if so, make them admin
        user_count = self.db.query(User).count()
        assigned_role = "admin" if user_count == 0 else "user"
        
        new_user = User(
            email=user_data.email,
            password_hash=hashed_password,
            name=user_data.name,
            role=assigned_role
        )
        
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        
        return new_user
    
    def authenticate_user(self, login_data: UserLogin) -> tuple[User, str, str]:
        """Authenticate user and return tokens"""
        user = self.db.query(User).filter(User.email == login_data.email).first()
        
        if not user or not verify_password(login_data.password, user.password_hash):
            raise ValueError("Invalid credentials")
        
        if not user.is_active:
            raise ValueError("Account is deactivated")
        
        # Update last login
        user.last_login = datetime.utcnow()
        self.db.commit()
        
        # Create tokens
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role}
        )
        refresh_token = create_refresh_token(
            data={"sub": str(user.id)}
        )
        
        # Store session
        session = SessionModel(
            user_id=user.id,
            token=access_token,
            refresh_token=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        self.db.add(session)
        self.db.commit()
        
        return user, access_token, refresh_token
    
    def refresh_tokens(self, refresh_token: str) -> tuple[str, str]:
        """Refresh access token using refresh token"""
        from app.core.security import decode_token
        
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise ValueError("Invalid token type")
            
            user_id = int(payload.get("sub"))
            user = self.db.query(User).filter(User.id == user_id).first()
            
            if not user or not user.is_active:
                raise ValueError("Invalid user")
            
            # Create new tokens
            new_access_token = create_access_token(
                data={"sub": str(user.id), "email": user.email, "role": user.role}
            )
            new_refresh_token = create_refresh_token(
                data={"sub": str(user.id)}
            )
            
            # Update session
            session = self.db.query(SessionModel).filter(
                SessionModel.refresh_token == refresh_token
            ).first()
            
            if session:
                session.token = new_access_token
                session.refresh_token = new_refresh_token
                session.expires_at = datetime.utcnow() + timedelta(days=7)
                self.db.commit()
            
            return new_access_token, new_refresh_token
            
        except Exception as e:
            raise ValueError("Invalid refresh token")
    
    def logout_user(self, access_token: str) -> bool:
        """Logout user by deleting session"""
        session = self.db.query(SessionModel).filter(
            SessionModel.token == access_token
        ).first()
        
        if session:
            self.db.delete(session)
            self.db.commit()
            return True
        
        return False
    
    def get_user_by_id(self, user_id: int) -> User:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, email: str) -> User:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
