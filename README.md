# LitRealm: Personalized Book Recommendation System
### MCA Final Year Project — 2025–2026

LitRealm is a premium, personalized book discovery and library management system. Built using a modern full-stack web architecture, it utilizes hybrid collaborative and content-based recommendation techniques to provide readers with highly relevant, 100% appropriate, and high-quality book suggestions.

---

## 🎨 Design System & Aesthetics
LitRealm features a bespoke "literary-lover" warm aesthetic to impress project evaluators:
*   **Color Palette:** Soft Cream (`#FBF8F1`), Warm Sand (`#FFF9F2`), Crimson Burgundy (`#7B2D42`), Navy Blue (`#1E2B4A`), and Soft Gold (`#C9963A`).
*   **Typography:** Google Fonts *Playfair Display* (for headings and titles) and *Inter* (for clean user interface layout).
*   **Animations:** Smooth custom CSS transitions and micro-interactions (e.g., hover lifting, modal slide-ins, status transitions).

---

## 📚 Seed Database Features
*   **High-Quality Dataset:** Pre-populated with **255 famous, popular, and clean English books** across diverse genres.
*   **100% Family-Friendly:** Zero explicit, adult, violent, or dark content. **The Horror genre has been permanently removed** to ensure compliance with strict academic guidelines.
*   **Rich Metadata:** Comprehensive book entries including Title, Author, Year, Pages, clean Synopsis, stable Cover URLs from OpenLibrary, ISBN, and Search Tags.

---

## ⚙️ Core Recommendation Engine
The engine utilizes a similarity vector matching model to score and recommend books:
1.  **Cold-Start Matching:** Scores book matches based on user's selected genres and languages during onboarding.
2.  **Author Preference Boost:** Multiplies scoring weight if the book author matches the user's preferred writers.
3.  **Dynamic Shelf Tracking:** Real-time updates to recommendation feeds as you add items to your library or modify reading progress.

---

## 🛠️ Technology Stack

### Frontend Architecture
*   **Framework:** Next.js 14+ (App Router)
*   **Language:** TypeScript (Type-safe schemas)
*   **Styling:** Vanilla CSS Custom Variables (Maximum flexibility and control)
*   **State Management:** React Context + HTML5 LocalStorage persistence

### Backend & Machine Learning (Ready-to-Scale)
*   **Framework:** Python FastAPI
*   **Machine Learning:** `sentence-transformers` (Sentence-BERT), `faiss-cpu` (Fast Vector Search), `scikit-learn`
*   **Database:** PostgreSQL (with `pgvector` extension)

---

## 🚀 Step-by-Step Local Setup

### Prerequisites
*   Node.js (v18 or higher)
*   npm (v9 or higher)

### Installation & Launch
1.  **Extract the project archive** and open the folder in your terminal.
2.  Navigate to the frontend folder:
    ```bash
    cd frontend
    ```
3.  Install the required dependencies:
    ```bash
    npm install
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```
5.  Open your browser and navigate to:
    👉 **http://localhost:3000**

---

## 📂 Project Architecture

```
Book_Recomendation_System/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── catalog/
│   │   │   │   ├── [id]/page.tsx      # Detail & Review interface
│   │   │   │   └── page.tsx           # Rich search & multi-filter page
│   │   │   ├── library/
│   │   │   │   └── page.tsx           # Interactive bookshelves
│   │   │   ├── profile/
│   │   │   │   └── page.tsx           # Preferences and stats page
│   │   │   ├── layout.tsx             # Sticky navbar and layout
│   │   │   └── page.tsx               # Onboarding and main dashboard
│   │   ├── components/
│   │   │   ├── BookCard.tsx           # Reuseable aesthetic book card
│   │   │   └── NavBar.tsx             # Interactive header navigation
│   │   └── lib/
│   │       ├── data.ts                # 255 Clean English Book Dataset
│   │       ├── recommendations.ts     # Content similarity algorithms
│   │       └── store.tsx              # Global state & LocalStorage engine
│   ├── package.json
│   └── next.config.js
└── README.md                          # Project Documentation
```

---

## 🎓 Academic Viva Highlights
When demonstrating the project to external examiners, highlight the following:
1.  **Onboarding State Machine:** Shows how preferences are persisted instantly in local storage without page reloads.
2.  **Instant Filter Response:** Turbine-fast searching across 255 titles via localized multi-index matching.
3.  **Bespoke Bookshelves:** Demonstrate adding *Atomic Habits* to "Currently Reading", moving it to "Completed", sliding the progress bar, and giving it 5 stars with a personal note. Show how these interactions dynamically affect recommendation priority scoring.
