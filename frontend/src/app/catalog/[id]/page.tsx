'use client';
import { useApp } from '@/lib/store';
import { BOOKS } from '@/lib/data';
import { getSimilarBooks } from '@/lib/recommendations';
import BookCard from '@/components/BookCard';
import Link from 'next/link';
import { useState, use } from 'react';

export default function BookDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addToLibrary, getEntry, updateEntry, removeFromLibrary, addToast } = useApp();
  
  const book = BOOKS.find(b => b.id === Number(id));
  const [selectedShelf, setSelectedShelf] = useState('Want to Read');
  const [notes, setNotes] = useState('');
  const [progress, setProgress] = useState(0);
  const [rating, setRating] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!book) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', background: 'var(--cream)' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif' }}>Book Not Found</h1>
        <p style={{ color: 'var(--text-muted)' }}>The requested book ID does not exist in our catalog.</p>
        <Link href="/catalog" className="btn-primary" style={{ marginTop: '20px' }}>Back to Catalog</Link>
      </div>
    );
  }

  const similar = getSimilarBooks(book, 4);
  const libraryEntry = getEntry(book.id);

  const handleAddToLibrary = () => {
    addToLibrary(book, selectedShelf);
    // Preset modal inputs to library state
    if (selectedShelf === 'Completed') {
      setProgress(100);
    } else {
      setProgress(0);
    }
    setShowConfig(true);
  };

  const handleUpdate = () => {
    updateEntry(book.id, {
      shelf: selectedShelf,
      progress: Number(progress),
      rating: Number(rating),
      notes: notes
    });
    addToast("Library entry updated successfully! ✨", "success");
    setShowConfig(false);
  };

  const handleRemove = () => {
    removeFromLibrary(book.id);
    setShowConfig(false);
    setConfirmDelete(false);
    setProgress(0);
    setRating(0);
    setNotes('');
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '48px' }} className="fade-in">
      
      {/* Back button */}
      <div>
        <Link href="/catalog" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          ← Back to Catalog
        </Link>
      </div>

      {/* Book details card */}
      <div className="card detail-grid" style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        
        {/* Cover column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <img 
            src={book.cover} 
            alt={book.title} 
            className="book-cover" 
            style={{ width: '100%', maxWidth: '300px', borderRadius: '16px', border: '1px solid var(--border)' }} 
          />
          
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {libraryEntry ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1.5px dashed var(--burgundy)' }}>
                <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--burgundy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✓</span> In Your Library
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Shelf: <strong>{libraryEntry.shelf}</strong>
                </p>
                {libraryEntry.progress > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Progress</span>
                      <span>{libraryEntry.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${libraryEntry.progress}%` }}></div>
                    </div>
                  </div>
                )}
                {libraryEntry.rating > 0 && (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Your Rating: {'★'.repeat(libraryEntry.rating)}{'☆'.repeat(5 - libraryEntry.rating)}
                  </p>
                )}
                <button 
                  onClick={() => {
                    setSelectedShelf(libraryEntry.shelf);
                    setProgress(libraryEntry.progress);
                    setRating(libraryEntry.rating);
                    setNotes(libraryEntry.notes);
                    setShowConfig(true);
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', justifyContent: 'center' }}
                >
                  Manage Entry ⚙️
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Choose library shelf:</label>
                <select 
                  value={selectedShelf} 
                  onChange={e => setSelectedShelf(e.target.value)} 
                  className="input-field"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="Want to Read">Want to Read</option>
                  <option value="Currently Reading">Currently Reading</option>
                  <option value="Completed">Completed</option>
                  <option value="Favorites">Favorites</option>
                </select>
                <button onClick={handleAddToLibrary} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Add to Library 🗂️
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Meta data column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {book.genre.map(g => (
                <span key={g} className="badge">{g}</span>
              ))}
              <span className="badge" style={{ background: 'var(--surface)', color: 'var(--navy)' }}>{book.language}</span>
            </div>
            
            <h1 style={{ fontSize: '2.5rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.2 }}>
              {book.title}
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', margin: 0 }}>
              by {book.author}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rating</span>
              <strong style={{ fontSize: '1.2rem', color: 'var(--burgundy)' }}>★ {book.rating.toFixed(1)}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pages</span>
              <strong style={{ fontSize: '1.2rem' }}>{book.pages} pages</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Published</span>
              <strong style={{ fontSize: '1.2rem' }}>{book.year}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>ISBN</span>
              <strong style={{ fontSize: '1.2rem', fontFamily: 'monospace' }}>{book.isbn}</strong>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'Playfair Display, serif', color: 'var(--navy)', marginBottom: '8px' }}>Synopsis</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {book.description}
            </p>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {book.tags.map(t => (
              <span key={t} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--surface)', padding: '4px 10px', borderRadius: '4px' }}>
                #{t}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Library entry manager Modal Overlay */}
      {showConfig && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', maxWidth: '500px', width: '90%', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.35rem', fontFamily: 'Playfair Display, serif', margin: 0 }}>Configure Library Entry</h3>
              <button onClick={() => setShowConfig(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>

            {/* Shelf */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Library Shelf</label>
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
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600 }}>
                <span>Reading Progress</span>
                <span>{progress}%</span>
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
                  style={{ padding: '6px 12px', fontSize: '0.8rem', minWidth: '54px', justifyContent: 'center' }}
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
                  style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--burgundy)' }} 
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
                  style={{ padding: '6px 12px', fontSize: '0.8rem', minWidth: '54px', justifyContent: 'center' }}
                >
                  +10%
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manual Progress:</span>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={progress} 
                  onChange={e => {
                    const val = Math.min(100, Math.max(0, Number(e.target.value)));
                    setProgress(val);
                    if (val === 100) {
                      setSelectedShelf('Completed');
                    } else if (val < 100 && selectedShelf === 'Completed') {
                      setSelectedShelf('Currently Reading');
                    }
                  }} 
                  className="input-field" 
                  style={{ width: '80px', padding: '4px 8px', fontSize: '0.85rem', textAlign: 'center' }} 
                />
                <span style={{ fontSize: '0.85rem' }}>%</span>
              </div>
            </div>

            {/* Star Rating */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Personal Rating</label>
              <div style={{ display: 'flex', gap: '8px', fontSize: '1.5rem' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    onClick={() => setRating(star)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: star <= rating ? 'var(--gold)' : 'var(--border)' }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Personal Notes</label>
              <textarea placeholder="Write down your thoughts, impressions, or quotes..." value={notes} onChange={e => setNotes(e.target.value)} className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              {!confirmDelete ? (
                <>
                  <button onClick={handleUpdate} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    Save Entry
                  </button>
                  <button onClick={() => setConfirmDelete(true)} className="btn-secondary" style={{ borderColor: 'red', color: 'red', flex: 1, justifyContent: 'center' }}>
                    Remove Book
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }} className="fade-in">
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'red', fontWeight: 600, textAlign: 'center' }}>
                    Are you sure you want to remove this book from your library?
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={handleRemove} 
                      className="btn-primary" 
                      style={{ background: 'red', color: 'white', flex: 1, justifyContent: 'center', boxShadow: '0 4px 15px rgba(255,0,0,0.2)' }}
                    >
                      Yes, Remove It
                    </button>
                    <button 
                      onClick={() => setConfirmDelete(false)} 
                      className="btn-secondary" 
                      style={{ flex: 1, justifyContent: 'center' }}
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
      <section style={{ borderTop: '1px solid var(--border)', paddingTop: '40px' }}>
        <h2 className="section-title">Readers Also Loved</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
          {similar.map(b => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
