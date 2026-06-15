'use client';
import { useAppStore } from '../../../lib/zustandStore';
import BookCard from '../../../components/BookCard';
import Link from 'next/link';
import { useState, use, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Settings, Star, X, Calendar, FileText, Bookmark, BookOpen, AlertTriangle } from 'lucide-react';
import { BOOKS, Book } from '../../../lib/data';

type DisplayBook = Book & {
  author_name?: string;
  cover_url?: string;
  genres?: string[];
  score?: number;
};

export default function BookDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, token, library, addToLibrary, updateLibraryEntry, removeFromLibrary } = useAppStore();
  
  const [book, setBook] = useState<DisplayBook | null>(null);
  const [similar, setSimilar] = useState<DisplayBook[]>([]);
  const [selectedShelf, setSelectedShelf] = useState('Want to Read');
  const [notes, setNotes] = useState('');
  const [progress, setProgress] = useState(0);
  const [rating, setRating] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBook();
    loadSimilarBooks();
  }, [id]);

  const loadBook = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/books/${id}`);
      if (response.ok) {
        const data = await response.json();
        setBook(data);
      } else {
        setBook(BOOKS.find(book => book.id === Number(id)) || null);
      }
    } catch (error) {
      console.error('Error loading book:', error);
      setBook(BOOKS.find(book => book.id === Number(id)) || null);
    } finally {
      setLoading(false);
    }
  };

  const loadSimilarBooks = async () => {
    try {
      const response = await fetch(`http://localhost:8000/recommendations/similar/${id}?limit=4`);
      if (response.ok) {
        const data = await response.json();
        const books = Array.isArray(data) ? data : data.books || [];
        setSimilar(books.length > 0 ? books : BOOKS.filter(book => book.id !== Number(id)).slice(0, 4));
      } else {
        setSimilar(BOOKS.filter(book => book.id !== Number(id)).slice(0, 4));
      }
    } catch (error) {
      console.error('Error loading similar books:', error);
      setSimilar(BOOKS.filter(book => book.id !== Number(id)).slice(0, 4));
    }
  };

  const libraryEntry = library.find(e => e.book_id === Number(id));

  useEffect(() => {
    if (typeof window !== 'undefined' && libraryEntry) {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('manage') === 'true') {
        setSelectedShelf(libraryEntry.shelf);
        setProgress(libraryEntry.progress);
        setRating(libraryEntry.rating);
        setNotes(libraryEntry.notes || '');
        setShowConfig(true);
      }
    }
  }, [libraryEntry]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>Loading book details...</div>
    );
  }

  if (!book) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', background: '#FCFAF6', minHeight: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', marginBottom: '10px' }}>Book Not Found</h1>
        <p style={{ color: '#8A827A', marginBottom: '20px' }}>The requested book ID does not exist in our catalog.</p>
        <Link href="/catalog" className="btn-primary">Back to Catalog</Link>
      </div>
    );
  }

  const bookGenres = book.genre || book.genres || [];
  const bookCover = book.cover || book.cover_url || '/placeholder-cover.png';
  const bookAuthor = book.author || book.author_name || 'Unknown Author';

  const handleAddToLibrary = async () => {
    try {
      const response = await fetch('http://localhost:8000/libraries/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          book_id: book.id, 
          shelf: selectedShelf,
          progress: selectedShelf === 'Completed' ? 100 : 0 
        }),
      });
      if (response.ok) {
        const data = await response.json();
        addToLibrary(book, selectedShelf);
        if (selectedShelf === 'Completed') {
          setProgress(100);
        } else {
          setProgress(0);
        }
        setShowConfig(true);
      }
    } catch (error) {
      console.error('Error adding to library:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch('http://localhost:8000/libraries/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          book_id: book.id,
          shelf: selectedShelf,
          progress: Number(progress),
          rating: Number(rating),
          notes: notes
        }),
      });
      if (response.ok) {
        updateLibraryEntry(book.id, {
          shelf: selectedShelf,
          progress: Number(progress),
          rating: Number(rating),
          notes: notes
        });
        alert('Library entry updated successfully!');
        setShowConfig(false);
      }
    } catch (error) {
      console.error('Error updating library entry:', error);
    }
  };

  const handleRemove = async () => {
    try {
      const response = await fetch(`http://localhost:8000/libraries/${book.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        removeFromLibrary(book.id);
        setShowConfig(false);
        setConfirmDelete(false);
        setProgress(0);
        setRating(0);
        setNotes('');
      }
    } catch (error) {
      console.error('Error removing from library:', error);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '40px' }} className="fade-in">
      
      {/* Back button */}
      <div>
        <Link href="/catalog" style={{ textDecoration: 'none', color: '#8A827A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Book details card */}
      <div className="card detail-grid" style={{ padding: '48px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '48px' }}>
        
        {/* Cover column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{ width: '100%', maxWidth: '300px', position: 'relative' }}>
            <img 
              src={bookCover} 
              alt={book.title} 
              className="book-cover" 
              style={{ 
                width: '100%', 
                borderRadius: '16px', 
                border: '1px solid #E8E2D9',
                transformOrigin: 'center center',
                transform: 'perspective(1000px) rotateY(-5deg)',
                boxShadow: '20px 20px 40px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.08)',
                background: '#F5EFEB',
                minHeight: '400px',
                objectFit: 'cover'
              }} 
            />
          </div>
          
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {libraryEntry ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px', 
                background: '#FFFFFF', 
                padding: '20px', 
                borderRadius: '16px', 
                border: '1.5px dashed #6A1B29' 
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#6A1B29', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>In Your Library</span>
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#8A827A', fontWeight: 600 }}>
                  Shelf: <strong style={{ color: '#1E1B18' }}>{libraryEntry.shelf}</strong>
                </p>
                {libraryEntry.progress > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#8A827A', fontWeight: 600 }}>
                      <span>Reading Progress</span>
                      <span>{libraryEntry.progress}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '6px' }}>
                      <div className="progress-fill" style={{ width: `${libraryEntry.progress}%` }}></div>
                    </div>
                  </div>
                )}
                {libraryEntry.rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#8A827A' }}>
                    <span>Your Rating:</span>
                    <div style={{ display: 'flex', color: '#D4AF37' }}>
                      {'★'.repeat(libraryEntry.rating)}{'☆'.repeat(5 - libraryEntry.rating)}
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => {
                    setSelectedShelf(libraryEntry.shelf);
                    setProgress(libraryEntry.progress);
                    setRating(libraryEntry.rating);
                    setNotes(libraryEntry.notes || '');
                    setShowConfig(true);
                  }}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
                >
                  <Settings size={14} />
                  <span>Manage Entry</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#8A827A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Bookmark size={14} />
                  <span>Choose library shelf:</span>
                </label>
                <select 
                  value={selectedShelf} 
                  onChange={e => setSelectedShelf(e.target.value)} 
                  className="input-field"
                  style={{ cursor: 'pointer', padding: '10px 14px' }}
                >
                  <option value="Want to Read">Want to Read</option>
                  <option value="Currently Reading">Currently Reading</option>
                  <option value="Completed">Completed</option>
                  <option value="Favorites">Favorites</option>
                </select>
                <button onClick={handleAddToLibrary} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 24px', borderRadius: '12px' }}>
                  <span>Add to Library</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Meta data column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {bookGenres.map((g: string) => (
                <span key={g} className="badge">{g}</span>
              ))}
              {book.language && (
                <span className="badge" style={{ background: '#FFFFFF', color: '#0E172A' }}>{book.language}</span>
              )}
            </div>
            
            <h1 style={{ fontSize: '2.8rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#1E1B18', margin: '0 0 10px 0', lineHeight: 1.2 }}>
              {book.title}
            </h1>
            <p style={{ fontSize: '1.3rem', color: '#8A827A', margin: 0, fontWeight: 500 }}>
              by <span style={{ color: '#6A1B29', fontWeight: 600 }}>{bookAuthor}</span>
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', 
            gap: '16px', 
            borderTop: '1px solid #E8E2D9', 
            borderBottom: '1px solid #E8E2D9', 
            padding: '20px 0' 
          }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#8A827A', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Rating</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={16} fill="#D4AF37" color="#D4AF37" />
                <strong style={{ fontSize: '1.25rem', color: '#1E1B18' }}>{book.rating?.toFixed(1) || 'N/A'}</strong>
              </div>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#8A827A', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Pages</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} style={{ color: '#8A827A' }} />
                <strong style={{ fontSize: '1.25rem', color: '#1E1B18' }}>{book.pages || 'N/A'}</strong>
              </div>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#8A827A', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Published</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} style={{ color: '#8A827A' }} />
                <strong style={{ fontSize: '1.25rem', color: '#1E1B18' }}>{book.year || 'N/A'}</strong>
              </div>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#8A827A', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>ISBN</span>
              <strong style={{ fontSize: '1.1rem', color: '#1E1B18', fontFamily: 'monospace' }}>{book.isbn || 'N/A'}</strong>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.35rem', fontFamily: 'Playfair Display, serif', color: '#0E172A', marginBottom: '10px', fontWeight: 800 }}>Synopsis</h3>
            <p style={{ color: '#4A4540', lineHeight: 1.7, margin: 0, fontSize: '0.98rem', fontWeight: 500 }}>
              {book.description || 'No description available.'}
            </p>
          </div>

          {/* Tags */}
          {book.tags && book.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {book.tags.map((t: string) => (
                <span key={t} style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8A827A', background: '#FFFFFF', padding: '5px 12px', borderRadius: '6px' }}>
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Library entry manager Modal Overlay */}
      {showConfig && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(3,7,18,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div style={{ background: '#FCFAF6', border: '1px solid #E8E2D9', borderRadius: '28px', padding: '36px', maxWidth: '520px', width: '90%', display: 'flex', flexDirection: 'column', gap: '22px', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'Playfair Display, serif', margin: 0, fontWeight: 800, color: '#6A1B29' }}>Configure Library Entry</h3>
              <button onClick={() => setShowConfig(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#8A827A', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="btn-secondary">
                <X size={20} />
              </button>
            </div>

            {/* Shelf */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#8A827A' }}>Library Shelf</label>
              <select 
                value={selectedShelf} 
                onChange={e => {
                  const nextShelf = e.target.value;
                  setSelectedShelf(nextShelf);
                  if (nextShelf === 'Completed') {
                    setProgress(100);
                  } else if (selectedShelf === 'Completed' && nextShelf !== 'Completed') {
                    if (nextShelf === 'Currently Reading') {
                      setProgress(90);
                    } else {
                      setProgress(0);
                    }
                  }
                }} 
                className="input-field"
              >
                <option value="Want to Read">Want to Read</option>
                <option value="Currently Reading">Currently Reading</option>
                <option value="Completed">Completed</option>
                <option value="Favorites">Favorites</option>
              </select>
            </div>

            {/* Reading Progress */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: '#8A827A' }}>
                <span>Reading Progress</span>
                <span style={{ color: '#6A1B29', fontWeight: 800 }}>{progress}%</span>
              </label>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  type="button"
                  onClick={() => {
                    const next = Math.max(0, progress - 10);
                    setProgress(next);
                    if (next < 100 && selectedShelf === 'Completed') {
                      setSelectedShelf('Currently Reading');
                    }
                  }} 
                  className="btn-secondary" 
                  style={{ padding: '8px 14px', fontSize: '0.8rem', minWidth: '60px', justifyContent: 'center', borderRadius: '10px' }}
                >
                  -10%
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={progress} 
                  onChange={e => {
                    const nextVal = Number(e.target.value);
                    setProgress(nextVal);
                    if (nextVal === 100) {
                      setSelectedShelf('Completed');
                    } else if (nextVal < 100 && selectedShelf === 'Completed') {
                      setSelectedShelf('Currently Reading');
                    }
                  }} 
                  style={{ flex: 1, cursor: 'pointer', accentColor: '#6A1B29' }} 
                />
                <button 
                  type="button"
                  onClick={() => {
                    const next = Math.min(100, progress + 10);
                    setProgress(next);
                    if (next === 100) {
                      setSelectedShelf('Completed');
                    }
                  }} 
                  className="btn-secondary" 
                  style={{ padding: '8px 14px', fontSize: '0.8rem', minWidth: '60px', justifyContent: 'center', borderRadius: '10px' }}
                >
                  +10%
                </button>
              </div>
            </div>

            {/* Star Rating */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#8A827A' }}>Personal Rating</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    onClick={() => setRating(star)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: star <= rating ? '#D4AF37' : '#E8E2D9', padding: '2px', display: 'flex', alignItems: 'center' }}
                  >
                    <Star size={24} fill={star <= rating ? '#D4AF37' : 'none'} stroke={star <= rating ? '#D4AF37' : '#8A827A' } />
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#8A827A' }}>Personal Notes</label>
              <textarea placeholder="Write down your thoughts, impressions, or quotes..." value={notes} onChange={e => setNotes(e.target.value)} className="input-field" style={{ minHeight: '90px', resize: 'vertical' }} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
              {!confirmDelete ? (
                <>
                  <button onClick={handleUpdate} className="btn-primary" style={{ flex: 1, justifyContent: 'center', borderRadius: '12px' }}>
                    Save Entry
                  </button>
                  <button onClick={() => setConfirmDelete(true)} className="btn-secondary" style={{ borderColor: '#dc2626', color: '#dc2626', flex: 1, justifyContent: 'center', borderRadius: '12px' }}>
                    Remove Book
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }} className="fade-in">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#dc2626', justifyContent: 'center' }}>
                    <AlertTriangle size={16} />
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>
                      Are you sure you want to remove this book?
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '14px' }}>
                    <button 
                      onClick={handleRemove} 
                      className="btn-primary" 
                      style={{ background: '#dc2626', color: 'white', flex: 1, justifyContent: 'center', boxShadow: '0 4px 15px rgba(220,38,38,0.25)', borderRadius: '12px' }}
                    >
                      Yes, Remove It
                    </button>
                    <button 
                      onClick={() => setConfirmDelete(false)} 
                      className="btn-secondary" 
                      style={{ flex: 1, justifyContent: 'center', borderRadius: '12px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Similar Books Section */}
      <section style={{ borderTop: '1px solid #E8E2D9', paddingTop: '48px' }}>
        <h2 className="section-title" style={{ fontSize: '1.6rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, marginBottom: '24px' }}>Readers Also Loved</h2>
        {similar.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '28px' }}>
            {similar.map((b: any) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        ) : (
          <div style={{ color: '#8A827A' }}>Loading similar books...</div>
        )}
      </section>

      <style>{`
        @media (max-width: 900px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
