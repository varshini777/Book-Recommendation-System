from sqlalchemy.orm import Session, joinedload
from app.db.models import Book, LibraryEntry, Rating, UserPreference, Genre, Author, RecommendationLog
from app.services.book_service import BookService, _load_recommender_model
from typing import List, Optional, Tuple, Dict
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime, timedelta
from sqlalchemy import func
import numpy as np
import random
import math


class RecommendationService:
    def __init__(self, db: Session):
        self.db = db
        self.book_service = BookService(db)

    def _weighted_score(
        self,
        similarity_score: float = 0.0,
        genre_score: float = 0.0,
        author_score: float = 0.0,
        onboarding_liked_score: float = 0.0,
        popularity_score: float = 0.0,
        freshness_score: float = 0.0,
        diversity_score: float = 0.0,
    ) -> float:
        return (
            0.35 * similarity_score +
            0.20 * genre_score +
            0.15 * author_score +
            0.10 * onboarding_liked_score +
            0.10 * popularity_score +
            0.05 * freshness_score +
            0.05 * diversity_score
        )

    def _get_onboarding_liked_book_ids(self, user_id: int) -> set[int]:
        from app.db.models import OnboardingLikedBook
        liked = self.db.query(OnboardingLikedBook.book_id).filter(OnboardingLikedBook.user_id == user_id).all()
        return {item[0] for item in liked}

    def _get_book_genre_score(self, book: Book, preferred_genres: List[str]) -> float:
        if not preferred_genres:
            return 0.5
        book_genres = {g.name.lower() for g in book.genres} if book.genres else set()
        preferred = {g.lower() for g in preferred_genres}
        overlap = len(book_genres & preferred)
        return min(overlap / max(len(preferred), 1), 1.0)

    def _get_book_author_score(self, book: Book, preferred_authors: List[str]) -> float:
        if not preferred_authors or not book.author:
            return 0.5
        preferred_authors_lower = {a.lower() for a in preferred_authors}
        if book.author.name.lower() in preferred_authors_lower:
            return 1.0
        return 0.5

    def _get_user_profile(self, user_id: int):
        preferences = self.db.query(UserPreference).filter(
            UserPreference.user_id == user_id
        ).first()
        user_ratings = self.db.query(Rating).filter(
            Rating.user_id == user_id, Rating.rating >= 4
        ).all()
        user_library = self.db.query(LibraryEntry).filter(
            LibraryEntry.user_id == user_id
        ).all()
        return preferences, user_ratings, user_library

    def _freshness_score(self, book: Book) -> float:
        if not book.year or book.year < 1900:
            return 0.3
        current_year = datetime.utcnow().year
        years_old = current_year - book.year
        if years_old <= 1:
            return 1.0
        elif years_old <= 5:
            return 0.8
        elif years_old <= 10:
            return 0.6
        elif years_old <= 30:
            return 0.4
        return 0.2

    def _popularity_score(self, book: Book) -> float:
        max_count = self.db.query(Book.rating_count).order_by(
            Book.rating_count.desc()
        ).first()
        if not max_count or max_count[0] == 0:
            return 0.5
        return min(book.rating_count / max_count[0], 1.0)

    def _rating_score(self, book: Book) -> float:
        return min(book.rating / 5.0, 1.0) if book.rating else 0.5

    def _genre_preference_score(self, book: Book, preferences) -> float:
        if not preferences or not preferences.preferred_genres:
            return 0.5
        book_genres = {g.name for g in book.genres} if book.genres else set()
        preferred = set(preferences.preferred_genres)
        if not preferred:
            return 0.5
        overlap = len(book_genres & preferred)
        return min(overlap / max(len(preferred), 1), 1.0)

    def _add_diversity(self, books: list, diversity_factor: float = 0.15) -> list:
        if len(books) <= 3:
            return books
        n_diverse = max(1, int(len(books) * diversity_factor))
        diverse_pool = books[-n_diverse:] if n_diverse < len(books) else books[-1:]
        main_pool = books[:-n_diverse] if n_diverse < len(books) else books[:1]
        random.shuffle(diverse_pool)
        return main_pool + diverse_pool

    def generate_explanation(
        self,
        book: Book,
        user_id: int,
        algorithm: str = "hybrid",
        context: str = "recommendation"
    ) -> str:
        preferences, user_ratings, user_library = self._get_user_profile(user_id)
        book_genres = [g.name for g in book.genres] if book.genres else []

        if context == "similar":
            return f"Similar in theme and content to books you're viewing."

        if context == "also_enjoyed":
            return f"Readers who enjoyed the same books as you also liked this."

        if context == "cold_start":
            if book_genres:
                return f"Popular in {book_genres[0]} — a great place to start."
            return f"A highly rated book loved by readers worldwide."

        if not preferences or not preferences.preferred_genres:
            if book.rating and book.rating >= 4.0:
                return f"Highly rated ({book.rating:.1f}/5) by {book.rating_count}+ readers."
            return f"Recommended based on overall popularity and quality."

        preferred = set(preferences.preferred_genres)
        matching_genres = [g for g in book_genres if g in preferred]

        if matching_genres:
            genre_text = matching_genres[0] if len(matching_genres) == 1 else " and ".join(matching_genres[:2])
            if user_ratings and len(user_ratings) > 0:
                rated_books = self.db.query(Book).join(Rating).filter(
                    Rating.user_id == user_id, Rating.rating >= 4
                ).all()
                rated_genres = set()
                for rb in rated_books:
                    for g in rb.genres:
                        rated_genres.add(g.name)
                if genre_text.lower() in [g.lower() for g in rated_genres]:
                    return f"Recommended because you enjoy {genre_text} books."
                return f"Matches your interest in {genre_text}."
            return f"Popular in {genre_text}, one of your preferred genres."

        if user_ratings and len(user_ratings) > 0:
            return f"Readers with similar taste also enjoyed this book."

        if book.rating and book.rating >= 4.0:
            return f"Highly rated ({book.rating:.1f}/5) — widely loved by readers."

        return f"Curated pick based on your reading profile."

    def get_explained_recommendations(
        self,
        user_id: int,
        limit: int = 12,
        exclude_book_ids: Optional[List[int]] = None,
        algorithm: str = "hybrid"
    ) -> List[Tuple[Book, str, float]]:
        if exclude_book_ids is None:
            exclude_book_ids = []

        if algorithm == "content":
            books = self.get_content_based_recommendations(user_id, limit, exclude_book_ids)
        elif algorithm == "collaborative":
            books = self.get_collaborative_recommendations(user_id, limit, exclude_book_ids)
        else:
            books = self.get_hybrid_recommendations(user_id, limit, exclude_book_ids)

        preferences, user_ratings, user_library = self._get_user_profile(user_id)
        preferred_genres = preferences.preferred_genres if preferences else []
        preferred_authors = preferences.preferred_authors if preferences else []
        onboarding_liked_ids = self._get_onboarding_liked_book_ids(user_id)
        
        # Load similarity model if we want to calculate actual similarity
        recommender = _load_recommender_model()
        sim_scores = {}
        if recommender and (user_ratings or onboarding_liked_ids):
            try:
                book_ids = recommender['book_ids']
                tfidf_matrix = recommender['tfidf_matrix']
                liked_book_ids = [r.book_id for r in user_ratings] if user_ratings else list(onboarding_liked_ids)
                indices = [i for i, b_id in enumerate(book_ids) if b_id in liked_book_ids]
                if indices:
                    user_profile = tfidf_matrix[indices].mean(axis=0)
                    user_profile = np.asarray(user_profile)
                    cosine_sim = cosine_similarity(user_profile, tfidf_matrix).flatten()
                    for idx, sim_val in enumerate(cosine_sim):
                        sim_scores[book_ids[idx]] = float(sim_val)
            except Exception as e:
                print(f"Error computing similarity for explanation: {e}")

        results = []
        import random
        for book in books:
            explanation = self.generate_explanation(book, user_id, algorithm, "recommendation")
            sim = sim_scores.get(book.id, 0.0)
            score = self._weighted_score(
                similarity_score=sim,
                genre_score=self._get_book_genre_score(book, preferred_genres),
                author_score=self._get_book_author_score(book, preferred_authors),
                onboarding_liked_score=1.0 if book.id in onboarding_liked_ids else 0.0,
                popularity_score=self._popularity_score(book),
                freshness_score=self._freshness_score(book),
                diversity_score=random.random()
            )
            results.append((book, explanation, score))

        return results

    def get_content_based_recommendations(
        self,
        user_id: int,
        limit: int = 12,
        exclude_book_ids: Optional[List[int]] = None
    ) -> List[Book]:
        if exclude_book_ids is None:
            exclude_book_ids = []

        recommender = _load_recommender_model()
        preferences, user_ratings, user_library = self._get_user_profile(user_id)
        onboarding_liked_ids = self._get_onboarding_liked_book_ids(user_id)

        if not user_ratings and not onboarding_liked_ids and (not preferences or not preferences.preferred_genres):
            return self.book_service.get_trending_books(limit)

        try:
            if recommender:
                book_ids = recommender['book_ids']
                tfidf_matrix = recommender['tfidf_matrix']

                # Get liked book IDs from ratings OR onboarding liked books
                liked_book_ids = []
                if user_ratings:
                    liked_book_ids = [r.book_id for r in user_ratings]
                else:
                    liked_book_ids = list(onboarding_liked_ids)

                if liked_book_ids:
                    indices = [i for i, b_id in enumerate(book_ids) if b_id in liked_book_ids]

                    if not indices:
                        return self.book_service.get_trending_books(limit)

                    user_profile = tfidf_matrix[indices].mean(axis=0)
                    user_profile = np.asarray(user_profile)
                    cosine_sim = cosine_similarity(user_profile, tfidf_matrix).flatten()

                    candidates = []
                    for idx in cosine_sim.argsort()[::-1]:
                        b_id = book_ids[idx]
                        if b_id not in exclude_book_ids and b_id not in liked_book_ids:
                            candidates.append((b_id, float(cosine_sim[idx])))
                            if len(candidates) >= limit * 3:
                                break

                    books_dict = {}
                    books = self.db.query(Book).options(
                        joinedload(Book.author), joinedload(Book.genres)
                    ).filter(Book.id.in_([c[0] for c in candidates])).all()
                    for b in books:
                        books_dict[b.id] = b

                    scored = []
                    preferred_genres = preferences.preferred_genres if preferences else []
                    preferred_authors = preferences.preferred_authors if preferences else []
                    import random
                    
                    for b_id, sim in candidates:
                        if b_id in books_dict:
                            book = books_dict[b_id]
                            score = self._weighted_score(
                                similarity_score=sim,
                                genre_score=self._get_book_genre_score(book, preferred_genres),
                                author_score=self._get_book_author_score(book, preferred_authors),
                                onboarding_liked_score=1.0 if book.id in onboarding_liked_ids else 0.0,
                                popularity_score=self._popularity_score(book),
                                freshness_score=self._freshness_score(book),
                                diversity_score=random.random()
                            )
                            scored.append((book, score))

                    scored.sort(key=lambda x: x[1], reverse=True)
                    result = [b for b, s in scored[:limit]]
                    return self._add_diversity(result)
                else:
                    genre_objects = self.db.query(Genre).filter(
                        Genre.name.in_(preferences.preferred_genres)
                    ).all()
                    genre_ids = [g.id for g in genre_objects]
                    books = self.db.query(Book).options(
                        joinedload(Book.author), joinedload(Book.genres)
                    ).join(Book.genres).filter(
                        Genre.id.in_(genre_ids),
                        Book.is_active == True,
                        Book.id.notin_(exclude_book_ids)
                    ).distinct().limit(limit).all()
                    return books
        except Exception as e:
            print(f"Error in content-based recommendations: {e}")
            return self.book_service.get_trending_books(limit)

        return self.book_service.get_trending_books(limit)

    def get_collaborative_recommendations(
        self,
        user_id: int,
        limit: int = 12,
        exclude_book_ids: Optional[List[int]] = None
    ) -> List[Book]:
        if exclude_book_ids is None:
            exclude_book_ids = []

        user_ratings = self.db.query(Rating).filter(Rating.user_id == user_id).all()
        if not user_ratings:
            return []

        user_book_ids = [r.book_id for r in user_ratings]
        similar_users = self.db.query(Rating).filter(
            Rating.book_id.in_(user_book_ids),
            Rating.user_id != user_id
        ).all()

        similar_user_ids = list(set(r.user_id for r in similar_users))
        recommended_ratings = self.db.query(Rating).filter(
            Rating.user_id.in_(similar_user_ids),
            Rating.book_id.notin_(user_book_ids + exclude_book_ids)
        ).all()

        book_scores = {}
        book_rating_counts = {}
        for rating in recommended_ratings:
            if rating.book_id not in book_scores:
                book_scores[rating.book_id] = 0
                book_rating_counts[rating.book_id] = 0
            book_scores[rating.book_id] += rating.rating
            book_rating_counts[rating.book_id] += 1

        avg_scores = {bid: score / count for bid, score in book_scores.items()}
        sorted_books = sorted(avg_scores.items(), key=lambda x: x[1], reverse=True)
        top_book_ids = [bid for bid, score in sorted_books[:limit]]

        books = self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(Book.id.in_(top_book_ids), Book.is_active == True).all()

        book_dict = {b.id: b for b in books}
        return [book_dict[bid] for bid in top_book_ids if bid in book_dict]

    def get_hybrid_recommendations(
        self,
        user_id: int,
        limit: int = 12,
        exclude_book_ids: Optional[List[int]] = None
    ) -> List[Book]:
        if exclude_book_ids is None:
            exclude_book_ids = []

        content_based = self.get_content_based_recommendations(user_id, limit * 2, exclude_book_ids)
        collaborative = self.get_collaborative_recommendations(user_id, limit * 2, exclude_book_ids)

        book_scores = {}
        for i, book in enumerate(content_based):
            score = (len(content_based) - i) * 0.6
            book_scores[book.id] = book_scores.get(book.id, 0) + score

        for i, book in enumerate(collaborative):
            score = (len(collaborative) - i) * 0.4
            book_scores[book.id] = book_scores.get(book.id, 0) + score

        sorted_books = sorted(book_scores.items(), key=lambda x: x[1], reverse=True)
        top_book_ids = [bid for bid, score in sorted_books[:limit]]

        books = self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(Book.id.in_(top_book_ids), Book.is_active == True).all()

        book_dict = {b.id: b for b in books}
        return [book_dict[bid] for bid in top_book_ids if bid in book_dict]

    def get_personalized_picks(self, user_id: int, limit: int = 12) -> List[Book]:
        preferences, user_ratings, user_library = self._get_user_profile(user_id)
        onboarding_liked_ids = list(self._get_onboarding_liked_book_ids(user_id))
        
        if not user_ratings and not onboarding_liked_ids and (not preferences or not preferences.preferred_genres):
            return self.book_service.get_trending_books(limit)
            
        exclude_ids = [r.book_id for r in user_ratings] + [e.book_id for e in user_library] + onboarding_liked_ids
        return self.get_content_based_recommendations(user_id, limit, exclude_ids)

    def get_readers_also_enjoyed(self, book_id: int, limit: int = 8) -> List[Book]:
        similar_users = self.db.query(LibraryEntry).filter(
            LibraryEntry.book_id == book_id,
            LibraryEntry.status == "completed"
        ).all()

        if not similar_users:
            return self.book_service.get_similar_books(book_id, limit)

        user_ids = [e.user_id for e in similar_users]
        also_enjoyed = self.db.query(LibraryEntry).filter(
            LibraryEntry.user_id.in_(user_ids),
            LibraryEntry.book_id != book_id,
            LibraryEntry.status.in_(["completed", "currently_reading"]),
            LibraryEntry.is_favorite == True
        ).all()

        book_scores = {}
        for entry in also_enjoyed:
            if entry.book_id not in book_scores:
                book_scores[entry.book_id] = 0
            book_scores[entry.book_id] += entry.rating if entry.rating else 3

        sorted_ids = sorted(book_scores.keys(), key=lambda x: book_scores[x], reverse=True)
        top_ids = sorted_ids[:limit]

        books = self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(Book.id.in_(top_ids), Book.is_active == True).all()
        book_dict = {b.id: b for b in books}
        return [book_dict[bid] for bid in top_ids if bid in book_dict]

    def get_similar_authors(self, author_id: int, limit: int = 8) -> List[Book]:
        author = self.db.query(Author).filter(Author.id == author_id).first()
        if not author:
            return []

        author_books = self.db.query(Book).filter(
            Book.author_id == author_id, Book.is_active == True
        ).all()

        if not author_books:
            return []

        genre_ids = set()
        for book in author_books:
            for g in book.genres:
                genre_ids.add(g.id)

        if not genre_ids:
            return self.book_service.get_trending_books(limit)

        similar = self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).join(Book.genres).filter(
            Genre.id.in_(genre_ids),
            Book.author_id != author_id,
            Book.is_active == True
        ).distinct().order_by(Book.rating.desc()).limit(limit).all()

        return similar

    def get_same_genre_books(self, book_id: int, limit: int = 6) -> List[Book]:
        book = self.db.query(Book).options(
            joinedload(Book.genres)
        ).filter(Book.id == book_id).first()
        if not book or not book.genres:
            return []

        genre_ids = [g.id for g in book.genres]
        return self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).join(Book.genres).filter(
            Genre.id.in_(genre_ids),
            Book.id != book_id,
            Book.is_active == True
        ).distinct().order_by(Book.rating.desc()).limit(limit).all()

    def get_by_genre(self, genre_name: str, limit: int = 8) -> List[Book]:
        return self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).join(Book.genres).filter(
            Genre.name.ilike(genre_name),
            Book.is_active == True
        ).order_by(Book.rating.desc()).limit(limit).all()

    def get_by_author(self, author_id: int, limit: int = 8) -> List[Book]:
        return self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(
            Book.author_id == author_id, Book.is_active == True
        ).order_by(Book.rating.desc()).limit(limit).all()

    def get_trending(self, limit: int = 8) -> List[Book]:
        return self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(Book.is_active == True).order_by(
            Book.rating.desc(), Book.rating_count.desc()
        ).limit(limit).all()

    def get_new_releases(self, limit: int = 8) -> List[Book]:
        return self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(
            Book.is_active == True, Book.year > 0
        ).order_by(Book.year.desc(), Book.rating.desc()).limit(limit).all()

    def get_top_rated(self, limit: int = 8) -> List[Book]:
        return self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(
            Book.is_active == True, Book.rating > 0
        ).order_by(Book.rating.desc(), Book.rating_count.desc()).limit(limit).all()

    def get_hidden_gems(self, limit: int = 8) -> List[Book]:
        return self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(
            Book.is_active == True,
            Book.rating >= 3.5,
            Book.rating_count <= 10
        ).order_by(Book.rating.desc()).limit(limit).all()

    def get_cold_start_recommendations(self, limit: int = 12) -> List[Book]:
        return self.db.query(Book).options(
            joinedload(Book.author), joinedload(Book.genres)
        ).filter(
            Book.is_active == True,
            Book.rating >= 3.5,
            Book.rating_count >= 1
        ).order_by(
            Book.rating.desc(), Book.rating_count.desc()
        ).limit(limit).all()

    def log_recommendation(
        self,
        user_id: int,
        book_id: int,
        algorithm: str,
        score: float,
        reason: str
    ) -> None:
        try:
            log = RecommendationLog(
                user_id=user_id, book_id=book_id,
                algorithm=algorithm, score=score, reason=reason
            )
            self.db.add(log)
            self.db.commit()
        except Exception:
            self.db.rollback()

    def calculate_metrics(self, user_id: int = None, k: int = 10) -> Dict:
        if user_id:
            rated_books = self.db.query(Rating).filter(
                Rating.user_id == user_id, Rating.rating >= 4
            ).all()
            relevant_book_ids = {r.book_id for r in rated_books}

            recommended = self.get_hybrid_recommendations(user_id, k)
            recommended_ids = [b.id for b in recommended]

            hits = len(set(recommended_ids) & relevant_book_ids)
            precision = hits / k if k > 0 else 0
            recall = hits / len(relevant_book_ids) if relevant_book_ids else 0

            ap = 0
            hits_so_far = 0
            for i, bid in enumerate(recommended_ids):
                if bid in relevant_book_ids:
                    hits_so_far += 1
                    ap += hits_so_far / (i + 1)
            map_score = ap / min(len(relevant_book_ids), k) if relevant_book_ids else 0

            dcg = 0
            for i, bid in enumerate(recommended_ids):
                if bid in relevant_book_ids:
                    dcg += 1 / math.log2(i + 2)
            ideal_hits = min(len(relevant_book_ids), k)
            idcg = sum(1 / math.log2(i + 2) for i in range(ideal_hits))
            ndcg = dcg / idcg if idcg > 0 else 0

            total_recs = self.db.query(RecommendationLog).filter(
                RecommendationLog.user_id == user_id
            ).count()
            clicked_recs = self.db.query(RecommendationLog).filter(
                RecommendationLog.user_id == user_id, RecommendationLog.clicked == True
            ).count()
            acceptance_rate = clicked_recs / total_recs if total_recs > 0 else 0

            return {
                "precision_at_k": round(precision, 4),
                "recall_at_k": round(recall, 4),
                "map_score": round(map_score, 4),
                "ndcg_at_k": round(ndcg, 4),
                "acceptance_rate": round(acceptance_rate, 4),
                "total_recommendations": total_recs,
                "clicked_recommendations": clicked_recs,
                "relevant_books": len(relevant_book_ids),
                "recommended_books": k,
            }

        total_users = self.db.query(func.count(func.distinct(Rating.user_id))).scalar() or 0
        total_ratings = self.db.query(Rating).count()
        avg_rating = self.db.query(func.avg(Rating.rating)).scalar() or 0

        algorithms_used = self.db.query(
            RecommendationLog.algorithm, func.count(RecommendationLog.id)
        ).group_by(RecommendationLog.algorithm).all()

        return {
            "total_users_rated": total_users,
            "total_ratings": total_ratings,
            "average_rating": round(float(avg_rating), 2),
            "algorithms_used": {alg: count for alg, count in algorithms_used},
            "model_type": "TF-IDF + Cosine Similarity (Hybrid)",
            "features": [
                "Content-Based Filtering (TF-IDF Vectorization)",
                "Collaborative Filtering (User-Based)",
                "Weighted Hybrid Ranking",
                "Genre Preference Matching",
                "Popularity Score",
                "Freshness Score",
                "Diversity Injection",
                "Cold-Start Handling",
            ],
        }

    def get_search_suggestions(self, q: str, limit: int = 8) -> List[Dict]:
        if not q or len(q.strip()) < 1:
            return []

        search_term = f"%{q}%"
        books = self.db.query(Book.title).filter(
            Book.is_active == True,
            Book.title.ilike(search_term)
        ).limit(limit).all()

        author_matches = self.db.query(Author.name).filter(
            Author.name.ilike(search_term)
        ).limit(3).all()

        genre_matches = self.db.query(Genre.name).filter(
            Genre.name.ilike(search_term)
        ).limit(3).all()

        suggestions = []
        seen = set()

        for title, in books:
            if title.lower() not in seen:
                suggestions.append({"text": title, "type": "book"})
                seen.add(title.lower())

        for name, in author_matches:
            if name.lower() not in seen:
                suggestions.append({"text": name, "type": "author"})
                seen.add(name.lower())

        for name, in genre_matches:
            if name.lower() not in seen:
                suggestions.append({"text": name, "type": "genre"})
                seen.add(name.lower())

        return suggestions[:limit]

    def get_popular_searches(self, limit: int = 8) -> List[str]:
        from app.db.models import SearchLog
        results = self.db.query(
            SearchLog.query, func.count(SearchLog.id).label('count')
        ).filter(
            SearchLog.query.isnot(None),
            SearchLog.query != ''
        ).group_by(
            SearchLog.query
        ).order_by(
            func.count(SearchLog.id).desc()
        ).limit(limit).all()

        return [q for q, c in results]

    def get_dataset_stats(self) -> Dict:
        total_books = self.db.query(Book).filter(Book.is_active == True).count()
        total_authors = self.db.query(Author).count()
        total_genres = self.db.query(Genre).count()
        total_users = self.db.query(func.count()).select_from(Book).scalar()

        avg_rating = self.db.query(func.avg(Book.rating)).filter(
            Book.is_active == True, Book.rating > 0
        ).scalar() or 0

        year_range = self.db.query(
            func.min(Book.year), func.max(Book.year)
        ).filter(Book.is_active == True, Book.year > 0).first()

        genre_dist = self.db.query(
            Genre.name, func.count(Book.id)
        ).join(Book.genres).filter(
            Book.is_active == True
        ).group_by(Genre.name).order_by(
            func.count(Book.id).desc()
        ).all()

        language_dist = self.db.query(
            Book.language, func.count(Book.id)
        ).filter(
            Book.is_active == True
        ).group_by(Book.language).order_by(
            func.count(Book.id).desc()
        ).limit(10).all()

        return {
            "total_books": total_books,
            "total_authors": total_authors,
            "total_genres": total_genres,
            "average_rating": round(float(avg_rating), 2),
            "year_range": {
                "min": int(year_range[0]) if year_range and year_range[0] else 0,
                "max": int(year_range[1]) if year_range and year_range[1] else 0,
            },
            "genre_distribution": {name: count for name, count in genre_dist},
            "language_distribution": {lang: count for lang, count in language_dist},
            "model_info": {
                "algorithm": "TF-IDF Vectorization + Cosine Similarity",
                "vectorizer": "TfidfVectorizer (max_features=5000, ngram_range=1-2)",
                "corpus_fields": ["title", "author", "description", "genres"],
                "similarity_method": "Cosine Similarity on sparse TF-IDF vectors",
                "ranking": "Hybrid weighted score (similarity + preference + popularity + rating + freshness)",
            },
        }
