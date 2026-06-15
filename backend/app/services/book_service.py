from sqlalchemy.orm import Session
from app.db.models import Book, Author, Genre, Rating
from typing import List, Optional
from datetime import datetime

class BookService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_book_by_id(self, book_id: int) -> Optional[Book]:
        """Get a book by ID"""
        return self.db.query(Book).filter(Book.id == book_id).first()
    
    def get_all_books(
        self,
        query: Optional[str] = None,
        genre: Optional[str] = None,
        language: Optional[str] = None,
        year: Optional[int] = None,
        min_rating: Optional[float] = None,
        page: int = 1,
        page_size: int = 20
    ) -> List[Book]:
        """Get books with filtering and pagination"""
        books_query = self.db.query(Book).filter(Book.is_active == True)
        
        if query:
            search_term = f"%{query}%"
            books_query = books_query.filter(
                Book.title.ilike(search_term) |
                Book.description.ilike(search_term)
            )
        
        if genre:
            books_query = books_query.join(Book.genres).filter(Genre.name == genre)
        
        if language:
            books_query = books_query.filter(Book.language == language)
        
        if year:
            books_query = books_query.filter(Book.year == year)
        
        if min_rating:
            books_query = books_query.filter(Book.rating >= min_rating)
        
        # Pagination
        offset = (page - 1) * page_size
        books = books_query.offset(offset).limit(page_size).all()
        
        return books
    
    def get_similar_books(self, book_id: int, limit: int = 6) -> List[Book]:
        """Get similar books using pre-trained TF-IDF cosine similarity"""
        book = self.get_book_by_id(book_id)
        if not book:
            return []
            
        import os
        import pickle
        import numpy as np
        from sklearn.metrics.pairwise import cosine_similarity
        
        model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'recommender.pkl')
        if not os.path.exists(model_path):
            # Fallback to genre/author matching
            genre_ids = [g.id for g in book.genres]
            similar = self.db.query(Book).join(Book.genres).filter(
                Genre.id.in_(genre_ids),
                Book.id != book_id,
                Book.is_active == True
            ).distinct().limit(limit * 2).all()
            
            author_books = self.db.query(Book).filter(
                Book.author_id == book.author_id,
                Book.id != book_id,
                Book.is_active == True
            ).limit(limit).all()
            
            all_similar = list({b.id: b for b in similar + author_books}.values())
            all_similar.sort(key=lambda x: x.rating, reverse=True)
            return all_similar[:limit]
            
        try:
            with open(model_path, 'rb') as f:
                recommender = pickle.load(f)
                
            book_ids = recommender['book_ids']
            tfidf_matrix = recommender['tfidf_matrix']
            
            if book_id not in book_ids:
                return []
                
            idx = book_ids.index(book_id)
            book_vector = tfidf_matrix[idx]
            
            cosine_sim = cosine_similarity(book_vector, tfidf_matrix).flatten()
            
            # Get top indices (excluding itself)
            similar_indices = cosine_sim.argsort()[-(limit + 1):][::-1]
            
            recommended_book_ids = []
            for i in similar_indices:
                b_id = book_ids[i]
                if b_id != book_id:
                    recommended_book_ids.append(b_id)
                    if len(recommended_book_ids) >= limit:
                        break
                        
            books = self.db.query(Book).filter(Book.id.in_(recommended_book_ids)).all()
            book_dict = {b.id: b for b in books}
            return [book_dict[b_id] for b_id in recommended_book_ids if b_id in book_dict]
            
        except Exception as e:
            print(f"Error getting similar books: {e}")
            return []
    
    def get_trending_books(self, limit: int = 8) -> List[Book]:
        """Get trending books (highest rated)"""
        books = self.db.query(Book).filter(
            Book.is_active == True
        ).order_by(Book.rating.desc()).limit(limit).all()
        return books
    
    def update_book_rating(self, book_id: int, rating: int) -> None:
        """Update book's average rating"""
        ratings = self.db.query(Rating).filter(Rating.book_id == book_id).all()
        if ratings:
            avg_rating = sum(r.rating for r in ratings) / len(ratings)
            book = self.get_book_by_id(book_id)
            if book:
                book.rating = avg_rating
                book.rating_count = len(ratings)
                self.db.commit()
