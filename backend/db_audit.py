import sqlite3

for db in ['litrealm.db', 'bookrec.db']:
    print(f'\n=== DATABASE: {db} ===')
    try:
        conn = sqlite3.connect(db)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [t[0] for t in cur.fetchall()]
        print(f'Tables: {tables}')
        
        if 'books' in tables:
            cur.execute("PRAGMA table_info(books)")
            cols = cur.fetchall()
            print('books columns:', [c[1] for c in cols])
            
            cur.execute("SELECT language, COUNT(*) as cnt FROM books GROUP BY language ORDER BY cnt DESC")
            rows = cur.fetchall()
            print(f'\nLanguage Distribution:')
            print(f'{"Language":<25} {"Count":>8}')
            print('-' * 35)
            total = 0
            for lang, cnt in rows:
                print(f'{str(lang):<25} {cnt:>8}')
                total += cnt
            print(f'{"TOTAL":<25} {total:>8}')
            
            cur.execute("SELECT COUNT(*) FROM books")
            total_books = cur.fetchone()[0]
            print(f'\nTotal books in DB: {total_books}')
            
            cur.execute("SELECT language FROM books LIMIT 10")
            samples = cur.fetchall()
            print(f'\nSample language values: {[s[0] for s in samples]}')
        else:
            print('No books table found')
        
        conn.close()
    except Exception as e:
        print(f'Error: {e}')
