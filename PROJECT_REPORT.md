# LitRealm — Project Report

## MCA Final Year Project 2025-26

**Title**: Intelligent Book Recommendation System Using Machine Learning  
**Stack**: FastAPI + Next.js + TF-IDF + Cosine Similarity

---

## 1. Abstract

LitRealm is a full-stack book recommendation platform that uses TF-IDF vectorization and cosine similarity to deliver personalized book suggestions. The system combines content-based filtering with collaborative filtering in a hybrid weighted ranking model, providing explainable recommendations to users.

---

## 2. Problem Statement

Readers face information overload with millions of books available. Traditional catalog browsing is inefficient. A smart recommendation system that understands reading preferences, provides context-aware suggestions, and explains its reasoning significantly improves book discovery.

---

## 3. Objectives

1. Build a hybrid recommendation engine using TF-IDF and collaborative filtering
2. Provide explainable recommendations with human-readable reasons
3. Implement a complete reading management platform (library, progress, ratings)
4. Support professor demo mode showing system architecture and model metrics
5. Ensure mobile-responsive, accessible, and production-ready deployment

---

## 4. Literature Review

| Technique | Approach | Limitation |
|---|---|---|
| Content-Based | TF-IDF on book metadata | Limited serendipity |
| Collaborative Filtering | User similarity matrix | Cold-start problem |
| Hybrid (Ours) | Weighted combination | Balanced trade-off |

Our approach uses a 5-factor weighted score combining similarity, genre preference, popularity, rating, and freshness.

---

## 5. System Architecture

```
┌─────────────────────────────────────────────┐
│              Frontend (Next.js)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Catalog  │ │ Library  │ │  Analytics   │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Profile  │ │  Demo    │ │    Admin     │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
└──────────────────┬──────────────────────────┘
                   │ REST API
┌──────────────────┴──────────────────────────┐
│              Backend (FastAPI)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Books API│ │  Rec API │ │  Admin API   │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
│  ┌──────────────────────────────────────────┐│
│  │     Recommendation Service (ML)          ││
│  │  TF-IDF │ Cosine Sim │ Hybrid Ranking   ││
│  └──────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────┐│
│  │         SQLite Database                  ││
│  │  22+ Tables │ 9007 Books │ 8 Indexes     ││
│  └──────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

---

## 6. Machine Learning Model

### 6.1 Vectorization

- **Vectorizer**: TF-IDF (TfidfVectorizer)
- **Parameters**: max_features=5000, ngram_range=(1,2)
- **Corpus**: title + author + description + genres
- **Output**: Sparse TF-IDF matrix (9007 × 5000)

### 6.2 Similarity Computation

- **Method**: Cosine Similarity on sparse vectors
- **Output**: 9007 × 9007 similarity matrix
- **Storage**: Pickle files (models/recommender.pkl, models/tfidf.pkl)

### 6.3 Hybrid Ranking

```
Score(book) = 0.4 × cosine_sim(book, profile)
           + 0.2 × genre_preference(book, user)
           + 0.15 × popularity(book)
           + 0.15 × rating(book)
           + 0.1 × freshness(book)
```

### 6.4 Features

| Feature | Weight | Description |
|---|---|---|
| Similarity | 0.4 | TF-IDF cosine similarity |
| Genre Preference | 0.2 | Match with user preferred genres |
| Popularity | 0.15 | Normalized rating count |
| Rating | 0.15 | Normalized book rating |
| Freshness | 0.1 | Recency based on publication year |

---

## 7. Database Design

### Core Tables
- `books` — 9007 books with metadata
- `authors` — 4262 authors
- `genres` — 24 curated genres
- `book_genres` — Many-to-many relationship
- `users` — User accounts with roles
- `ratings` — User-book ratings (1-5)
- `library_entries` — Reading status and progress

### Advanced Tables
- `reading_goals` — Annual reading targets
- `reading_streaks` — Daily reading tracking
- `badges` / `user_badges` — Achievement system
- `book_collections` — Curated collections
- `recommendation_logs` — Algorithm tracking
- `search_logs` — Search analytics

### Performance Indexes
```sql
CREATE INDEX ix_books_rating_active ON books(rating DESC, is_active);
CREATE INDEX ix_books_year_rating ON books(year DESC, rating DESC);
CREATE INDEX ix_books_title_active ON books(title, is_active);
CREATE INDEX ix_books_author_id ON books(author_id);
CREATE INDEX ix_ratings_user_id ON ratings(user_id);
CREATE INDEX ix_ratings_book_id ON ratings(book_id);
CREATE INDEX ix_library_user_status ON library_entries(user_id, status);
CREATE INDEX ix_library_book_id ON library_entries(book_id);
```

---

## 8. Implementation

### 8.1 Backend Services

| Service | Responsibility |
|---|---|
| `RecommendationService` | Hybrid ranking, explainability, metrics |
| `BookService` | Search, pagination, model loading |
| `UserService` | Authentication, profile management |
| `AdminService` | Platform statistics, user management |

### 8.2 Frontend Pages

| Page | Features |
|---|---|
| `/catalog` | Server-side pagination, debounced search, autocomplete, 8 sort options |
| `/catalog/[id]` | Book detail, similar/also-enjoyed/same-genre sections, library CRUD |
| `/library` | Reading progress, ratings, notes, status management |
| `/analytics` | Dataset statistics, genre distribution, model info |
| `/demo` | ML architecture, system metrics, technology stack |
| `/admin` | User management, platform stats, recommendation metrics |

### 8.3 Middleware

- **RateLimitMiddleware**: 120 requests/minute per IP
- **RequestLoggingMiddleware**: Request duration and status tracking
- **ExceptionHandlingMiddleware**: Global error handling with structured responses

---

## 9. Testing

### Frontend Build
- 18 routes compiled successfully
- TypeScript validation passed
- Static + dynamic pages generated

### Backend Compilation
- 114 routes registered
- All API endpoints functional
- Database connectivity verified

### API Endpoints Tested
- Book search with fuzzy matching
- Recommendation generation with explanations
- Library CRUD operations
- Admin statistics retrieval
- Search autocomplete suggestions

---

## 10. Results

| Metric | Value |
|---|---|
| Books in Database | 9,007 |
| Authors | 4,262 |
| Genres | 24 |
| Frontend Routes | 18 |
| API Endpoints | 114 |
| Database Tables | 22+ |
| Performance Indexes | 8 |
| Recommendation Algorithms | 3 (Content, Collaborative, Hybrid) |
| Build Time | ~7 seconds |

---

## 11. Conclusion

LitRealm demonstrates a production-ready book recommendation system that:

1. Successfully combines TF-IDF content-based filtering with collaborative filtering
2. Provides explainable recommendations with human-readable reasons
3. Handles cold-start scenarios with trending/popular fallbacks
4. Supports full reading management (library, progress, ratings, notes)
5. Includes professor demo mode for academic presentation
6. Achieves clean builds on both frontend and backend

---

## 12. Future Work

- **Deep Learning**: Transformer-based embeddings (BERT, Sentence-BERT)
- **Real-time Learning**: Online learning from user interactions
- **Social Features**: Reading groups, shared collections, discussions
- **Mobile App**: React Native companion application
- **Production Deploy**: Docker containerization + cloud deployment
- **A/B Testing**: Algorithm comparison framework

---

*Project submitted for MCA Final Year 2025-26*
