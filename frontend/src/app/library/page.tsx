'use client';
import { useApp } from '../../lib/store';
import Link from 'next/link';
import { useState } from 'react';

export default function Library() {
  const { library, updateEntry } = useApp();
  const [activeShelf, setActiveShelf] = useState('All');

  const shelves = ['All', 'Want to Read', 'Currently Reading', 'Completed', 'Favorites'];

  const filteredEntries = activeShelf === 'All' 
    ? library 
    : library.filter(e => e.shelf === activeShelf);

  const handleShelfChange = (bookId: number, nextShelf: string) => {
    updateEntry(bookId, { shelf: nextShelf });
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="fade-in">
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: 'var(--burgundy)', margin: 0 }}>
          My Personal Library
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
          Organize your bookshelves, track reading progress, and add review ratings.
        </p>
      </div>

      {/* Shelves Selector Tab bar */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
        {shelves.map(s => {
          const count = s === 'All' ? library.length : library.filter(e => e.shelf === s).length;
          return (
            <button
              key={s}
              onClick={() => setActiveShelf(s)}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                background: activeShelf === s ? 'var(--burgundy)' : 'transparent',
                color: activeShelf === s ? 'white' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {s} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Books grid */}
      {filteredEntries.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {filteredEntries.map(entry => (
            <div key={entry.book.id} className="card" style={{ padding: '20px', display: 'flex', gap: '16px', position: 'relative' }}>
              {/* Cover */}
              <Link href={`/catalog/${entry.book.id}`} style={{ display: 'block', width: '90px', flexShrink: 0 }}>
                <img 
                  src={entry.book.cover} 
                  alt={entry.book.title} 
                  className="book-cover" 
                  style={{ width: '100%', height: '130px', borderRadius: '8px' }} 
                />
              </Link>

              {/* Info */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px', minWidth: 0 }}>
                <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  <Link href={`/catalog/${entry.book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {entry.book.title}
                  </Link>
                </h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{entry.book.author}</p>

                {/* Progress bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Reading Progress</span>
                    <span>{entry.progress}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: '6px' }}>
                    <div className="progress-fill" style={{ width: `${entry.progress}%` }}></div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                    <button 
                      onClick={() => {
                        const next = Math.max(0, entry.progress - 10);
                        updateEntry(entry.book.id, { progress: next });
                      }}
                      style={{ background: 'var(--surface)', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                      title="Decrease progress by 10%"
                    >
                      -10%
                    </button>
                    <button 
                      onClick={() => {
                        const next = Math.min(100, entry.progress + 10);
                        updateEntry(entry.book.id, { progress: next });
                      }}
                      style={{ background: 'var(--surface)', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
                      title="Increase progress by 10%"
                    >
                      +10%
                    </button>
                  </div>
                </div>

                {/* Rating */}
                {entry.rating > 0 ? (
                  <div style={{ display: 'flex', gap: '2px', color: 'var(--gold)', fontSize: '0.85rem' }}>
                    {'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Unrated</span>
                )}

                {/* Shelf switcher */}
                <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Move to:</span>
                  <select
                    value={entry.shelf}
                    onChange={e => handleShelfChange(entry.book.id, e.target.value)}
                    style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    <option value="Want to Read">Want to Read</option>
                    <option value="Currently Reading">Currently Reading</option>
                    <option value="Completed">Completed</option>
                    <option value="Favorites">Favorites</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <span style={{ fontSize: '3rem' }}>📖</span>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: '16px 0 8px 0', fontFamily: 'Playfair Display, serif' }}>
            Your Shelf is Empty
          </h3>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
            Start building your collection by browsing the catalog or checking recommended feeds.
          </p>
          <Link href="/catalog" className="btn-primary">
            Explore Book Catalog
          </Link>
        </div>
      )}

    </div>
  );
}
