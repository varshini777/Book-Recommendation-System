import os
import pickle
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from app.db.models import Book, Author, Genre, Rating, LibraryEntry
from typing import List, Optional
from datetime import datetime, timedelta
from functools import lru_cache
import time

_model_cache = None
_model_cache_path = None
_model_load_time = 0

def _load_recommender_model():
    global _model_cache, _model_cache_path, _model_load_time
    model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'recommender.pkl')
    if not os.path.exists(model_path):
        root_model_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'models', 'recommender.pkl')
        if os.path.exists(root_model_path):
            model_path = root_model_path
    if _model_cache is not None and _model_cache_path == model_path:
        return _model_cache
    if os.path.exists(model_path):
        with open(model_path, 'rb') as f:
            _model_cache = pickle.load(f)
            _model_cache_path = model_path
            _model_load_time = time.time()
        return _model_cache
    return None


class BookService:
    def __init__(self, db: Session):
        self.db = db

    def get_book_by_id(self, book_id: int) -> Optional[Book]:
        return self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(Book.id == book_id).first()

    def get_all_books(
        self,
        query: Optional[str] = None,
        genre: Optional[str] = None,
        year: Optional[int] = None,
        min_rating: Optional[float] = None,
        author: Optional[str] = None,
        sort_by: str = "rating_desc",
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Book], int]:
        books_query = self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(Book.is_active == True)

        if query:
            search_term = f"%{query}%"
            words = query.strip().split()
            if len(words) > 1:
                conditions = []
                for word in words:
                    w = f"%{word}%"
                    conditions.append(Book.title.ilike(w))
                    conditions.append(Book.description.ilike(w))
                    conditions.append(Author.name.ilike(w))
                
                # Also allow ISBN match if the whole query (without spaces/dashes) matches an ISBN
                clean_isbn = query.replace("-", "").replace(" ", "").strip()
                conditions.append(Book.isbn == clean_isbn)
                conditions.append(Book.isbn == query.strip())

                books_query = books_query.outerjoin(Author, Book.author_id == Author.id).filter(
                    or_(*conditions)
                )
            else:
                books_query = books_query.outerjoin(Author, Book.author_id == Author.id).filter(
                    or_(
                        Book.title.ilike(search_term),
                        Book.description.ilike(search_term),
                        Author.name.ilike(search_term),
                        Genre.name.ilike(search_term),
                        Book.isbn == query.strip().replace("-", ""),
                        Book.isbn == query.strip()
                    )
                )
                books_query = books_query.join(Book.genres, isouter=True)

        if genre:
            books_query = books_query.join(Book.genres).filter(Genre.name == genre)

        if year:
            books_query = books_query.filter(Book.year == year)

        if min_rating:
            books_query = books_query.filter(Book.rating >= min_rating)

        if author:
            author_term = f"%{author}%"
            books_query = books_query.outerjoin(Author, Book.author_id == Author.id).filter(
                Author.name.ilike(author_term)
            )

        total = books_query.count()

        sort_options = {
            "rating_desc": Book.rating.desc(),
            "rating_asc": Book.rating.asc(),
            "year_desc": Book.year.desc(),
            "year_asc": Book.year.asc(),
            "title_asc": Book.title.asc(),
            "title_desc": Book.title.desc(),
            "popularity": Book.rating_count.desc(),
            "newest": Book.created_at.desc(),
        }
        order = sort_options.get(sort_by, Book.rating.desc())
        books_query = books_query.order_by(order)

        offset = (page - 1) * page_size
        books = books_query.offset(offset).limit(page_size).all()

        return books, total

    def search_books(self, q: str, limit: int = 20) -> List[Book]:
        if not q or len(q.strip()) < 1:
            return []

        search_term = f"%{q}%"
        books = self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).outerjoin(Author, Book.author_id == Author.id).filter(
            Book.is_active == True,
            or_(
                Book.title.ilike(search_term),
                Author.name.ilike(search_term),
                Book.description.ilike(search_term),
                Book.isbn == q.strip(),
            )
        ).order_by(
            Book.rating.desc()
        ).limit(limit).all()

        return books

    def get_similar_books(self, book_id: int, limit: int = 6) -> List[Book]:
        book = self.get_book_by_id(book_id)
        if not book:
            return []

        recommender = _load_recommender_model()
        if not recommender:
            return self._fallback_similar_books(book, limit)

        try:
            book_ids = recommender['book_ids']
            tfidf_matrix = recommender['tfidf_matrix']

            if book_id not in book_ids:
                return self._fallback_similar_books(book, limit)

            idx = book_ids.index(book_id)
            book_vector = tfidf_matrix[idx]

            cosine_sim = cosine_similarity(book_vector, tfidf_matrix).flatten()
            similar_indices = cosine_sim.argsort()[-(limit + 1):][::-1]

            recommended_book_ids = []
            for i in similar_indices:
                b_id = book_ids[i]
                if b_id != book_id:
                    recommended_book_ids.append(b_id)
                    if len(recommended_book_ids) >= limit:
                        break

            books = self.db.query(Book).options(
                joinedload(Book.author), joinedload(Book.genres)
            ).filter(Book.id.in_(recommended_book_ids)).all()
            book_dict = {b.id: b for b in books}
            return [book_dict[b_id] for b_id in recommended_book_ids if b_id in book_dict]

        except Exception as e:
            print(f"Error getting similar books: {e}")
            return self._fallback_similar_books(book, limit)

    def _fallback_similar_books(self, book: Book, limit: int = 6) -> List[Book]:
        genre_ids = [g.id for g in book.genres]
        similar = self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).join(Book.genres).filter(
            Genre.id.in_(genre_ids),
            Book.id != book.id,
            Book.is_active == True
        ).distinct().limit(limit * 2).all()

        author_books = self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(
            Book.author_id == book.author_id,
            Book.id != book.id,
            Book.is_active == True
        ).limit(limit).all()

        all_similar = list({b.id: b for b in similar + author_books}.values())
        all_similar.sort(key=lambda x: x.rating, reverse=True)
        return all_similar[:limit]

    def get_trending_books(self, limit: int = 8) -> List[Book]:
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        trending = self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(
            Book.is_active == True
        ).order_by(
            Book.rating.desc(), Book.rating_count.desc()
        ).limit(limit).all()
        return trending

    def get_new_releases(self, limit: int = 8) -> List[Book]:
        return self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(
            Book.is_active == True, Book.year > 0
        ).order_by(Book.year.desc(), Book.rating.desc()).limit(limit).all()

    def get_hidden_gems(self, limit: int = 8) -> List[Book]:
        return self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(
            Book.is_active == True,
            Book.rating >= 3.5,
            Book.rating_count <= 10
        ).order_by(Book.rating.desc()).limit(limit).all()

    def update_book_rating(self, book_id: int) -> None:
        ratings = self.db.query(Rating).filter(Rating.book_id == book_id).all()
        book = self.get_book_by_id(book_id)
        if book:
            if ratings:
                avg_rating = sum(r.rating for r in ratings) / len(ratings)
                book.rating = round(avg_rating, 2)
                book.rating_count = len(ratings)
            else:
                book.rating = 0.0
                book.rating_count = 0
            self.db.commit()
