from sqlalchemy.orm import Session
from app.db.models import User, UserPreference, LibraryEntry, Rating, Review
from app.schemas.auth import UserCreate
from app.core.security import get_password_hash
from typing import Optional, List, Dict
from datetime import datetime

class UserService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def update_user_profile(
        self,
        user_id: int,
        name: Optional[str] = None,
        avatar: Optional[str] = None
    ) -> User:
        """Update user profile"""
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        if name is not None:
            user.name = name
        if avatar is not None:
            user.avatar = avatar
        
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def update_user_preferences(
        self,
        user_id: int,
        preferred_genres: Optional[List[str]] = None,
        preferred_authors: Optional[List[str]] = None,
        onboarding_completed: Optional[bool] = None
    ) -> UserPreference:
        """Update user preferences"""
        preferences = self.db.query(UserPreference).filter(
            UserPreference.user_id == user_id
        ).first()
        
        if not preferences:
            preferences = UserPreference(user_id=user_id)
            self.db.add(preferences)
        
        if preferred_genres is not None:
            preferences.preferred_genres = preferred_genres
            # Sync to UserGenre table
            from app.db.models import UserGenre, Genre
            self.db.query(UserGenre).filter(UserGenre.user_id == user_id).delete()
            for g_name in preferred_genres:
                genre_obj = self.db.query(Genre).filter(Genre.name.ilike(g_name)).first()
                if genre_obj:
                    self.db.add(UserGenre(user_id=user_id, genre_id=genre_obj.id))


        if preferred_authors is not None:
            preferences.preferred_authors = preferred_authors
            # Sync to UserAuthor table
            from app.db.models import UserAuthor, Author
            self.db.query(UserAuthor).filter(UserAuthor.user_id == user_id).delete()
            for a_name in preferred_authors:
                author_obj = self.db.query(Author).filter(Author.name.ilike(a_name)).first()
                if not author_obj:
                    author_obj = Author(name=a_name)
                    self.db.add(author_obj)
                    self.db.flush()
                self.db.add(UserAuthor(user_id=user_id, author_id=author_obj.id))

        if onboarding_completed is not None:
            preferences.onboarding_completed = onboarding_completed
        
        preferences.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(preferences)
        
        return preferences
    
    def get_user_stats(self, user_id: int) -> Dict:
        """Get user statistics"""
        library_entries = self.db.query(LibraryEntry).filter(
            LibraryEntry.user_id == user_id
        ).all()
        
        total_books = len(library_entries)
        avg_progress = sum(entry.progress for entry in library_entries) / total_books if total_books > 0 else 0
        
        # Count by status
        shelf_counts = {}
        for entry in library_entries:
            shelf_counts[entry.status] = shelf_counts.get(entry.status, 0) + 1
        
        # Count by genre
        genre_counts = {}
        for entry in library_entries:
            if entry.book:
                for genre in entry.book.genres:
                    genre_counts[genre.name] = genre_counts.get(genre.name, 0) + 1
        
        # Count by language
        language_counts = {}
        for entry in library_entries:
            if entry.book:
                lang = entry.book.language
                language_counts[lang] = language_counts.get(lang, 0) + 1
        
        return {
            "total_books": total_books,
            "avg_progress": avg_progress,
            "shelf_counts": shelf_counts,
            "genre_counts": genre_counts,
            "language_counts": language_counts
        }
    
    def get_all_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users (admin only)"""
        return self.db.query(User).offset(skip).limit(limit).all()
    
    def deactivate_user(self, user_id: int) -> User:
        """Deactivate a user (admin only)"""
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        user.is_active = False
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def activate_user(self, user_id: int) -> User:
        """Activate a user (admin only)"""
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        user.is_active = True
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def get_user_library(self, user_id: int, status_filter: Optional[str] = None) -> List[LibraryEntry]:
        """Get user's library entries"""
        query = self.db.query(LibraryEntry).filter(LibraryEntry.user_id == user_id)
        
        if status_filter:
            query = query.filter(LibraryEntry.status == status_filter)
        
        return query.order_by(LibraryEntry.updated_at.desc()).all()
    
    def get_user_reviews(self, user_id: int) -> List[Review]:
        """Get user's reviews"""
        return self.db.query(Review).filter(
            Review.user_id == user_id
        ).order_by(Review.created_at.desc()).all()

    def check_and_update_onboarding(self, user_id: int) -> bool:
        """Check if user needs onboarding or can be auto-onboarded because of history"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
            
        if user.onboarded:
            return True
            
        # Check library
        from app.db.models import LibraryEntry, RecommendationLog
        has_library = self.db.query(LibraryEntry).filter(LibraryEntry.user_id == user_id).first() is not None
        if has_library:
            user.onboarded = True
            self.db.commit()
            return True
            
        # Check recommendation history
        has_history = self.db.query(RecommendationLog).filter(RecommendationLog.user_id == user_id).first() is not None
        if has_history:
            user.onboarded = True
            self.db.commit()
            return True
            
        return False
