# Intelligent Book Recommendation System 📚

An advanced, full-stack Book Recommendation System that offers high-quality, personalized book suggestions using Machine Learning (TF-IDF & Cosine Similarity). Built with a robust Python/FastAPI backend and a modern React/Next.js frontend.

---

## ✨ Key Features

### 1. 🧠 Machine Learning Engine
*   **TF-IDF Vectorization & Cosine Similarity:** Analyzes book metadata (titles, descriptions, genres, authors) to find deep contextual relationships between books.
*   **Hybrid Recommendation:** Combines content-based filtering (ML) with collaborative metrics (ratings) to provide highly relevant book suggestions.
*   **Smart Cold-Start:** Uses user onboarding preferences (genres) to suggest trending or genre-specific books until the user begins interacting with the library.
*   **"Similar Books" Matcher:** Instantly discover books contextually similar to the one you are currently viewing.

### 2. 🛡️ Authentication & Role-Based Access (RBAC)
*   **Secure JWT Authentication:** Full login, registration, and session management.
*   **Role-Based Access Control:** Differentiates between standard `user` and `admin` roles.
*   **Protected Admin Dashboard:** Dedicated admin interfaces protected by frontend middleware route-guards and backend endpoint dependencies.

### 3. 📖 Library & Cart Management
*   **Dynamic Bookshelves:** Track books across multiple statuses: *Want to Read*, *Currently Reading*, and *Completed*.
*   **Favorites & Bookmarks:** Toggle favorite books or bookmark them for quick access.
*   **Shopping Cart Simulation:** Add/remove items from a cart with real-time state management.

### 4. 🎨 Premium UI/UX & Aesthetics
*   **Bespoke Design System:** Warm, literary-inspired aesthetic featuring *Playfair Display* typography and soft, sophisticated color palettes.
*   **Micro-animations:** Smooth CSS transitions for hover states, card lifting, and modal dialogs.
*   **Resilient Image Loading:** Automatic fallback to aesthetic placeholder covers if remote image URLs fail to load.

### 5. 📊 Curated & Safe Dataset
*   **Automated Dataset Generation:** Includes custom scripts (`generate_dataset.py`, `import_dataset.py`) to pull 1000+ real, globally recognized English books from public APIs.
*   **Strict Content Filtering:** The ingestion script actively excludes explicit, adult, romance, and NSFW genres, strictly allowing educational, business, technology, history, thriller, and science categories.

---

## 🛠️ Technology Stack

### Backend
*   **Framework:** FastAPI (Python)
*   **Database:** SQLite (Default, production-ready via SQLAlchemy ORM)
*   **Machine Learning:** `scikit-learn` (TF-IDF), `pandas`, `numpy`
*   **Security:** `passlib` (Bcrypt), `python-jose` (JWT)

### Frontend
*   **Framework:** Next.js 14+ (React App Router)
*   **Language:** TypeScript
*   **State Management:** Zustand (with LocalStorage persist middleware)
*   **Styling:** Custom CSS / Tailwind CSS

---

## 🚀 Getting Started Locally

### 1. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Generate and Import the Dataset (Builds the SQLite DB and ML Models):
   ```bash
   python import_dataset.py
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The API will be available at http://localhost:8000*

### 2. Frontend Setup
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser to **http://localhost:3000** and explore!

---

## 📂 Project Architecture

```
Book_Recomendation_System/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI Route Controllers
│   │   ├── core/            # Security and JWT config
│   │   ├── db/              # SQLAlchemy Models & SQLite setup
│   │   ├── schemas/         # Pydantic validation schemas
│   │   └── services/        # Business logic & ML Recommender calls
│   ├── models/              # Pickled ML artifacts (tfidf.pkl, recommender.pkl)
│   ├── generate_dataset.py  # Script to fetch real books via OpenLibrary API
│   └── import_dataset.py    # Script to populate SQLite and train ML models
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js Pages (Admin, Auth, Catalog, Library)
│   │   ├── components/      # Reusable React components (BookCard, NavBar)
│   │   └── lib/             # API client services & Zustand global store
│   └── package.json
└── README.md                # Project Documentation
```

---

*Built for robust performance, clean data presentation, and accurate machine-learning driven recommendations.*
