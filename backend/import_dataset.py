"""
Import static books dataset from CSV into SQLite database.
Verified field names from app/db/models.py Book model.
Does NOT delete existing user data.
"""
import pandas as pd
import pickle
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sqlalchemy.orm import Session
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal, engine
from app.db.models import Base, Book, Author, Genre

# Whitelist of allowed genres (must match genres in dataset)
ALLOWED_GENRES = {
    "Technology", "Artificial Intelligence", "Computer Science",
    "Cybersecurity", "Data Science",
    "Business", "Finance",
    "Psychology", "Productivity", "Leadership", "Innovation",
    "Biography", "History", "Philosophy",
    "Science", "Physics", "Space",
    "Mystery", "Thriller", "Adventure", "Fantasy",
    "Education", "Self Help", "Fiction",
}

# Local placeholder cover URL
PLACEHOLDER_COVER_URL = "/public/covers/placeholder.svg"


def load_dataset(csv_path):
    """Load and validate dataset from CSV"""
    try:
        df = pd.read_csv(csv_path, dtype=str)
    except Exception as e:
        print(f"[ERROR] Error reading CSV: {e}")
        return None

    print(f"[DATA] Loaded {len(df)} rows from {csv_path.name}")

    # Validate required columns (support both new and old naming)
    col_aliases = {
        'genre': ['genre', 'genres'],
        'publication_year': ['publication_year', 'year'],
    }
    for target, aliases in col_aliases.items():
        found = [c for c in aliases if c in df.columns]
        if found:
            if found[0] != target:
                df = df.rename(columns={found[0]: target})
        else:
            print(f"[ERROR] Missing column: expected one of {aliases}")
            return None

    required_cols = ['title', 'author', 'isbn', 'genre', 'description', 'publication_year', 'pages', 'language']
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        print(f"[ERROR] Missing columns in CSV: {missing}")
        return None

    return df


def validate_genres(genres_str):
    """Validate and filter genres against whitelist"""
    if not genres_str or pd.isna(genres_str):
        return []

    genres_list = [g.strip() for g in str(genres_str).split('|')]
    valid_genres = [g for g in genres_list if g in ALLOWED_GENRES]

    return valid_genres


def import_books(df, db):
    """
    Import books from DataFrame into SQLite.
    Uses verified field names from Book model.
    Preserves existing user data.
    """

    print("[IMPORT] Importing books (preserving existing user data)...")

    imported = 0
    skipped = 0
    duplicates = 0

    author_cache = {}
    genre_cache = {}

    for idx, row in df.iterrows():
        try:
            # Required fields
            title = str(row['title']).strip()
            author_name = str(row['author']).strip()

            # Optional fields
            isbn = str(row.get('isbn', '')).strip()
            description = str(row.get('description', '')).strip()
            genres_str = str(row.get('genre', '')).strip()
            language = str(row.get('language', 'English')).strip()

            # Parse publication_year (convert to int)
            try:
                year = int(row['publication_year']) if pd.notna(row['publication_year']) and str(row['publication_year']).strip() else None
            except (ValueError, TypeError):
                year = None

            # Parse pages (convert to int)
            try:
                pages = int(row['pages']) if pd.notna(row['pages']) and str(row['pages']).strip() else 0
            except (ValueError, TypeError):
                pages = 0

            # Validate required fields
            if not title or not author_name:
                skipped += 1
                continue

            # Check for duplicate by ISBN (if ISBN exists)
            if isbn:
                existing = db.query(Book).filter(Book.isbn == isbn).first()
                if existing:
                    duplicates += 1
                    continue

            # Validate and filter genres
            valid_genres = validate_genres(genres_str)
            if not valid_genres:
                skipped += 1
                continue

            # Get or create author (Book.author_id FK)
            if author_name not in author_cache:
                author = db.query(Author).filter(Author.name == author_name).first()
                if not author:
                    author = Author(name=author_name)
                    db.add(author)
                    db.flush()
                author_cache[author_name] = author
            else:
                author = author_cache[author_name]

            # Create Book with verified field names
            book = Book(
                title=title,
                author_id=author.id,
                isbn=isbn if isbn else None,
                cover_url=PLACEHOLDER_COVER_URL,
                language=language,
                year=year,
                pages=pages,
                description=description,
                tags=None,
                rating=0.0,
                rating_count=0,
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )

            # Add genres (Book.genres many-to-many relationship)
            for genre_name in valid_genres:
                if genre_name not in genre_cache:
                    genre = db.query(Genre).filter(Genre.name == genre_name).first()
                    if not genre:
                        genre = Genre(
                            name=genre_name,
                            description=f"Books in {genre_name}"
                        )
                        db.add(genre)
                        db.flush()
                    genre_cache[genre_name] = genre
                else:
                    genre = genre_cache[genre_name]

                book.genres.append(genre)

            # Add book to session
            db.add(book)
            imported += 1

            # Batch commit every 500 rows for performance
            if (idx + 1) % 500 == 0:
                db.commit()
                print(f"  [OK] Processed {idx + 1} rows ({imported} imported, {duplicates} dup, {skipped} invalid)")

        except Exception as e:
            print(f"  [WARN] Row {idx + 1}: {str(e)[:100]}")
            skipped += 1
            db.rollback()
            continue

    # Final commit
    try:
        db.commit()
    except Exception as e:
        print(f"[ERROR] Final commit failed: {e}")
        db.rollback()
        return 0

    print(f"\n[OK] Import complete:")
    print(f"   Books imported: {imported}")
    print(f"   Duplicates skipped: {duplicates}")
    print(f"   Invalid rows: {skipped}")

    return imported


