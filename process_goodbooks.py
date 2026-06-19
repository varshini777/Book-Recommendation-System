"""
Process Goodbooks-10k dataset to generate cleaned dataset
for the Book Recommendation System.
Uses real book data from the Goodbooks-10k dataset.
No fake books, no synthetic data.
"""
import pandas as pd
import numpy as np
from pathlib import Path
import sys
import time

ALLOWED_GENRE_KEYWORDS = {
    'technology': 'Technology',
    'computer-science': 'Computer Science',
    'computer': 'Computer Science',
    'computers': 'Technology',
    'programming': 'Technology',
    'software': 'Technology',
    'cybersecurity': 'Cybersecurity',
    'cyber': 'Cybersecurity',
    'security': 'Cybersecurity',
    'data-science': 'Data Science',
    'data': 'Data Science',
    'datasets': 'Data Science',
    'artificial-intelligence': 'Artificial Intelligence',
    'ai': 'Artificial Intelligence',
    'machine-learning': 'Artificial Intelligence',
    'neural-networks': 'Artificial Intelligence',
    'deep-learning': 'Artificial Intelligence',
    'algorithms': 'Computer Science',
    'coding': 'Technology',
    'business': 'Business',
    'entrepreneurship': 'Business',
    'management': 'Business',
    'economics': 'Business',
    'finance': 'Finance',
    'investing': 'Finance',
    'money': 'Finance',
    'psychology': 'Psychology',
    'behavioral-psychology': 'Psychology',
    'cognitive-psychology': 'Psychology',
    'social-psychology': 'Psychology',
    'neuroscience': 'Science',
    'productivity': 'Productivity',
    'self-management': 'Productivity',
    'biography': 'Biography',
    'memoir': 'Biography',
    'autobiography': 'Biography',
    'history': 'History',
    'historical': 'History',
    'philosophy': 'Philosophy',
    'science': 'Science',
    'scientific': 'Science',
    'physics': 'Physics',
    'space': 'Space',
    'astronomy': 'Space',
    'cosmology': 'Space',
    'mystery': 'Mystery',
    'crime': 'Mystery',
    'detective': 'Mystery',
    'noir': 'Mystery',
    'suspense': 'Thriller',
    'thriller': 'Thriller',
    'psychological-thriller': 'Thriller',
    'adventure': 'Adventure',
    'fantasy': 'Fantasy',
    'epic-fantasy': 'Fantasy',
    'urban-fantasy': 'Fantasy',
    'education': 'Education',
    'self-help': 'Self Help',
    'leadership': 'Leadership',
    'innovation': 'Innovation',
    'science-fiction': 'Science',
    'sci-fi': 'Science',
    'fiction': 'Fiction',
}

EXCLUDED_KEYWORDS = [
    'romance', 'adult', 'erotica', 'nsfw', 'explicit',
    'mature', 'dark-romance', 'sex', 'porn', 'spank',
    'billionaire-romance', 'love-story', 'erotic',
    'adult-fiction', 'new-adult', 'paranormal-romance',
    'historical-romance', 'contemporary-romance',
    'young-adult', 'ya', 'teen',
]

FICTION_GENRES = {'Adventure', 'Fantasy', 'Mystery', 'Thriller', 'Science', 'Space', 'Physics'}

def match_genres(tag_name):
    tag_lower = tag_name.lower().replace(' ', '-').replace('_', '-').strip('-')
    for exclude in EXCLUDED_KEYWORDS:
        if exclude in tag_lower:
            return []
    matched = set()
    for keyword, genre in ALLOWED_GENRE_KEYWORDS.items():
        if keyword == tag_lower:
            matched.add(genre)
        elif len(keyword) > 3 and keyword in tag_lower:
            matched.add(genre)
    if tag_lower in ('fiction', 'non-fiction', 'nonfiction', 'literature', 'novels', 'books'):
        return []
    if tag_lower == 'fantasy':
        matched.add('Fantasy')
    if tag_lower == 'mystery':
        matched.add('Mystery')
    if tag_lower == 'thriller':
        matched.add('Thriller')
    if tag_lower == 'adventure':
        matched.add('Adventure')
    return list(matched)


def safe_str(val):
    if pd.isna(val):
        return ''
    s = str(val).strip()
    return '' if s.lower() == 'nan' else s


