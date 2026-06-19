# LitRealm - Intelligent Book Recommendation System

MCA Final Year Project 2025-26 — AI-powered book recommendations using TF-IDF & Cosine Similarity.

## Features

- **Hybrid Recommendation Engine**: TF-IDF content-based + collaborative filtering with weighted ranking
- **Explainable Recommendations**: Every recommendation includes a human-readable explanation
- **9,007 Books**: Curated from Goodbooks-10k dataset with 4,262 authors and 24 genres
- **Reading Analytics**: Dataset statistics, model performance, and genre distribution
- **Library Management**: Track reading progress, ratings, notes, and favorites
- **Professor Demo Mode**: Live system architecture and model information display
- **Advanced Search**: Autocomplete suggestions across titles, authors, and genres
- **Dark Mode**: Full theme support with persistent preference
- **Mobile Responsive**: Optimized for all screen sizes

## Tech Stack

### Backend
- Python 3.11 + FastAPI
- SQLAlchemy ORM + SQLite
- Scikit-learn (TF-IDF Vectorizer, Cosine Similarity)
- JWT Authentication
- Rate Limiting & Request Logging

### Frontend
- Next.js 14 (React 18) + TypeScript
- Zustand State Management
- Lucide Icons
- CSS Variables (Dynamic Theming)

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Default Admin Account
- **Email**: admin@litrealm.com
- **Password**: admin123

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/v1/recommendations/` | Personalized recommendations with explanations |
| `GET /api/v1/recommendations/personalized` | User-specific picks |
| `GET /api/v1/recommendations/similar/{id}` | Similar books |
| `GET /api/v1/recommendations/also-enjoyed/{id}` | Readers also enjoyed |
| `GET /api/v1/recommendations/same-genre/{id}` | Same genre books |
| `GET /api/v1/recommendations/similar-author/{id}` | Same author books |
| `GET /api/v1/recommendations/trending` | Trending books |
| `GET /api/v1/recommendations/new-releases` | New releases |
| `GET /api/v1/recommendations/top-rated` | Top rated books |
| `GET /api/v1/recommendations/hidden-gems` | Hidden gems |
| `GET /api/v1/recommendations/metrics` | Model metrics & Precision/NDCG |
| `GET /api/v1/recommendations/analytics` | Dataset statistics |
| `GET /api/v1/recommendations/search-suggestions?q=` | Autocomplete |
| `GET /api/v1/recommendations/popular-searches` | Popular searches |

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/catalog` | Book catalog with search, filter, sort, pagination |
| `/catalog/[id]` | Book detail with similar, also enjoyed, same genre |
| `/library` | Personal reading library |
| `/profile` | User profile |
| `/analytics` | Reading analytics dashboard |
| `/demo` | Professor demo mode |
| `/admin` | Admin dashboard with metrics |

## Recommendation Algorithm

```
Weighted Score = 0.4 × Similarity
              + 0.2 × Genre Preference
              + 0.15 × Popularity
              + 0.15 × Rating
              + 0.1  × Freshness
```

Features:
- TF-IDF Vectorization (max_features=5000, ngram_range=1-2)
- Cosine Similarity on sparse vectors
- Cold-start handling for new users
- Diversity injection (15% non-obvious picks)

## License

Academic project — MCA Final Year 2025-26
