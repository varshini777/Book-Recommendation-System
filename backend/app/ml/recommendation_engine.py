"""
ML-based Recommendation Engine for LitRealm
Implements content-based, collaborative filtering, and hybrid recommendation models
"""

import numpy as np
from typing import List, Dict, Tuple
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import faiss
import pickle
from pathlib import Path

class RecommendationEngine:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """
        Initialize the recommendation engine with sentence transformers
        """
        self.model = SentenceTransformer(model_name)
        self.book_embeddings = None
        self.book_ids = None
        self.index = None
        
    def generate_book_embeddings(self, books: List[Dict]) -> np.ndarray:
        """
        Generate embeddings for books using their descriptions, genres, and tags
        """
        texts = []
        for book in books:
            # Combine title, description, genres, and tags for embedding
            text = f"{book['title']} {book['description']} "
            text += " ".join(book.get('genres', []))
            text += " " + " ".join(book.get('tags', []))
            texts.append(text)
        
        embeddings = self.model.encode(texts, show_progress_bar=True)
        return embeddings
    
    def build_faiss_index(self, embeddings: np.ndarray, book_ids: List[int]):
        """
        Build FAISS index for fast similarity search
        """
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Inner product (cosine similarity for normalized vectors)
        
        # Normalize embeddings for cosine similarity
        normalized_embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
        self.index.add(normalized_embeddings.astype('float32'))
        self.book_ids = book_ids
        self.book_embeddings = normalized_embeddings
        
    def save_index(self, path: str):
        """Save FAISS index and book IDs to disk"""
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, f"{path}.index")
        with open(f"{path}.pkl", 'wb') as f:
            pickle.dump({'book_ids': self.book_ids, 'book_embeddings': self.book_embeddings}, f)
    
    def load_index(self, path: str):
        """Load FAISS index and book IDs from disk"""
        self.index = faiss.read_index(f"{path}.index")
        with open(f"{path}.pkl", 'rb') as f:
            data = pickle.load(f)
            self.book_ids = data['book_ids']
            self.book_embeddings = data['book_embeddings']
    
    def get_similar_books(self, book_id: int, k: int = 10) -> List[Tuple[int, float]]:
        """
        Get k similar books using FAISS index
        Returns list of (book_id, similarity_score) tuples
        """
        if self.index is None:
            raise ValueError("Index not built. Call build_faiss_index first.")
        
        # Find the index of the book
        try:
            book_idx = self.book_ids.index(book_id)
        except ValueError:
            return []
        
        # Get the embedding for the book
        query_vector = self.book_embeddings[book_idx:book_idx+1].astype('float32')
        
        # Search for similar books
        similarities, indices = self.index.search(query_vector, k + 1)  # +1 to exclude self
        
        # Convert to list of (book_id, similarity_score)
        results = []
        for idx, score in zip(indices[0], similarities[0]):
            if idx != book_idx:  # Exclude the book itself
                results.append((self.book_ids[idx], float(score)))
        
        return results[:k]
    
    def get_recommendations_for_user(
        self,
        user_liked_books: List[int],
        user_disliked_books: List[int] = None,
        k: int = 10
    ) -> List[Tuple[int, float]]:
        """
        Get personalized recommendations for a user based on their liked books
        """
        if self.index is None:
            raise ValueError("Index not built. Call build_faiss_index first.")
        
        user_disliked_books = user_disliked_books or []
        
        # Get embeddings for liked books
        liked_indices = [self.book_ids.index(bid) for bid in user_liked_books if bid in self.book_ids]
        disliked_indices = [self.book_ids.index(bid) for bid in user_disliked_books if bid in self.book_ids]
        
        if not liked_indices:
            return []
        
        # Average the embeddings of liked books
        liked_embeddings = self.book_embeddings[liked_indices]
        user_profile = np.mean(liked_embeddings, axis=0)
        
        # Subtract disliked books if any
        if disliked_indices:
            disliked_embeddings = self.book_embeddings[disliked_indices]
            disliked_profile = np.mean(disliked_embeddings, axis=0)
            user_profile = user_profile - disliked_profile
        
        # Normalize user profile
        user_profile = user_profile / np.linalg.norm(user_profile)
        
        # Search for similar books
        query_vector = user_profile.reshape(1, -1).astype('float32')
        similarities, indices = self.index.search(query_vector, k * 2)  # Get more to filter
        
        # Filter out already liked/disliked books
        results = []
        seen_books = set(user_liked_books + user_disliked_books)
        
        for idx, score in zip(indices[0], similarities[0]):
            book_id = self.book_ids[idx]
            if book_id not in seen_books:
                results.append((book_id, float(score)))
                if len(results) >= k:
                    break
        
        return results
    
    def get_content_based_recommendations(
        self,
        user_preferences: Dict[str, List[str]],
        books: List[Dict],
        k: int = 10
    ) -> List[Tuple[int, float]]:
        """
        Get content-based recommendations based on user preferences (genres, authors, etc.)
        """
        scored_books = []
        
        for book in books:
            score = 0.0
            
            # Genre matching
            if 'preferred_genres' in user_preferences:
                book_genres = set(book.get('genres', []))
                preferred_genres = set(user_preferences['preferred_genres'])
                genre_match = len(book_genres & preferred_genres)
                score += genre_match * 3.0
            
            # Author matching
            if 'preferred_authors' in user_preferences:
                if book.get('author') in user_preferences['preferred_authors']:
                    score += 2.0
            
            # Add book's rating as a factor
            score += book.get('rating', 0) * 0.5
            
            scored_books.append((book['id'], score))
        
        # Sort by score and return top k
        scored_books.sort(key=lambda x: x[1], reverse=True)
        return scored_books[:k]
    
    def hybrid_recommendation(
        self,
        user_liked_books: List[int],
        user_preferences: Dict[str, List[str]],
        books: List[Dict],
        k: int = 10,
        content_weight: float = 0.4,
        collaborative_weight: float = 0.6
    ) -> List[Tuple[int, float]]:
        """
        Hybrid recommendation combining content-based and collaborative filtering
        """
        # Get collaborative recommendations
        collab_recs = self.get_recommendations_for_user(user_liked_books, k=k * 2)
        collab_scores = {book_id: score for book_id, score in collab_recs}
        
        # Get content-based recommendations
        content_recs = self.get_content_based_recommendations(user_preferences, books, k=k * 2)
        content_scores = {book_id: score for book_id, score in content_recs}
        
        # Combine scores
        combined_scores = {}
        all_book_ids = set(collab_scores.keys()) | set(content_scores.keys())
        
        for book_id in all_book_ids:
            score = 0.0
            if book_id in collab_scores:
                score += collab_scores[book_id] * collaborative_weight
            if book_id in content_scores:
                score += content_scores[book_id] * content_weight
            combined_scores[book_id] = score
        
        # Sort and return top k
        sorted_recs = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
        return sorted_recs[:k]


# Singleton instance
_engine_instance = None

def get_recommendation_engine() -> RecommendationEngine:
    """Get or create the singleton recommendation engine instance"""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = RecommendationEngine()
    return _engine_instance
