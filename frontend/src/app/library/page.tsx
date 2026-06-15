'use client';
import { useAppStore } from '../../lib/zustandStore';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Layers, Bookmark, BookOpen, CheckCircle2, Heart, Plus, Minus, Settings2, Trash2 } from 'lucide-react';

export default function Library() {
  const { user, token, library, updateLibraryEntry, removeFromLibrary } = useAppStore();
  const [activeShelf, setActiveShelf] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLibrary();
    }
  }, [user]);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/libraries/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Update Zustand store with library data
        data.forEach((entry: any) => {
          updateLibraryEntry(entry.book_id, entry);
        });
      }
    } catch (error) {
      console.error('Error loading library:', error);
    } finally {
      setLoading(false);
    }
  };

  const shelves = [
    { name: 'All', icon: <Layers size={15} /> },
    { name: 'Want to Read', icon: <Bookmark size={15} /> },
    { name: 'Currently Reading', icon: <BookOpen size={15} /> },
    { name: 'Completed', icon: <CheckCircle2 size={15} /> },
    { name: 'Favorites', icon: <Heart size={15} /> }
  ];

  const filteredEntries = activeShelf === 'All' 
    ? library 
    : library.filter(e => e.shelf === activeShelf);

  const handleShelfChange = async (bookId: number, nextShelf: string) => {
    try {
      const response = await fetch(`http://localhost:8000/libraries/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ book_id: bookId, shelf: nextShelf }),
      });
      if (response.ok) {
        updateLibraryEntry(bookId, { shelf: nextShelf });
      }
    } catch (error) {
      console.error('Error updating shelf:', error);
    }
  };

  const handleProgressChange = async (bookId: number, progress: number) => {
    try {
      const response = await fetch(`http://localhost:8000/libraries/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ book_id: bookId, progress }),
      });
      if (response.ok) {
        updateLibraryEntry(bookId, { progress });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleRemove = async (bookId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/libraries/${bookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        removeFromLibrary(bookId);
      }
    } catch (error) {
      console.error('Error removing from library:', error);
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#6A1B29', marginBottom: '20px' }}>
          Please sign in to view your library
        </h2>
        <Link href="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '36px' }} className="fade-in">
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2.6rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', margin: 0 }}>
          My Personal Library
        </h1>
        <p style={{ color: '#8A827A', marginTop: '6px', fontSize: '0.95rem', fontWeight: 500 }}>
          Organize your bookshelves, track reading progress, and add review ratings.
        </p>
      </div>

      {/* Shelves Selector Tab bar */}
      <div 
        className="shelves-container"
        style={{ 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto', 
          paddingBottom: '12px', 
          borderBottom: '1px solid #E8E2D9' 
        }}
      >
        {shelves.map(s => {
          const count = s.name === 'All' ? library.length : library.filter(e => e.shelf === s.name).length;
          const isActive = activeShelf === s.name;
          return (
            <button
              key={s.name}
              onClick={() => setActiveShelf(s.name)}
              className={isActive ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                border: isActive ? 'none' : '2px solid #E8E2D9',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem'
              }}
            >
              {s.icon}
              <span>{s.name}</span>
              {count > 0 && (
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                  color: isActive ? 'white' : '#6A1B29',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Books grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>Loading library...</div>
      ) : filteredEntries.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
          {filteredEntries.map(entry => (
            <div key={entry.book_id} className="card" style={{ padding: '24px', display: 'flex', gap: '18px', position: 'relative' }}>
              
              {/* Cover */}
              <Link href={`/catalog/${entry.book_id}`} style={{ display: 'block', width: '95px', flexShrink: 0 }}>
                <img 
                  src={entry.book?.cover || '/placeholder-cover.png'} 
                  alt={entry.book?.title || 'Book'} 
                  className="book-cover" 
                  style={{ width: '100%', height: '140px', borderRadius: '10px', objectFit: 'cover', background: '#E8E2D9' }} 
                />
              </Link>

              {/* Info */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <h3 style={{ 
                    fontSize: '1.05rem', 
                    margin: 0, 
                    color: '#1E1B18', 
                    display: '-webkit-box', 
                    WebkitLineClamp: 1, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden',
                    fontFamily: 'Playfair Display, serif',
                    fontWeight: 700
                  }}>
                    <Link href={`/catalog/${entry.book_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {entry.book?.title || 'Unknown Title'}
                    </Link>
                  </h3>
                  <button 
                    onClick={() => handleRemove(entry.book_id)} 
                    style={{ background: 'none', border: 'none', color: '#8A827A', cursor: 'pointer', padding: '2px', transition: 'color 0.3s' }}
                    title="Remove from library"
                    onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8A827A'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <p style={{ margin: 0, color: '#8A827A', fontSize: '0.82rem', fontWeight: 500 }}>{entry.book?.author || 'Unknown Author'}</p>

                {/* Progress bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', margin: '6px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#4A4540' }}>
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
                        handleProgressChange(entry.book_id, next);
                      }}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '2px', height: 'auto' }}
                      title="Decrease progress by 10%"
                    >
                      <Minus size={10} />
                      <span>10%</span>
                    </button>
                    <button 
                      onClick={() => {
                        const next = Math.min(100, entry.progress + 10);
                        handleProgressChange(entry.book_id, next);
                      }}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '2px', height: 'auto' }}
                      title="Increase progress by 10%"
                    >
                      <Plus size={10} />
                      <span>10%</span>
                    </button>
                  </div>
                </div>

                {/* Rating */}
                <div style={{ margin: '2px 0 6px 0' }}>
                  {entry.rating > 0 ? (
                    <div style={{ display: 'flex', gap: '2px', color: '#D4AF37', fontSize: '0.85rem' }}>
                      {'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#8A827A', fontStyle: 'italic', fontWeight: 500 }}>Unrated</span>
                  )}
                </div>

                {/* Shelf switcher / Manage button */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <select
                      value={entry.shelf}
                      onChange={e => handleShelfChange(entry.book_id, e.target.value)}
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '5px 10px', 
                        borderRadius: '8px', 
                        background: '#FFFFFF', 
                        border: '1px solid #E8E2D9', 
                        cursor: 'pointer', 
                        color: '#4A4540',
                        fontWeight: 600,
                        outline: 'none'
                      }}
                    >
                      <option value="Want to Read">Want to Read</option>
                      <option value="Currently Reading">Currently Reading</option>
                      <option value="Completed">Completed</option>
                      <option value="Favorites">Favorites</option>
                    </select>
                  </div>

                  <Link 
                    href={`/catalog/${entry.book_id}?manage=true`}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      fontSize: '0.75rem', 
                      color: '#6A1B29', 
                      textDecoration: 'none', 
                      fontWeight: 700 
                    }}
                  >
                    <Settings2 size={13} />
                    <span>Manage</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '80px 20px', border: '1px solid #E8E2D9', borderRadius: '24px', background: '#F5EFEB' }}>
          <div style={{ 
            background: '#FFFFFF', 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 20px auto'
          }}>
            <Bookmark size={32} style={{ color: '#6A1B29' }} />
          </div>
          <h3 style={{ fontSize: '1.4rem', color: '#1E1B18', margin: '0 0 8px 0', fontFamily: 'Playfair Display, serif', fontWeight: 800 }}>
            Your Shelf is Empty
          </h3>
          <p style={{ color: '#8A827A', margin: '0 0 28px 0', fontSize: '0.92rem', fontWeight: 500 }}>
            Start building your collection by browsing the catalog or checking recommended feeds.
          </p>
          <Link href="/catalog" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>Explore Book Catalog</span>
          </Link>
        </div>
      )}

    </div>
  );
}
