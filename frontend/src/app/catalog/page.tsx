'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import BookCard from '../../components/BookCard';
import { Search, Filter, RotateCcw, SlidersHorizontal, BookOpen, ChevronLeft, ChevronRight, ArrowUpDown, X } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface BookData {
  id: number;
  title: string;
  author_name: string;
  cover_url: string;
  rating: number;
  rating_count: number;
  year: number;
  genres: string[];
  language: string;
  description: string;
}

interface Suggestion {
  text: string;
  type: 'book' | 'author' | 'genre';
}

interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export default function Catalog() {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLang, setSelectedLang] = useState('');
  const [sortBy, setSortBy] = useState('rating_desc');
  const [books, setBooks] = useState<BookData[]>([]);
  const [genres, setGenres] = useState<{id: number; name: string}[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, page_size: 20, total: 0, total_pages: 0, has_next: false, has_prev: false
  });
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIdx, setSuggestionIdx] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q || q.trim().length < 1) { setSuggestions([]); return; }
    try {
      const res = await fetch(`${API}/recommendations/search-suggestions?q=${encodeURIComponent(q)}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch { setSuggestions([]); }
  }, []);

  const fetchBooks = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', '20');
      if (query) params.append('query', query);
      if (selectedGenre) params.append('genre', selectedGenre);
      if (selectedLang) params.append('language', selectedLang);
      if (sortBy) params.append('sort_by', sortBy);

      const res = await fetch(`${API}/books/?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books || []);
        setPagination(data.pagination || { page: 1, page_size: 20, total: 0, total_pages: 0, has_next: false, has_prev: false });
      }
    } catch (e) {
      console.error('Error fetching books:', e);
    } finally {
      setLoading(false);
    }
  }, [query, selectedGenre, selectedLang, sortBy]);

  const fetchGenres = async () => {
    try {
      const res = await fetch(`${API}/books/genres/list`);
      if (res.ok) {
        const data = await res.json();
        setGenres(data);
      }
    } catch (e) {
      console.error('Error fetching genres:', e);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => fetchBooks(1), 300);
    setSearchTimeout(timeout);
    return () => { if (searchTimeout) clearTimeout(searchTimeout); };
  }, [query, selectedGenre, selectedLang, sortBy]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearFilters = () => {
    setQuery('');
    setSelectedGenre('');
    setSelectedLang('');
    setSortBy('rating_desc');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const sortOptions = [
    { value: 'rating_desc', label: 'Highest Rated' },
    { value: 'popularity', label: 'Most Popular' },
    { value: 'newest', label: 'Newest First' },
    { value: 'year_desc', label: 'Year (Newest)' },
    { value: 'year_asc', label: 'Year (Oldest)' },
    { value: 'title_asc', label: 'Title (A-Z)' },
    { value: 'title_desc', label: 'Title (Z-A)' },
  ];

  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '36px' }} className="fade-in">
      <div>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
          fontFamily: 'Playfair Display, serif', fontWeight: 800,
          color: 'var(--burgundy)', margin: '0 0 6px 0',
        }}>
          Book Catalog
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500, margin: 0 }}>
          Explore {pagination.total > 0 ? `${pagination.total.toLocaleString()} ` : ''}curated books across 24 genres.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', color: 'var(--burgundy)' }}>
          <SlidersHorizontal size={18} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
            Search & Filter
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'center' }} className="filter-grid">
          <div style={{ position: 'relative' }} ref={searchRef}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2 }} />
            <input
              type="text"
              placeholder="Search title, author, ISBN..."
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                fetchSuggestions(e.target.value);
                setShowSuggestions(true);
                setSuggestionIdx(-1);
              }}
              onKeyDown={e => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSuggestionIdx(prev => Math.min(prev + 1, suggestions.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSuggestionIdx(prev => Math.max(prev - 1, -1));
                } else if (e.key === 'Enter' && suggestionIdx >= 0) {
                  e.preventDefault();
                  setQuery(suggestions[suggestionIdx].text);
                  setShowSuggestions(false);
                  setSuggestionIdx(-1);
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              className="input-field"
              style={{ paddingLeft: '42px', height: '46px' }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: '12px', marginTop: '4px', padding: '6px',
                boxShadow: 'var(--glass-shadow)', zIndex: 100,
                maxHeight: '280px', overflow: 'auto',
              }}>
                {suggestions.map((s, i) => (
                  <button
                    key={`${s.type}-${s.text}`}
                    onClick={() => { setQuery(s.text); setShowSuggestions(false); }}
                    style={{
                      width: '100%', padding: '10px 14px', border: 'none',
                      background: i === suggestionIdx ? 'var(--surface)' : 'transparent',
                      borderRadius: '8px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: '6px',
                      background: s.type === 'book' ? 'var(--burgundy)' : s.type === 'author' ? '#1A237E' : '#2E7D32',
                      color: 'white', flexShrink: 0,
                    }}>
                      {s.type}
                    </span>
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>{s.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={selectedGenre}
            onChange={e => setSelectedGenre(e.target.value)}
            className="input-field"
            style={{ cursor: 'pointer', height: '46px' }}
          >
            <option value="">All Genres</option>
            {genres.map(g => (
              <option key={g.id} value={g.name}>{g.name}</option>
            ))}
          </select>

          <select
            value={selectedLang}
            onChange={e => setSelectedLang(e.target.value)}
            className="input-field"
            style={{ cursor: 'pointer', height: '46px' }}
          >
            <option value="">All Languages</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
          </select>

          <div style={{ position: 'relative' }}>
            <ArrowUpDown size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="input-field"
              style={{ cursor: 'pointer', height: '46px', paddingLeft: '36px' }}
            >
              {sortOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <button onClick={clearFilters} className="btn-secondary" style={{
            height: '46px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '6px',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Results */}
      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)',
        }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
            Showing <span style={{ color: 'var(--burgundy)', fontWeight: 700 }}>{books.length}</span> of{' '}
            <span style={{ color: 'var(--burgundy)', fontWeight: 700 }}>{pagination.total.toLocaleString()}</span> books
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="skeleton" style={{ height: 340, borderRadius: 20 }} />
            ))}
          </div>
        ) : books.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
              {books.map(b => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>

            {pagination.total_pages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                gap: '8px', marginTop: '40px', padding: '20px',
              }}>
                <button
                  onClick={() => fetchBooks(pagination.page - 1)}
                  disabled={!pagination.has_prev}
                  className="btn-secondary"
                  style={{
                    padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px',
                    opacity: pagination.has_prev ? 1 : 0.4, cursor: pagination.has_prev ? 'pointer' : 'not-allowed',
                  }}
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                <div style={{ display: 'flex', gap: '4px', margin: '0 12px' }}>
                  {Array.from({ length: Math.min(pagination.total_pages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.total_pages <= 7) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 4) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.total_pages - 3) {
                      pageNum = pagination.total_pages - 6 + i;
                    } else {
                      pageNum = pagination.page - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchBooks(pageNum)}
                        style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          border: '1.5px solid var(--border)', background: pageNum === pagination.page ? 'var(--burgundy)' : 'transparent',
                          color: pageNum === pagination.page ? 'white' : 'var(--text-secondary)',
                          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                          transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => fetchBooks(pagination.page + 1)}
                  disabled={!pagination.has_next}
                  className="btn-secondary"
                  style={{
                    padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px',
                    opacity: pagination.has_next ? 1 : 0.4, cursor: pagination.has_next ? 'pointer' : 'not-allowed',
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="card" style={{
            textAlign: 'center', padding: '80px 24px',
            borderRadius: '24px',
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(106,27,41,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px auto',
            }}>
              <Search size={32} style={{ color: 'var(--burgundy)', opacity: 0.6 }} />
            </div>
            <h3 style={{
              fontSize: '1.4rem', margin: '0 0 8px 0',
              fontFamily: 'Playfair Display, serif', fontWeight: 800,
              color: 'var(--text-primary)',
            }}>
              No Books Found
            </h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 24px 0', fontSize: '0.92rem', fontWeight: 500 }}>
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
            <button onClick={clearFilters} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={14} /> Clear All Filters
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .filter-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
