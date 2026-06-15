from sqlalchemy.orm import Session
from app.db.models import Book, LibraryEntry, Rating, UserPreference, Genre
from app.services.book_service import BookService
from typing import List, Optional
import numpy as np

class RecommendationService:
    def __init__(self, db: Session):
        self.db = db
        self.book_service = BookService(db)
    
    def get_content_based_recommendations(
        self,
        user_id: int,
        limit: int = 12,
        exclude_book_ids: Optional[List[int]] = None
    ) -> List[Book]:
        """
        Content-based filtering using pre-trained TF-IDF model and cosine similarity
        """
        if exclude_book_ids is None:
            exclude_book_ids = []
            
        import os
        import pickle
        from sklearn.metrics.pairwise import cosine_similarity
        import numpy as np
        
        # Check if model exists
        model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'recommender.pkl')
        if not os.path.exists(model_path):
            # Fallback to trending books
            return self.book_service.get_trending_books(limit)
            
        try:
            with open(model_path, 'rb') as f:
                recommender = pickle.load(f)
            
            book_ids = recommender['book_ids']
            tfidf_matrix = recommender['tfidf_matrix']
            
            # Get user's preferred genres or previously highly rated books
            preferences = self.db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
            user_ratings = self.db.query(Rating).filter(Rating.user_id == user_id, Rating.rating >= 4).all()
            
            if not user_ratings and (not preferences or not preferences.preferred_genres):
                return self.book_service.get_trending_books(limit)
                
            # Create a user profile vector
            # For simplicity, if they have rated books, we use those book indices.
            # Else we fallback to simple genre matching.
            
            if user_ratings:
                liked_book_ids = [r.book_id for r in user_ratings]
                indices = [i for i, b_id in enumerate(book_ids) if b_id in liked_book_ids]
                
                if not indices:
                    return self.book_service.get_trending_books(limit)
                    
                user_profile = tfidf_matrix[indices].mean(axis=0)
                user_profile = np.asarray(user_profile)
                
                cosine_sim = cosine_similarity(user_profile, tfidf_matrix).flatten()
                
                # Get top indices
                similar_indices = cosine_sim.argsort()[-(limit + len(exclude_book_ids) + len(liked_book_ids)):][::-1]
                
                recommended_book_ids = []
                for idx in similar_indices:
                    b_id = book_ids[idx]
                    if b_id not in exclude_book_ids and b_id not in liked_book_ids:
                        recommended_book_ids.append(b_id)
                        if len(recommended_book_ids) >= limit:
                            break
                            
                books = self.db.query(Book).filter(Book.id.in_(recommended_book_ids)).all()
                book_dict = {b.id: b for b in books}
                return [book_dict[b_id] for b_id in recommended_book_ids if b_id in book_dict]
                
            else:
                # If no ratings but has preferences, find books with those genres
                genre_objects = self.db.query(Genre).filter(Genre.name.in_(preferences.preferred_genres)).all()
                genre_ids = [g.id for g in genre_objects]
                books_query = self.db.query(Book).join(Book.genres).filter(
                    Genre.id.in_(genre_ids),
                    Book.is_active == True,
                    Book.id.notin_(exclude_book_ids)
                ).distinct()
                return books_query.limit(limit).all()
                
        except Exception as e:
            print(f"Error in content-based recommendations: {e}")
            return self.book_service.get_trending_books(limit)
    
    def get_collaborative_recommendations(
        self,
        user_id: int,
        limit: int = 12,
        exclude_book_ids: Optional[List[int]] = None
    ) -> List[Book]:
        """
        Collaborative filtering based on similar users' ratings
        """
        if exclude_book_ids is None:
            exclude_book_ids = []
        
        # Get user's rated books
        user_ratings = self.db.query(Rating).filter(
            Rating.user_id == user_id
        ).all()
        
        if not user_ratings:
            return []
        
        user_book_ids = [r.book_id for r in user_ratings]
        
        # Find users with similar rating patterns (simple approach)
        similar_users = self.db.query(Rating).filter(
            Rating.book_id.in_(user_book_ids),
            Rating.user_id != user_id
        ).all()
        
        # Get books rated by similar users that current user hasn't rated
        similar_user_ids = list(set(r.user_id for r in similar_users))
        
        recommended_ratings = self.db.query(Rating).filter(
            Rating.user_id.in_(similar_user_ids),
            Rating.book_id.notin_(user_book_ids + exclude_book_ids)
        ).all()
        
        # Calculate average rating per book
        book_scores = {}
        book_rating_counts = {}
        
        for rating in recommended_ratings:
            if rating.book_id not in book_scores:
                book_scores[rating.book_id] = 0
                book_rating_counts[rating.book_id] = 0
            book_scores[rating.book_id] += rating.rating
            book_rating_counts[rating.book_id] += 1
        
        # Calculate average and get top books
        avg_scores = {
            book_id: score / count 
            for book_id, score in book_scores.items()
        }
        
        sorted_books = sorted(avg_scores.items(), key=lambda x: x[1], reverse=True)
        top_book_ids = [book_id for book_id, score in sorted_books[:limit]]
        
        # Get book objects
        books = self.db.query(Book).filter(
            Book.id.in_(top_book_ids),
            Book.is_active == True
        ).all()
        
        # Sort by the order in top_book_ids
        book_dict = {b.id: b for b in books}
        return [book_dict[book_id] for book_id in top_book_ids if book_id in book_dict]
    
    def get_hybrid_recommendations(
        self,
        user_id: int,
        limit: int = 12,
        exclude_book_ids: Optional[List[int]] = None
    ) -> List[Book]:
        """
        Hybrid recommendation combining content-based and collaborative filtering
        """
        if exclude_book_ids is None:
            exclude_book_ids = []
        
        # Get recommendations from both methods
        content_based = self.get_content_based_recommendations(
            user_id, limit * 2, exclude_book_ids
        )
        collaborative = self.get_collaborative_recommendations(
            user_id, limit * 2, exclude_book_ids
        )
        
        # Combine and deduplicate
        book_scores = {}
        
        # Content-based gets weight 0.6
        for i, book in enumerate(content_based):
            score = (len(content_based) - i) * 0.6
            if book.id in book_scores:
                book_scores[book.id] += score
            else:
                book_scores[book.id] = score
        
        # Collaborative gets weight 0.4
        for i, book in enumerate(collaborative):
            score = (len(collaborative) - i) * 0.4
            if book.id in book_scores:
                book_scores[book.id] += score
            else:
                book_scores[book.id] = score
        
        # Sort by combined score
        sorted_books = sorted(book_scores.items(), key=lambda x: x[1], reverse=True)
        top_book_ids = [book_id for book_id, score in sorted_books[:limit]]
        
        # Get book objects
        books = self.db.query(Book).filter(
            Book.id.in_(top_book_ids),
            Book.is_active == True
        ).all()
        
        # Sort by the order in top_book_ids
        book_dict = {b.id: b for b in books}
        return [book_dict[book_id] for book_id in top_book_ids if book_id in book_dict]
    
    def log_recommendation(
        self,
        user_id: int,
        book_id: int,
        algorithm: str,
        score: float,
        reason: str
    ) -> None:
        """Log a recommendation for analytics"""
        from app.db.models import RecommendationLog
        
        log = RecommendationLog(
            user_id=user_id,
            book_id=book_id,
            algorithm=algorithm,
            score=score,
            reason=reason
        )
        self.db.add(log)
        self.db.commit()
