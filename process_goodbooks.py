"""
Process Goodbooks-10k dataset to generate cleaned dataset
for the Book Recommendation System.
"""
import pandas as pd
import numpy as np
from pathlib import Path
import sys
import time
import re

# Allowed genres mapping (tag name keywords -> our genre name)
ALLOWED_GENRE_KEYWORDS = {
    'technology': 'Technology',
    'computer-science': 'Computer Science',
    'computer': 'Computer Science',
    'cybersecurity': 'Cybersecurity',
    'cyber': 'Cybersecurity',
    'data-science': 'Data Science',
    'data': 'Data Science',
    'artificial-intelligence': 'Artificial Intelligence',
    'ai': 'Artificial Intelligence',
    'machine-learning': 'Artificial Intelligence',
    'business': 'Business',
    'finance': 'Finance',
    'psychology': 'Psychology',
    'productivity': 'Productivity',
    'biography': 'Biography',
    'history': 'History',
    'philosophy': 'Philosophy',
    'science': 'Science',
    'physics': 'Physics',
    'space': 'Space',
    'mystery': 'Mystery',
    'thriller': 'Thriller',
    'adventure': 'Adventure',
    'fantasy': 'Fantasy',
    'education': 'Education',
    'self-help': 'Self Help',
    'leadership': 'Leadership',
    'innovation': 'Innovation',
    'science-fiction': 'Science',
    'sci-fi': 'Science',
}

EXCLUDED_KEYWORDS = [
    'romance', 'adult', 'erotica', 'nsfw', 'explicit',
    'mature', 'dark-romance', 'sex', 'porn', 'spank',
    'billionaire-romance', 'romance', 'love-story',
]

def normalize_tag(tag):
    return tag.lower().replace(' ', '-').replace('_', '-').strip('-')


def match_genres(tag_name):
    tag_lower = tag_name.lower().replace(' ', '-').replace('_', '-').strip('-')
    for exclude in EXCLUDED_KEYWORDS:
        if exclude in tag_lower:
            return []
    matched = []
    for keyword, genre in ALLOWED_GENRE_KEYWORDS.items():
        if keyword == tag_lower or (keyword in tag_lower and len(keyword) > 3):
            matched.append(genre)
        elif tag_lower in keyword:
            matched.append(genre)
    if tag_lower == 'fantasy':
        matched.append('Fantasy')
    if tag_lower == 'mystery':
        matched.append('Mystery')
    if tag_lower == 'thriller':
        matched.append('Thriller')
    if tag_lower == 'adventure':
        matched.append('Adventure')
    if tag_lower == 'fiction' or tag_lower == 'non-fiction' or tag_lower == 'nonfiction':
        return []
    return list(set(matched))


def generate_description(row):
    parts = []
    if pd.notna(row.get('original_title')) and str(row['original_title']).strip():
        parts.append(f'"{str(row["original_title"]).strip()}"')
    else:
        parts.append(f'"{str(row["title"]).strip()}"')
    if pd.notna(row.get('authors')) and str(row['authors']).strip():
        parts.append(f'by {str(row["authors"]).strip()}')
    genre = row.get('genre', '')
    if genre:
        parts.append(f'covers {genre.lower()}')
    year = row.get('original_publication_year', '')
    try:
        y = int(float(year)) if pd.notna(year) and str(year).strip() else None
        if y:
            parts.append(f'published {y}')
    except (ValueError, TypeError):
        pass
    rating = row.get('average_rating', '')
    try:
        r = float(rating) if pd.notna(rating) and str(rating).strip() else None
        if r:
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

    # Map tag IDs to genre names
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

    # Filter book_tags to only valid tags
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

    # Filter to English books only (eng, en-US, en-GB, en-CA)
    eng_codes = ['eng', 'en-US', 'en-GB', 'en-CA', 'en', 'en-us']
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

        # Exclude if contains ANY excluded genre keyword
        title = str(book.get('title', '')).lower()
        title_excluded = any(kw in title for kw in ['romance', 'erotica', 'adult fiction', 'nsfw'])
        if title_excluded:
            skipped_excluded += 1
            continue

        isbn_val = str(book.get('isbn', '')).strip()
        if isbn_val == 'nan' or not isbn_val:
            isbn_val = ''

        year_val = book.get('original_publication_year', np.nan)
        try:
            year_int = int(year_val) if pd.notna(year_val) else 0
        except (ValueError, TypeError):
            year_int = 0

        # Use original_title or title
        title_val = str(book.get('original_title', ''))
        if not title_val or title_val == 'nan':
            title_val = str(book.get('title', ''))

        author = str(book.get('authors', '')).strip()
        if not author or author == 'nan':
            author = 'Unknown'

        genre_str = '|'.join(sorted(genres))

        rating = book.get('average_rating', 0)
        rating_str = f'{rating:.2f}' if pd.notna(rating) else '0.00'

        temp_row = {
            'title': title_val,
            'author': author,
            'original_title': str(book.get('original_title', '')),
            'average_rating': rating_str,
            'genre': genre_str,
        }
        desc = generate_description(temp_row)

        rows.append({
            'title': title_val,
            'author': author,
            'isbn': isbn_val,
            'genres': genre_str,
            'description': desc,
            'year': year_int,
            'pages': 0,
            'language': 'English',
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

    # Keep only required columns
    result_df = result_df[['title', 'author', 'isbn', 'genres', 'description', 'year', 'pages', 'language']]

    # Sort by year descending
    result_df = result_df.sort_values('year', ascending=False).reset_index(drop=True)

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
    print(f'\n📊 Dataset Statistics:')
    print(f'   Total books: {len(result_df)}')
    print(f'   Unique titles: {result_df["title"].nunique()}')
    isbn_count = result_df['isbn'].apply(lambda x: 1 if x and x.strip() else 0).sum()
    print(f'   Books with ISBN: {isbn_count}')
    print(f'   Unique ISBNs: {result_df[result_df["isbn"] != ""]["isbn"].nunique()}')
    print(f'   Year range: {int(result_df["year"].min())} - {int(result_df["year"].max())}')

    all_genres = set()
    for g in result_df['genres'].dropna():
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
