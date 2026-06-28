import sqlite3
conn = sqlite3.connect('bookrec.db')
cur = conn.cursor()

print('=== COVER URL AUDIT ===')
cur.execute("SELECT COUNT(*) FROM books WHERE cover_url IS NULL OR cover_url=''")
print(f'Missing covers: {cur.fetchone()[0]}')

cur.execute("SELECT COUNT(*) FROM books WHERE cover_url NOT LIKE 'http%' AND cover_url IS NOT NULL AND cover_url != ''")
print(f'Non-http covers: {cur.fetchone()[0]}')

cur.execute("SELECT cover_url FROM books WHERE cover_url LIKE '%gr-assets.com%' LIMIT 5")
print('GR Assets sample:', [r[0] for r in cur.fetchall()])

cur.execute("SELECT cover_url FROM books WHERE cover_url LIKE '%s.gr-assets%' LIMIT 5")
print('Small GR Assets sample:', [r[0] for r in cur.fetchall()])

cur.execute("SELECT cover_url FROM books ORDER BY id LIMIT 10")
print('First 10 covers:')
for r in cur.fetchall():
    print(' ', r[0])

conn.close()
