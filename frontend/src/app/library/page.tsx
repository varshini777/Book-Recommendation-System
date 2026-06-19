'use client';
import { useAppStore } from '../../lib/zustandStore';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Layers, Bookmark, BookOpen, CheckCircle2, Plus, Minus, Trash2, Settings2, Star } from 'lucide-react';
import { isValidCoverUrl } from '@/lib/utils';

function LibraryBookCover({ coverUrl, title }: { coverUrl: string; title: string }) {
  const [failed, setFailed] = useState(false);
  const showImg = isValidCoverUrl(coverUrl) && !failed;

  if (showImg) {
    return (
      <img
        src={coverUrl}
        alt={title}
        className="book-cover"
        style={{ width: '100%', height: '130px', borderRadius: '10px', objectFit: 'cover', background: 'var(--surface)' }}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div style={{
      width: '100%', height: '130px', borderRadius: '10px',
      background: 'linear-gradient(135deg, #6A1B29, #4A101A)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '8px',
    }}>
      <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '0.75rem', color: '#D4AF37', textAlign: 'center', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {title}
      </span>
    </div>
  );
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface LibraryEntryData {
  id: number;
  user_id: number;
  book_id: number;
  status: string;
  is_favorite: boolean;
  is_bookmarked: boolean;
  progress: number;
  rating: number;
  notes: string;
  added_at: string;
  updated_at: string;
  book: {
    id: number;
    title: string;
    author_name: string;
    cover_url: string;
    rating: number;
  };
}

export default function Library() {
  const { user, token, library, loadLibrary, removeFromLibrary, updateLibraryEntry, addToast } = useAppStore();
  const [activeStatus, setActiveStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LibraryEntryData[]>([]);

  useEffect(() => {
    if (user && token) {
      fetchLibrary();
    }
  }, [user, token]);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/libraries/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (e) {
      console.error('Error loading library:', e);
    } finally {
      setLoading(false);
    }
  };

  const shelves = [
    { key: 'all', label: 'All', icon: <Layers size={15} /> },
    { key: 'want_to_read', label: 'Want to Read', icon: <Bookmark size={15} /> },
    { key: 'currently_reading', label: 'Reading', icon: <BookOpen size={15} /> },
    { key: 'completed', label: 'Completed', icon: <CheckCircle2 size={15} /> },
  ];

  const filteredEntries = activeStatus === 'all'
    ? entries
    : entries.filter(e => e.status === activeStatus);

  const handleStatusChange = async (entryId: number, bookId: number, newStatus: string) => {
    try {
      const res = await fetch(`${API}/libraries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setEntries(prev => prev.map(e =>
          e.id === entryId ? { ...e, status: newStatus } : e
        ));
        updateLibraryEntry(bookId, { status: newStatus });
        addToast('Status updated!', 'success');
      }
    } catch (e) {
      addToast('Failed to update', 'error');
    }
  };

  const handleProgressChange = async (entryId: number, bookId: number, progress: number) => {
    try {
      const res = await fetch(`${API}/libraries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ progress }),
      });
      if (res.ok) {
        setEntries(prev => prev.map(e =>
          e.id === entryId ? { ...e, progress } : e
        ));
        updateLibraryEntry(bookId, { progress });
        addToast(`Progress updated to ${progress}%!`, 'success');
      }
    } catch (e) {
      addToast('Failed to update progress', 'error');
    }
  };

  const handleRemove = async (entryId: number, bookId: number) => {
    try {
      const res = await fetch(`${API}/libraries/${entryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== entryId));
        removeFromLibrary(bookId);
        addToast('Book removed from library', 'info');
      }
    } catch (e) {
      addToast('Failed to remove', 'error');
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--burgundy)', marginBottom: '20px' }}>
          Please sign in to view your library
        </h2>
        <Link href="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  const statusLabel = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '36px' }} className="fade-in">
      <div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: 'var(--burgundy)', margin: 0 }}>
          My Library
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '0.95rem', fontWeight: 500 }}>
          Organize your bookshelves and track reading progress.
        </p>
      </div>

      <div className="shelves-container" style={{
        display: 'flex', gap: '8px', overflowX: 'auto',
        paddingBottom: '12px', borderBottom: '1px solid var(--border)',
      }}>
        {shelves.map(s => {
          const count = s.key === 'all' ? entries.length : entries.filter(e => e.status === s.key).length;
          const isActive = activeStatus === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setActiveStatus(s.key)}
              className={isActive ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '10px 20px', borderRadius: '12px',
                fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem',
                transition: 'all 0.3s',
              }}
            >
              {s.icon}
              <span>{s.label}</span>
              {count > 0 && (
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--surface)',
                  color: isActive ? 'white' : 'var(--burgundy)',
                  padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
        </div>
      ) : filteredEntries.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredEntries.map(entry => (
            <div key={entry.id} className="card" style={{ padding: '20px', display: 'flex', gap: '16px' }}>
              <Link href={`/catalog/${entry.book_id}`} style={{ display: 'block', width: '90px', flexShrink: 0 }}>
                <LibraryBookCover coverUrl={entry.book?.cover_url || ''} title={entry.book?.title || 'Book'} />
              </Link>

              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <h3 style={{
                    fontSize: '1rem', margin: 0, color: 'var(--text-primary)',
                    display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    fontFamily: 'Playfair Display, serif', fontWeight: 700,
                  }}>
                    <Link href={`/catalog/${entry.book_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {entry.book?.title || 'Unknown Title'}
                    </Link>
                  </h3>
                  <button onClick={() => handleRemove(entry.id, entry.book_id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', flexShrink: 0 }}
                    title="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>

                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>
                  {entry.book?.author_name || 'Unknown Author'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    <span>Progress</span>
                    <span>{entry.progress}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: '5px' }}>
                    <div className="progress-fill" style={{ width: `${entry.progress}%` }} />
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleProgressChange(entry.id, entry.book_id, Math.max(0, entry.progress - 10))}
                      className="btn-secondary" style={{ padding: '3px 8px', fontSize: '0.68rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '2px', height: 'auto' }}>
                      <Minus size={9} /> 10%
                    </button>
                    <button onClick={() => handleProgressChange(entry.id, entry.book_id, Math.min(100, entry.progress + 10))}
                      className="btn-secondary" style={{ padding: '3px 8px', fontSize: '0.68rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '2px', height: 'auto' }}>
                      <Plus size={9} /> 10%
                    </button>
                  </div>
                </div>

                {entry.rating > 0 && (
                  <div style={{ display: 'flex', gap: '2px', color: '#D4AF37', fontSize: '0.8rem' }}>
                    {'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}
                  </div>
                )}

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <select
                    value={entry.status}
                    onChange={e => handleStatusChange(entry.id, entry.book_id, e.target.value)}
                    style={{
                      fontSize: '0.72rem', padding: '4px 8px', borderRadius: '8px',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, outline: 'none',
                    }}
                  >
                    <option value="want_to_read">Want to Read</option>
                    <option value="currently_reading">Currently Reading</option>
                    <option value="completed">Completed</option>
                  </select>

                  <Link href={`/catalog/${entry.book_id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--burgundy)', textDecoration: 'none', fontWeight: 700 }}>
                    <Settings2 size={12} /> Manage
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '80px 24px', borderRadius: '24px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(106,27,41,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px auto',
          }}>
            <Bookmark size={32} style={{ color: 'var(--burgundy)', opacity: 0.6 }} />
          </div>
          <h3 style={{ fontSize: '1.4rem', margin: '0 0 8px 0', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: 'var(--text-primary)' }}>
            Your Library is Empty
          </h3>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 28px 0', fontSize: '0.92rem', fontWeight: 500 }}>
            Start building your collection by browsing the catalog.
          </p>
          <Link href="/catalog" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Explore Catalog
          </Link>
        </div>
      )}
    </div>
  );
}
