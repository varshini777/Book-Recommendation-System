'use client';
import { useState, useEffect } from 'react';
import BookCard from '../../components/BookCard';
import { Search, Filter, RotateCcw, SlidersHorizontal, BookOpen } from 'lucide-react';
import { BOOKS, Book } from '../../lib/data';

const GENRES = ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction', 'Fantasy', 'Thriller', 'Historical', 'Biography', 'Self-Help', 'Business', 'Philosophy', 'Poetry', 'Drama', 'Adventure'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Russian'];

export default function Catalog() {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLang, setSelectedLang] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const getLocalBooks = () => {
    const normalizedQuery = query.trim().toLowerCase();

    return BOOKS.filter(book => {
      const matchesQuery =
        !normalizedQuery ||
        book.title.toLowerCase().includes(normalizedQuery) ||
        book.author.toLowerCase().includes(normalizedQuery) ||
        book.description.toLowerCase().includes(normalizedQuery) ||
        book.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));
      const matchesGenre = !selectedGenre || book.genre.includes(selectedGenre);
      const matchesLanguage = !selectedLang || book.language === selectedLang;

      return matchesQuery && matchesGenre && matchesLanguage;
    });
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (selectedGenre) params.append('genre', selectedGenre);
      if (selectedLang) params.append('language', selectedLang);
      
      const response = await fetch(`http://localhost:8000/books/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setBooks(Array.isArray(data) && data.length > 0 ? data : getLocalBooks());
      } else {
        setBooks(getLocalBooks());
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooks(getLocalBooks());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [query, selectedGenre, selectedLang]);

  const clearFilters = () => {
    setQuery('');
    setSelectedGenre('');
    setSelectedLang('');
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '36px' }} className="fade-in">
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '2.6rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', margin: 0 }}>
            Discover LitRealm Catalog
          </h1>
          <p style={{ color: '#8A827A', marginTop: '6px', fontSize: '0.95rem', fontWeight: 500 }}>
            Explore our diverse collection of classic literature, modern blockbusters, and local Indian masterpieces.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', color: '#6A1B29' }}>
          <SlidersHorizontal size={18} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#4A4540' }}>Search Filters</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '16px' }} className="filter-grid">
          {/* Search text */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', color: '#8A827A' }} />
            <input
              type="text"
              placeholder="Search by title, author, description, tags..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '48px' }}
            />
          </div>

          {/* Genre select */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Filter size={16} style={{ position: 'absolute', left: '16px', color: '#8A827A', pointerEvents: 'none' }} />
            <select
              value={selectedGenre}
              onChange={e => setSelectedGenre(e.target.value)}
              className="input-field"
              style={{ cursor: 'pointer', paddingLeft: '44px' }}
            >
              <option value="">All Genres</option>
              {GENRES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Language select */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <BookOpen size={16} style={{ position: 'absolute', left: '16px', color: '#8A827A', pointerEvents: 'none' }} />
            <select
              value={selectedLang}
              onChange={e => setSelectedLang(e.target.value)}
              className="input-field"
              style={{ cursor: 'pointer', paddingLeft: '44px' }}
            >
              <option value="">All Languages</option>
              {LANGUAGES.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Clear filters button */}
          <button 
            onClick={clearFilters}
            className="btn-secondary"
            style={{ 
              justifyContent: 'center', 
              padding: '14px 24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              borderWidth: '2px'
            }}
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Results Display */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #E8E2D9', paddingBottom: '12px' }}>
          <p style={{ color: '#8A827A', fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>
            Available Books: <span style={{ color: '#6A1B29' }}>{books.length}</span>
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>Loading books...</div>
        ) : books.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '28px' }}>
            {books.map(b => (
              <BookCard key={b.id} book={b} />
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
              <Search size={32} style={{ color: '#6A1B29' }} />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#1E1B18', margin: '0 0 8px 0', fontFamily: 'Playfair Display, serif', fontWeight: 800 }}>
              No Books Match Your Search
            </h3>
            <p style={{ color: '#8A827A', margin: 0, fontSize: '0.92rem', fontWeight: 500 }}>
              Try adjusting your query, removing search filters, or selecting a different genre.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .filter-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
