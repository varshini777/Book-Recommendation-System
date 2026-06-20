'use client';
import { useAppStore } from '@/lib/zustandStore';
import BookCard from '@/components/BookCard';
import Link from 'next/link';
import { useState, use, useEffect } from 'react';
import { ArrowLeft, Star, Calendar, FileText, Bookmark, BookOpen, CheckCircle2, Settings, X, AlertTriangle, Info, BarChart3, Layers } from 'lucide-react';
import { isValidCoverUrl } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DisplayBook {
  id: number; title: string; author_name?: string;
  cover_url?: string; genres?: string[];
  rating?: number; rating_count?: number; year?: number; pages?: number; isbn?: string;
  description?: string; language?: string; tags?: string[];
  score?: number; author_id?: number;
}

export default function BookDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, token, library, addToLibrary, removeFromLibrary, loadLibrary, addToast } = useAppStore();

  const [book, setBook] = useState<DisplayBook | null>(null);
  const [similar, setSimilar] = useState<DisplayBook[]>([]);
  const [alsoEnjoyed, setAlsoEnjoyed] = useState<DisplayBook[]>([]);
  const [sameGenre, setSameGenre] = useState<DisplayBook[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('want_to_read');
  const [notes, setNotes] = useState('');
  const [progress, setProgress] = useState(0);
  const [rating, setRating] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => { loadBook(); }, [id]);

  const loadBook = async () => {
    setLoading(true);
    try {
      const [bookRes, similarRes] = await Promise.all([
        fetch(`${API}/books/${id}`),
        fetch(`${API}/recommendations/similar/${id}?limit=6`),
      ]);
      if (bookRes.ok) {
        const data = await bookRes.json();
        setBook(data);

        const [authorRes, alsoRes, genreRes] = await Promise.all([
          data.author_id ? fetch(`${API}/recommendations/similar-author/${data.author_id}?limit=4`) : null,
          fetch(`${API}/recommendations/also-enjoyed/${id}?limit=4`),
          fetch(`${API}/recommendations/same-genre/${id}?limit=6`),
        ]);
        if (authorRes && authorRes.ok) {
          const ad = await authorRes.json();
          setSimilar(ad.books?.filter((b: any) => b.id !== data.id) || []);
        }
        if (alsoRes.ok) {
          const aed = await alsoRes.json();
          setAlsoEnjoyed(aed.books?.filter((b: any) => b.id !== data.id) || []);
        }
        if (genreRes.ok) {
          const gd = await genreRes.json();
          setSameGenre(gd.books?.filter((b: any) => b.id !== data.id) || []);
        }
      }
      if (similarRes.ok) {
        const sd = await similarRes.json();
        if (!book || sd.books?.length > similar.length) {
          setSimilar(sd.books || []);
        }
      }
    } catch (e) { console.error('Error:', e); } finally { setLoading(false); }
  };

  const libraryEntry = library.find(e => e.book_id === Number(id));

  const handleAddToLibrary = async () => {
    if (!token || !book) { addToast('Please sign in first', 'error'); return; }
    await addToLibrary(book, selectedStatus);
    await loadLibrary();
    setProgress(selectedStatus === 'completed' ? 100 : 0);
    setShowConfig(true);
  };

  const handleUpdate = async () => {
    if (!token || !libraryEntry) return;
    try {
      const res = await fetch(`${API}/libraries/${libraryEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          status: selectedStatus,
          progress: Number(progress),
          rating: Number(rating),
          notes,
        }),
      });
      if (res.ok) {
        await loadLibrary();
        addToast('Library entry updated!', 'success');
        setShowConfig(false);
      }
    } catch { addToast('Failed to update', 'error'); }
  };

  const handleRemove = async () => {
    if (!token || !libraryEntry) return;
    await removeFromLibrary(book!.id);
    setShowConfig(false);
    setConfirmDelete(false);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }} className="fade-in">
        <div className="skeleton" style={{ height: 20, width: 150, borderRadius: 8, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 48 }} className="detail-grid">
          <div className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 16 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 40, width: '80%', borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 24, width: '50%', borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }} className="fade-in">
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', marginBottom: 10 }}>Book Not Found</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>The requested book does not exist in our catalog.</p>
        <Link href="/catalog" className="btn-primary">Browse Catalog</Link>
      </div>
    );
  }

  const genres = book.genres || [];
  const cover = book.cover_url || '';
  const author = book.author_name || 'Unknown';
  const ratingVal = book.rating || 0;
  const showCoverImage = isValidCoverUrl(cover) && !coverFailed;

  const displayStars = Array(5).fill(0).map((_, i) => {
    if (i < Math.floor(ratingVal)) return 'fill';
    if (i === Math.floor(ratingVal) && ratingVal - Math.floor(ratingVal) >= 0.3) return 'half';
    return 'empty';
  });

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 48 }} className="fade-in">
      <Link href="/catalog" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.92rem' }}>
        <ArrowLeft size={16} /><span>Back to Catalog</span>
      </Link>

      <div className="card" style={{ padding: 48, display: 'grid', gridTemplateColumns: '380px 1fr', gap: 48 }} className="card detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ width: '100%', maxWidth: 320, position: 'relative' }}>
            {showCoverImage ? (
              <img src={cover} alt={book.title}
                style={{ width: '100%', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '20px 20px 40px rgba(0,0,0,0.15)', background: 'var(--surface)', minHeight: 400, objectFit: 'cover' }}
                onError={() => setCoverFailed(true)} />
            ) : (
              <div style={{
                width: '100%', minHeight: 400, borderRadius: 16,
                background: 'linear-gradient(135deg, #6A1B29, #4A101A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24,
              }}>
                <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: '#D4AF37', textAlign: 'center', fontWeight: 700 }}>{book.title}</span>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{author}</span>
                {genres[0] && (
                  <span style={{
                    fontSize: '0.72rem',
                    color: '#D4AF37',
                    border: '1px solid rgba(212, 175, 55, 0.4)',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginTop: '8px'
                  }}>
                    {genres[0]}
                  </span>
                )}
              </div>
            )}
          </div>

          {libraryEntry ? (
            <div style={{ width: '100%', padding: 20, borderRadius: 16, border: '1.5px dashed var(--burgundy)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--burgundy)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} /> In Your Library
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Status: <strong style={{ color: 'var(--text-primary)' }}>{libraryEntry.status.replace(/_/g, ' ')}</strong>
              </p>
              {libraryEntry.progress > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <span>Progress</span><span>{libraryEntry.progress}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-fill" style={{ width: `${libraryEntry.progress}%` }} />
                  </div>
                </div>
              )}
              {libraryEntry.rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Your Rating:</span>
                  <span style={{ color: '#D4AF37' }}>{Array(5).fill(0).map((_, i) => i < libraryEntry.rating ? '★' : '☆').join('')}</span>
                </div>
              )}
              <button onClick={() => {
                setSelectedStatus(libraryEntry.status);
                setProgress(libraryEntry.progress);
                setRating(libraryEntry.rating);
                setNotes(libraryEntry.notes || '');
                setShowConfig(true);
              }} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem', justifyContent: 'center', borderRadius: 10 }}>
                <Settings size={14} /> Manage
              </button>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}><Bookmark size={14} /> Add to Library</label>
              <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="input-field" style={{ cursor: 'pointer', padding: '10px 14px' }}>
                <option value="want_to_read">Want to Read</option>
                <option value="currently_reading">Currently Reading</option>
                <option value="completed">Completed</option>
              </select>
              <button onClick={handleAddToLibrary} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 24px', borderRadius: 12 }}>
                <Bookmark size={16} /> Add to Library
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {genres.map((g: string) => <span key={g} className="badge">{g}</span>)}
            {book.language && <span className="badge" style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>{book.language}</span>}
          </div>

          <div>
            <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontFamily: 'Playfair Display, serif', fontWeight: 800, margin: '0 0 10px 0', lineHeight: 1.2, color: 'var(--text-primary)' }}>
              {book.title}
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
              by <span style={{ color: 'var(--burgundy)', fontWeight: 600 }}>{author}</span>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', gap: 2 }}>{displayStars.map((s, i) => (
              <Star key={i} size={20} fill={s !== 'empty' ? '#D4AF37' : 'none'}
                color={s === 'empty' ? 'var(--border)' : '#D4AF37'} />
            ))}</div>
            <strong style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{ratingVal.toFixed(1)}</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>/ 5</span>
            {book.rating_count ? <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({book.rating_count} ratings)</span> : null}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '20px 0' }}>
            {[
              { icon: Star, label: 'Rating', value: ratingVal.toFixed(1) },
              { icon: FileText, label: 'Pages', value: book.pages || 'N/A' },
              { icon: Calendar, label: 'Published', value: book.year || 'N/A' },
              { icon: Info, label: 'ISBN', value: book.isbn || 'N/A' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.04em' }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <s.icon size={14} style={{ color: 'var(--text-muted)' }} />
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{s.value}</strong>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Synopsis</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
              {book.description || 'No description available.'}
            </p>
          </div>

          {book.tags && book.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {book.tags.map((t: string) => (
                <span key={t} style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface)', padding: '5px 12px', borderRadius: 6 }}>#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {showConfig && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(3,7,18,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ padding: 36, maxWidth: 520, width: '90%', display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'Playfair Display, serif', margin: 0, fontWeight: 800, color: 'var(--burgundy)' }}>Manage Entry</h3>
              <button onClick={() => setShowConfig(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Status</label>
              <select value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value); if (e.target.value === 'completed') setProgress(100); }} className="input-field">
                <option value="want_to_read">Want to Read</option>
                <option value="currently_reading">Currently Reading</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                <span>Progress</span><span style={{ color: 'var(--burgundy)' }}>{progress}%</span>
              </label>
              <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--burgundy)', cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Your Rating</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setRating(s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: s <= rating ? '#D4AF37' : 'var(--border)', padding: 2 }}>
                    <Star size={28} fill={s <= rating ? '#D4AF37' : 'none'} stroke={s <= rating ? '#D4AF37' : 'var(--text-muted)'} />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Notes</label>
              <textarea placeholder="Your thoughts on this book..." value={notes} onChange={e => setNotes(e.target.value)}
                className="input-field" style={{ minHeight: 80, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
              {!confirmDelete ? (
                <>
                  <button onClick={handleUpdate} className="btn-primary" style={{ flex: 1, justifyContent: 'center', borderRadius: 12 }}>Save</button>
                  <button onClick={() => setConfirmDelete(true)} className="btn-secondary" style={{ borderColor: '#dc2626', color: '#dc2626', flex: 1, justifyContent: 'center', borderRadius: 12 }}>Remove</button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }} className="fade-in">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#dc2626', justifyContent: 'center' }}>
                    <AlertTriangle size={16} /><span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Remove this book?</span>
                  </div>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <button onClick={handleRemove} className="btn-primary" style={{ background: '#dc2626', flex: 1, justifyContent: 'center', borderRadius: 12 }}>Yes</button>
                    <button onClick={() => setConfirmDelete(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', borderRadius: 12 }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {similar.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6A1B29, #8B263E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={18} color="white" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, margin: 0 }}>Similar Books</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {similar.map((b: any) => <BookCard key={b.id} book={b} />)}
          </div>
        </section>
      )}

      {alsoEnjoyed.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #1A237E, #283593)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} color="white" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, margin: 0 }}>Readers Also Enjoyed</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {alsoEnjoyed.map((b: any) => <BookCard key={b.id} book={b} />)}
          </div>
        </section>
      )}

      {sameGenre.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #2E7D32, #388E3C)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} color="white" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, margin: 0 }}>More in {genres[0] || 'This Genre'}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {sameGenre.map((b: any) => <BookCard key={b.id} book={b} />)}
          </div>
        </section>
      )}

      <style>{`@media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