def train_tfidf_model(db):
    """Train TF-IDF model on imported books for content-based recommendations"""

    print("\n[TRAIN] Training TF-IDF recommendation model...")

    # Fetch all books from database
    books = db.query(Book).all()

    if len(books) < 10:
        print(f"[WARN] Too few books ({len(books)}) for meaningful TF-IDF model")
        return False

    # Create text corpus from book metadata
    texts = []
    book_ids = []

    for book in books:
        genres_text = " ".join([g.name for g in book.genres]) if book.genres else ""
        author_text = book.author.name if book.author else ""
        text = f"{book.title} {author_text} {book.description} {genres_text}".strip()
        texts.append(text)
        book_ids.append(book.id)

    print(f"   Corpus size: {len(texts)} books")

    # Train TF-IDF vectorizer
    try:
        vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            min_df=1,
            max_df=0.95,
            ngram_range=(1, 2),
            lowercase=True
        )

        tfidf_matrix = vectorizer.fit_transform(texts)
        print(f"   TF-IDF matrix shape: {tfidf_matrix.shape}")
        print(f"   Features: {vectorizer.get_feature_names_out().shape[0]}")

    except Exception as e:
        print(f"[ERROR] TF-IDF training failed: {e}")
        return False

    # Save trained model
    model_dir = Path(__file__).parent.parent / "models"
    model_dir.mkdir(exist_ok=True, parents=True)

    recommender_model = {
        'book_ids': book_ids,
        'tfidf_matrix': tfidf_matrix,
        'vectorizer': vectorizer,
        'trained_at': datetime.utcnow().isoformat(),
        'book_count': len(book_ids)
    }

    # Save recommender.pkl
    model_path = model_dir / "recommender.pkl"
    tfidf_path = model_dir / "tfidf.pkl"

    try:
        with open(model_path, 'wb') as f:
            pickle.dump(recommender_model, f)

        model_size_mb = model_path.stat().st_size / (1024 * 1024)
        print(f"  [OK] Model saved: {model_path.name} ({model_size_mb:.2f} MB)")

        # Save separate tfidf.pkl
        tfidf_data = {
            'vectorizer': vectorizer,
            'tfidf_matrix': tfidf_matrix,
            'book_ids': book_ids,
            'book_count': len(book_ids)
        }
        with open(tfidf_path, 'wb') as f:
            pickle.dump(tfidf_data, f)
        tfidf_size_mb = tfidf_path.stat().st_size / (1024 * 1024)
        print(f"  [OK] TF-IDF saved: {tfidf_path.name} ({tfidf_size_mb:.2f} MB)")

        return True

    except Exception as e:
        print(f"[ERROR] Error saving model: {e}")
        return False