def generate_description(row):
    parts = []
    title = safe_str(row.get('title', ''))
    author = safe_str(row.get('authors', ''))
    genre = row.get('genre', '')
    year = row.get('original_publication_year', '')
    rating = row.get('average_rating', '')

    if title:
        parts.append(f'"{title}"')
    if author:
        parts.append(f'by {author}')
    if genre:
        parts.append(f'covers {genre.lower()}')
    try:
        y = int(float(year)) if pd.notna(year) and str(year).strip() and str(year).strip().lower() != 'nan' else None
        if y and y > 0:
            parts.append(f'published {y}')
    except (ValueError, TypeError):
        pass
    try:
        r = float(rating) if pd.notna(rating) and str(rating).strip() and str(rating).strip().lower() != 'nan' else None
        if r and r > 0:
            parts.append(f'rated {r:.2f}/5')
    except (ValueError, TypeError):
        pass
    return '. '.join(parts) + '.' if parts else 'A book from the collection.'


def process_goodbooks():
    dataset_dir = Path(__file__).parent / 'dataset'
    output_dir = dataset_dir

    print('=' * 70)
    print('STEP 1: PROCESSING GOODBOOKS-10K DATASET')
    print('=' * 70)

    # Load tags
    print('\nLoading tags.csv...')
    tags_df = pd.read_csv(dataset_dir / 'tags.csv')
    print(f'  Loaded {len(tags_df)} tags')

    tag_to_genre = {}
    for _, row in tags_df.iterrows():
        tag_id = row['tag_id']
        tag_name = str(row['tag_name'])
        genres = match_genres(tag_name)
        if genres:
            tag_to_genre[tag_id] = genres

    valid_tag_ids = set(tag_to_genre.keys())
    print(f'  Found {len(valid_tag_ids)} tag IDs matching allowed genres')

    # Load book_tags
    print('\nLoading book_tags.csv (this may take a moment)...')
    bt_df = pd.read_csv(dataset_dir / 'book_tags.csv')
    print(f'  Loaded {len(bt_df)} book-tag associations')

    bt_filtered = bt_df[bt_df['tag_id'].isin(valid_tag_ids)].copy()
    print(f'  Filtered to {len(bt_filtered)} relevant book-tag associations')

    # Aggregate genres per book
    print('\nAggregating genres per book...')
    book_genres_map = {}
    for _, row in bt_filtered.iterrows():
        gb_id = row['goodreads_book_id']
        genres = tag_to_genre.get(row['tag_id'], [])
        if gb_id not in book_genres_map:
            book_genres_map[gb_id] = set()
        for g in genres:
            book_genres_map[gb_id].add(g)

    print(f'  Found {len(book_genres_map)} books with matching genres')

    # Load goodbooks
    print('\nLoading goodbooks.csv...')
    gb_df = pd.read_csv(dataset_dir / 'goodbooks.csv')
    print(f'  Loaded {len(gb_df)} books')

    # Filter to English books
    eng_codes = ['eng', 'en-US', 'en-GB', 'en-CA', 'en', 'en-us', 'en-ca', 'en-gb']
    gb_df['language_code'] = gb_df['language_code'].fillna('').str.lower().str.strip()
    gb_df = gb_df[gb_df['language_code'].isin(eng_codes) | (gb_df['language_code'] == '')]
    print(f'  After English filter: {len(gb_df)} books')

    # Map genres to books
    print('\nMapping genres from tags to books...')
    rows = []
    skipped_no_genre = 0
    skipped_excluded = 0

    for _, book in gb_df.iterrows():
        gb_id = book['goodreads_book_id']
        genres = book_genres_map.get(gb_id, set())

        if not genres:
            skipped_no_genre += 1
            continue

        # Exclude if title contains excluded keywords
        title = str(book.get('title', '')).lower()
        title_excluded = any(kw in title for kw in ['romance', 'erotica', 'adult fiction', 'nsfw', 'adult'])
        if title_excluded:
            skipped_excluded += 1
            continue

        isbn_val = safe_str(book.get('isbn', ''))
        if not isbn_val:
            isbn_val = ''

        year_val = book.get('original_publication_year', np.nan)
        try:
            year_int = int(float(year_val)) if pd.notna(year_val) and float(year_val) == float(year_val) else 0
        except (ValueError, TypeError):
            year_int = 0

        # Use original_title or title
        original_title = safe_str(book.get('original_title', ''))
        title_val = original_title if original_title else safe_str(book.get('title', 'Unknown'))

        author = safe_str(book.get('authors', 'Unknown'))
        if not author:
            author = 'Unknown'

        # Filter out purely fiction-only books (no non-fiction allowed genre)
        fiction_only = genres.issubset(FICTION_GENRES)
        has_non_fiction_genre = bool(genres - FICTION_GENRES)

        if fiction_only and not has_non_fiction_genre:
            pass  # Keep but note it's fiction

        genre_str = '|'.join(sorted(genres))

        rating = book.get('average_rating', 0.0)
        try:
            rating_val = float(rating) if pd.notna(rating) else 0.0
        except (ValueError, TypeError):
            rating_val = 0.0

        ratings_count = book.get('ratings_count', 0)
        try:
            ratings_count_val = int(float(ratings_count)) if pd.notna(ratings_count) else 0
        except (ValueError, TypeError):
            ratings_count_val = 0

        cover_url_val = book.get('image_url', '')
        if pd.isna(cover_url_val) or not str(cover_url_val).strip():
            cover_url_val = book.get('small_image_url', '')
        if pd.isna(cover_url_val):
            cover_url_val = ''
        cover_url_val = str(cover_url_val).strip()

        rating_str = f'{rating_val:.2f}'

        temp_row = {
            'title': title_val,
            'author': author,
            'authors': author,
            'original_title': original_title,
            'average_rating': rating_str,
            'genre': genre_str,
            'original_publication_year': year_int,
        }
        desc = generate_description(temp_row)

        rows.append({
            'title': title_val,
            'author': author,
            'isbn': isbn_val,
            'genre': genre_str,
            'description': desc,
            'publication_year': year_int,
            'pages': 0,
            'language': 'English',
            'rating': rating_val,
            'rating_count': ratings_count_val,
            'cover_url': cover_url_val,
        })

    print(f'  Books with matching genres: {len(rows)}')
    print(f'  Skipped (no genre match): {skipped_no_genre}')
    print(f'  Skipped (excluded title): {skipped_excluded}')

    # Create DataFrame
    result_df = pd.DataFrame(rows)

    # Remove duplicate titles (keep first occurrence)
    before_dedup = len(result_df)
    result_df = result_df.drop_duplicates(subset=['title'], keep='first')
    print(f'\n  After title dedup: {len(result_df)} (removed {before_dedup - len(result_df)})')

    # Remove duplicate ISBNs (keep first occurrence)
    non_empty_isbn = result_df['isbn'] != ''
    before_dedup = len(result_df)
    result_df_isbn = result_df[non_empty_isbn].drop_duplicates(subset=['isbn'], keep='first')
    result_df_no_isbn = result_df[~non_empty_isbn]
    result_df = pd.concat([result_df_isbn, result_df_no_isbn], ignore_index=True)
    print(f'  After ISBN dedup: {len(result_df)}')

    # Keep only required columns - use user's specified column names
    result_df = result_df[['title', 'author', 'isbn', 'genre', 'description', 'publication_year', 'pages', 'language', 'rating', 'rating_count', 'cover_url']]

    # Sort by publication_year descending
    result_df = result_df.sort_values('publication_year', ascending=False).reset_index(drop=True)

    print(f'\n{"=" * 70}')
    print(f'FINAL DATASET: {len(result_df)} books')
    print(f'{"=" * 70}')

    # Save CSV
    csv_path = output_dir / 'books_dataset.csv'
    result_df.to_csv(csv_path, index=False, encoding='utf-8')
    csv_size = csv_path.stat().st_size
    print(f'\nSaved: {csv_path} ({csv_size:,} bytes)')

    # Save XLSX
    xlsx_path = output_dir / 'books_dataset.xlsx'
    try:
        result_df.to_excel(xlsx_path, index=False, sheet_name='Books', engine='openpyxl')
        xlsx_size = xlsx_path.stat().st_size
        print(f'Saved: {xlsx_path} ({xlsx_size:,} bytes)')
    except Exception as e:
        print(f'XLSX save failed: {e}')

    # Statistics
    print(f'\nDataset Statistics:')
    print(f'   Total books: {len(result_df)}')
    print(f'   Unique titles: {result_df["title"].nunique()}')
    isbn_count = result_df['isbn'].apply(lambda x: 1 if x and x.strip() else 0).sum()
    print(f'   Books with ISBN: {isbn_count}')
    print(f'   Unique ISBNs: {result_df[result_df["isbn"] != ""]["isbn"].nunique()}')
    year_min = result_df['publication_year'].min()
    year_max = result_df['publication_year'].max()
    print(f'   Year range: {int(year_min)} - {int(year_max)}')

    all_genres = set()
    for g in result_df['genre'].dropna():
        for gg in str(g).split('|'):
            all_genres.add(gg.strip())
    print(f'   Unique genres: {len(all_genres)}')
    print(f'   Genres: {sorted(all_genres)}')

    return result_df


if __name__ == '__main__':
    start = time.time()
    df = process_goodbooks()
    elapsed = time.time() - start
    print(f'\nProcessing time: {elapsed:.2f}s')
    print('Dataset processing complete!')
