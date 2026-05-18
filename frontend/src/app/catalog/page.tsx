'use client';
import { useState } from 'react';
import { GENRES, LANGUAGES, BOOKS } from '@/lib/data';
import { searchBooks } from '@/lib/recommendations';
import BookCard from '@/components/BookCard';

export default function Catalog() {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLang, setSelectedLang] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  const results = searchBooks(query, {
    genre: selectedGenre || undefined,
    language: selectedLang || undefined,
    year: selectedYear || undefined,
  });

  const clearFilters = () => {
    setQuery('');
    setSelectedGenre('');
    setSelectedLang('');
    setSelectedYear(undefined);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }} className="fade-in">
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: 'var(--burgundy)', margin: 0 }}>
          Discover Book Catalog
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>
          Explore our diverse collection of classic literature, modern blockbusters, and local Indian masterpieces.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '16px' }} className="filter-grid">
          {/* Search text */}
          <input
            type="text"
            placeholder="Search by title, author, description, or tags..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input-field"
          />

          {/* Genre select */}
          <select
            value={selectedGenre}
            onChange={e => setSelectedGenre(e.target.value)}
            className="input-field"
            style={{ cursor: 'pointer' }}
          >
            <option value="">All Genres</option>
            {GENRES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Language select */}
          <select
            value={selectedLang}
            onChange={e => setSelectedLang(e.target.value)}
            className="input-field"
            style={{ cursor: 'pointer' }}
          >
            <option value="">All Languages</option>
            {LANGUAGES.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* Clear filters button */}
          <button 
            onClick={clearFilters}
            className="btn-secondary"
            style={{ justifyContent: 'center' }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Display */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>
            Found <span style={{ color: 'var(--burgundy)' }}>{results.length}</span> {results.length === 1 ? 'book' : 'books'}
          </p>
        </div>

        {results.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {results.map(b => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px' }}>
            <span style={{ fontSize: '3rem' }}>🔍</span>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: '16px 0 8px 0', fontFamily: 'Playfair Display, serif' }}>
              No Books Match Your Search
            </h3>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              Try adjusting your spelling or removing filters to discover more books.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .filter-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