def verify_import(db):
    """Verify successful import with database statistics"""

    total_books = db.query(Book).count()
    total_authors = db.query(Author).count()
    total_genres = db.query(Genre).count()

    print(f"\n[STATS] Database Statistics:")
    print(f"   Books: {total_books}")
    print(f"   Authors: {total_authors}")
    print(f"   Genres: {total_genres}")

    if total_books > 0:
        sample = db.query(Book).first()
        print(f"\n[SAMPLE] Book:")
        print(f"   Title: {sample.title}")
        print(f"   Author: {sample.author.name if sample.author else 'N/A'}")
        print(f"   Genres: {', '.join([g.name for g in sample.genres]) if sample.genres else 'N/A'}")
        print(f"   Year: {sample.year}")
        print(f"   Pages: {sample.pages}")
        print(f"   ISBN: {sample.isbn if sample.isbn else 'N/A'}")
        print(f"   Language: {sample.language}")
        print(f"   Cover URL: {sample.cover_url}")
        print(f"   Description: {sample.description[:80]}..." if sample.description else "   Description: N/A")

    return total_books > 0


def generate_report(df):
    """Generate training report with all required statistics"""
    import time

    print("\n" + "=" * 70)
    print("TRAINING REPORT")
    print("=" * 70)

    print(f"\nTotal books processed: {len(df)}")
    print(f"Unique titles: {df['title'].nunique()}")
    isbn_count = df['isbn'].apply(lambda x: 1 if x and str(x).strip() else 0).sum()
    print(f"Books with ISBN: {isbn_count}")

    year_min = df['publication_year'].min()
    year_max = df['publication_year'].max()
    print(f"Year range: {int(year_min)} - {int(year_max)}")

    all_genres = set()
    for g in df['genre'].dropna():
        for gg in str(g).split('|'):
            all_genres.add(gg.strip())
    print(f"Unique genres: {len(all_genres)}")
    print(f"Genres: {sorted(all_genres)}")


def main():
    """Main import workflow"""

    print("=" * 70)
    print("BOOK RECOMMENDATION SYSTEM - DATASET IMPORT (PHASE 1)")
    print("=" * 70)

    # Handle unicode on Windows
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

    import io

    csv_path = Path(__file__).parent.parent / "dataset" / "books_dataset.csv"

    if not csv_path.exists():
        print(f"\n[ERROR] Dataset not found: {csv_path}")
        print("\nTo create the dataset, run:")
        print("   python process_goodbooks.py")
        return False

    # Load and validate dataset
    df = load_dataset(csv_path)
    if df is None or len(df) == 0:
        return False

    # Generate report
    generate_report(df)

    # Initialize database schema
    print("\n[DB] Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    print("   [OK] Tables ready")

    # Create session
    db = SessionLocal()

    try:
        # Import books
        imported = import_books(df, db)
        if imported == 0:
            print("\n[WARN] No books were imported")
            return False

        # Train TF-IDF model
        if not train_tfidf_model(db):
            print("\n[WARN] TF-IDF model training failed (continuing anyway)")

        # Verify import
        if not verify_import(db):
            return False

        print("\n" + "=" * 70)
        print("[DONE] Dataset imported and model trained")
        print("=" * 70)
        print("\nNext steps:")
        print("  1. Start server: uvicorn backend.app.main:app --reload")
        print("  2. Test API: curl http://localhost:8000/books/")

        return True

    except Exception as e:
        print(f"\n[ERROR] Import failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        db.close()


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
