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
    "Education", "Self Help",
}

# Local placeholder cover URL
PLACEHOLDER_COVER_URL = "/public/covers/placeholder.svg"


def load_dataset(csv_path):
    """Load and validate dataset from CSV"""
    try:
        df = pd.read_csv(csv_path, dtype=str)
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
        return None
    
    print(f"📊 Loaded {len(df)} rows from {csv_path.name}")
    
    # Validate required columns
    required_cols = ['title', 'author', 'genres', 'description', 'year', 'pages', 'language']
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        print(f"❌ Missing columns in CSV: {missing}")
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
    Uses verified field names from Book model:
    - title (String(500), required)
    - author_id (Integer FK, required)
    - cover_url (String(500), optional)
    - language (String(50), default='English')
    - year (Integer, optional)
    - pages (Integer, optional)
    - isbn (String(20), unique, optional)
    - rating (Float, default=0.0)
    - rating_count (Integer, default=0)
    - description (Text, optional)
    - tags (JSON, optional)
    - is_active (Boolean, default=True)
    """
    
    print("📚 Importing books (preserving existing user data)...")
    
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
            genres_str = str(row.get('genres', '')).strip()
            language = str(row.get('language', 'English')).strip()
            
            # Parse year (convert to int)
            try:
                year = int(row['year']) if pd.notna(row['year']) and str(row['year']).strip() else None
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
                # Skip if no valid genres
                skipped += 1
                continue
            
            # Get or create author (Book.author_id FK)
            if author_name not in author_cache:
                author = db.query(Author).filter(Author.name == author_name).first()
                if not author:
                    author = Author(name=author_name)
                    db.add(author)
                    db.flush()  # Flush to get author.id
                author_cache[author_name] = author
            else:
                author = author_cache[author_name]
            
            # Create Book with verified field names
            book = Book(
                title=title,              # String(500), required
                author_id=author.id,      # Integer FK, required
                isbn=isbn if isbn else None,  # String(20), unique, optional
                cover_url=PLACEHOLDER_COVER_URL,  # String(500), optional (local path)
                language=language,        # String(50), default='English'
                year=year,                # Integer, optional
                pages=pages,              # Integer, optional
                description=description,  # Text, optional
                tags=None,                # JSON, optional (not set from CSV)
                rating=0.0,               # Float, default=0.0
                rating_count=0,           # Integer, default=0
                is_active=True,           # Boolean, default=True
                created_at=datetime.utcnow(),  # Auto
                updated_at=datetime.utcnow()   # Auto
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
                
                # Add to book's genres relationship
                book.genres.append(genre)
            
            # Add book to session
            db.add(book)
            imported += 1
            
            # Batch commit every 500 rows for performance
            if (idx + 1) % 500 == 0:
                db.commit()
                print(f"  ✓ Processed {idx + 1} rows ({imported} imported, {duplicates} skipped duplicates, {skipped} invalid)")
        
        except Exception as e:
            print(f"  ⚠ Row {idx + 1}: {str(e)[:100]}")
            skipped += 1
            db.rollback()  # Rollback failed row
            continue
    
    # Final commit
    try:
        db.commit()
    except Exception as e:
        print(f"❌ Final commit failed: {e}")
        db.rollback()
        return 0
    
    print(f"\n✓ Import complete:")
    print(f"   Books imported: {imported}")
    print(f"   Duplicates skipped: {duplicates}")
    print(f"   Invalid rows: {skipped}")
    
    return imported


def train_tfidf_model(db):
    """Train TF-IDF model on imported books for content-based recommendations"""
    
    print("\n🤖 Training TF-IDF recommendation model...")
    
    # Fetch all books from database
    books = db.query(Book).all()
    
    if len(books) < 10:
        print(f"⚠ Too few books ({len(books)}) for meaningful TF-IDF model")
        return False
    
    # Create text corpus from book metadata
    texts = []
    book_ids = []
    
    for book in books:
        # Combine: title + description + genres for semantic similarity matching
        genres_text = " ".join([g.name for g in book.genres]) if book.genres else ""
        author_text = book.author.name if book.author else ""
        
        # Create comprehensive text for TF-IDF
        text = f"{book.title} {author_text} {book.description} {genres_text}".strip()
        texts.append(text)
        book_ids.append(book.id)
    
    print(f"   Corpus size: {len(texts)} books")
    
    # Train TF-IDF vectorizer
    try:
        vectorizer = TfidfVectorizer(
            max_features=5000,         # Limit to 5000 features
            stop_words='english',      # Remove common English words
            min_df=1,                  # Words appearing in at least 1 document
            max_df=0.95,               # Words appearing in at most 95% of documents
            ngram_range=(1, 2),        # Unigrams and bigrams
            lowercase=True
        )
        
        # Fit and transform corpus
        tfidf_matrix = vectorizer.fit_transform(texts)
        print(f"   TF-IDF matrix shape: {tfidf_matrix.shape}")
        print(f"   Features: {vectorizer.get_feature_names_out().shape[0]}")
    
    except Exception as e:
        print(f"❌ TF-IDF training failed: {e}")
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
    
    model_path = model_dir / "recommender.pkl"
    
    try:
        with open(model_path, 'wb') as f:
            pickle.dump(recommender_model, f)
        
        model_size_mb = model_path.stat().st_size / (1024 * 1024)
        print(f"✓ Model saved: {model_path.name} ({model_size_mb:.2f} MB)")
        return True
    
    except Exception as e:
        print(f"❌ Error saving model: {e}")
        return False


def verify_import(db):
    """Verify successful import with database statistics"""
    
    total_books = db.query(Book).count()
    total_authors = db.query(Author).count()
    total_genres = db.query(Genre).count()
    
    print(f"\n📊 Database Statistics:")
    print(f"   Books: {total_books}")
    print(f"   Authors: {total_authors}")
    print(f"   Genres: {total_genres}")
    
    if total_books > 0:
        # Show sample book with all fields
        sample = db.query(Book).first()
        print(f"\n📖 Sample Book:")
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


def main():
    """Main import workflow"""
    
    print("=" * 70)
    print("📚 BOOK RECOMMENDATION SYSTEM - DATASET IMPORT (PHASE 1)")
    print("=" * 70)
    
    # Find dataset file
    csv_path = Path(__file__).parent.parent / "dataset" / "books_dataset.csv"
    
    if not csv_path.exists():
        print(f"\n❌ Dataset not found: {csv_path}")
        print("\nTo create the dataset, run:")
        print("   python backend/create_dataset.py")
        return False
    
    # Load and validate dataset
    df = load_dataset(csv_path)
    if df is None or len(df) == 0:
        return False
    
    # Initialize database schema
    print("\n🔧 Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    print("   ✓ Tables created (or already exist)")
    
    # Create session
    db = SessionLocal()
    
    try:
        # Import books
        imported = import_books(df, db)
        if imported == 0:
            print("\n⚠ No books were imported")
            return False
        
        # Train TF-IDF model
        if not train_tfidf_model(db):
            print("\n⚠ TF-IDF model training failed (continuing anyway)")
        
        # Verify import
        if not verify_import(db):
            return False
        
        print("\n" + "=" * 70)
        print("✅ PHASE 1 COMPLETE - Dataset imported and model trained")
        print("=" * 70)
        print("\nNext steps:")
        print("  1. Start FastAPI server: uvicorn app.main:app --reload")
        print("  2. Test API: curl http://localhost:8000/books/")
        print("  3. Proceed to PHASE 2")
        
        return True
    
    except Exception as e:
        print(f"\n❌ Import failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        db.close()


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
