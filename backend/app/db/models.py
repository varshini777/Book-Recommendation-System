from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Table, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

# Many-to-many relationship tables
book_genres = Table(
    'book_genres',
    Base.metadata,
    Column('book_id', Integer, ForeignKey('books.id', ondelete='CASCADE'), primary_key=True),
    Column('genre_id', Integer, ForeignKey('genres.id', ondelete='CASCADE'), primary_key=True)
)

user_followers = Table(
    'user_followers',
    Base.metadata,
    Column('follower_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('following_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
)

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    avatar = Column(String(255), default='👤')
    role = Column(String(50), default='user')  # 'user' or 'admin'
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    library_entries = relationship("LibraryEntry", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
    followers = relationship("User", secondary=user_followers, primaryjoin=id==user_followers.c.following_id, secondaryjoin=id==user_followers.c.follower_id, backref="following")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

class Genre(Base):
    __tablename__ = 'genres'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    
    # Relationships
    books = relationship("Book", secondary=book_genres, back_populates="genres")

class Author(Base):
    __tablename__ = 'authors'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    bio = Column(Text)
    birth_year = Column(Integer)
    death_year = Column(Integer)
    nationality = Column(String(100))
    image_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    books = relationship("Book", back_populates="author")

class Book(Base):
    __tablename__ = 'books'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey('authors.id'), nullable=False)
    cover_url = Column(String(500))
    language = Column(String(50), default='English', index=True)
    year = Column(Integer, index=True)
    pages = Column(Integer)
    isbn = Column(String(20), unique=True, index=True)
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    description = Column(Text)
    tags = Column(JSON)  # Array of tags
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    author = relationship("Author", back_populates="books")
    genres = relationship("Genre", secondary=book_genres, back_populates="books")
    library_entries = relationship("LibraryEntry", back_populates="book", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="book", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="book", cascade="all, delete-orphan")
    recommendation_logs = relationship("RecommendationLog", back_populates="book", cascade="all, delete-orphan")

class LibraryEntry(Base):
    __tablename__ = 'library_entries'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    book_id = Column(Integer, ForeignKey('books.id', ondelete='CASCADE'), nullable=False)
    status = Column(String(50), default='want_to_read')  # want_to_read, currently_reading, completed
    is_favorite = Column(Boolean, default=False)
    is_bookmarked = Column(Boolean, default=False)
    progress = Column(Integer, default=0)  # 0-100
    rating = Column(Integer, default=0)  # 1-5
    notes = Column(Text)
    added_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="library_entries")
    book = relationship("Book", back_populates="library_entries")
    
    # Unique constraint
    __table_args__ = (
        {'extend_existing': True}
    )

class CartEntry(Base):
    __tablename__ = 'cart_entries'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    book_id = Column(Integer, ForeignKey('books.id', ondelete='CASCADE'), nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", backref="cart_entries")
    book = relationship("Book", backref="cart_entries")

class Review(Base):
    __tablename__ = 'reviews'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    book_id = Column(Integer, ForeignKey('books.id', ondelete='CASCADE'), nullable=False)
    content = Column(Text, nullable=False)
    is_spoiler = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="reviews")
    book = relationship("Book", back_populates="reviews")

class Rating(Base):
    __tablename__ = 'ratings'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    book_id = Column(Integer, ForeignKey('books.id', ondelete='CASCADE'), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="ratings")
    book = relationship("Book", back_populates="ratings")
    
    # Unique constraint
    __table_args__ = (
        {'extend_existing': True}
    )

class UserPreference(Base):
    __tablename__ = 'user_preferences'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    preferred_genres = Column(JSON)  # Array of genre names
    preferred_languages = Column(JSON)  # Array of language names
    preferred_authors = Column(JSON)  # Array of author names
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="preferences")

class Notification(Base):
    __tablename__ = 'notifications'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = Column(String(50))  # 'follow', 'review', 'recommendation', 'system'
    title = Column(String(255))
    message = Column(Text)
    link = Column(String(500))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notifications")

class ActivityLog(Base):
    __tablename__ = 'activity_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    action = Column(String(100))  # 'add_to_library', 'rate_book', 'write_review', 'follow_user'
    entity_type = Column(String(50))  # 'book', 'user', 'review'
    entity_id = Column(Integer)
    metadata_json = Column("metadata", JSON)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="activities")

class RecommendationLog(Base):
    __tablename__ = 'recommendation_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    book_id = Column(Integer, ForeignKey('books.id', ondelete='CASCADE'), nullable=False)
    algorithm = Column(String(50))  # 'content_based', 'collaborative', 'hybrid'
    score = Column(Float)
    reason = Column(Text)  # Explainable recommendation reason
    clicked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    book = relationship("Book", back_populates="recommendation_logs")

class Session(Base):
    __tablename__ = 'sessions'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token = Column(String(500), unique=True, nullable=False)
    refresh_token = Column(String(500), unique=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    
    # Relationships
    user = relationship("User", back_populates="sessions")

class VisitorLog(Base):
    __tablename__ = 'visitor_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), index=True)
    ip_address = Column(String(50))
    page = Column(String(255))
    referrer = Column(String(500))
    user_agent = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

class PageView(Base):
    __tablename__ = 'page_views'
    
    id = Column(Integer, primary_key=True, index=True)
    path = Column(String(255), index=True)
    view_count = Column(Integer, default=0)
    unique_visitors = Column(Integer, default=0)
    last_viewed = Column(DateTime, default=datetime.utcnow)

class SearchLog(Base):
    __tablename__ = 'search_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    query = Column(String(500), index=True)
    filters = Column(JSON)
    results_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

class AdminLog(Base):
    __tablename__ = 'admin_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    action = Column(String(100))
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    details = Column(JSON)
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
