'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../lib/zustandStore';
import { BookOpen, User, Save, Cog, CheckCircle2, Palette, Moon, Sun, Star, Zap, Target, Trash2, Shield } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const AVAILABLE_GENRES = [
  'Fantasy', 'Science Fiction', 'Mystery', 'Thriller',
  'Historical Fiction', 'Horror', 'Non-Fiction', 'Biography',
  'Self-Help', 'Business', 'Technology', 'Philosophy', 'Classics',
  'Contemporary', 'Poetry', 'Adventure', 'Psychology', 'History'
];

interface AuthorSuggestion {
  id: number;
  name: string;
  bio: string | null;
  image_url: string | null;
  nationality: string | null;
  popularity: number;
}

function getStrength(genres: string[], authors: string[]): { label: string; color: string; pct: number } {
  const score = genres.length * 10 + authors.length * 15;
  if (score >= 50) return { label: 'Strong', color: '#16a34a', pct: Math.min(score, 100) };
  if (score >= 20) return { label: 'Good', color: '#D4AF37', pct: Math.min(score, 100) };
  return { label: 'Beginner', color: '#6A1B29', pct: Math.max(score, 5) };
}

export default function Settings() {
  const { user, darkMode, toggleDark, logout, addToast, token } = useAppStore();
  const [preferredGenres, setPreferredGenres] = useState<string[]>([]);
  const [preferredAuthors, setPreferredAuthors] = useState<string[]>([]);
  const [suggestedAuthors, setSuggestedAuthors] = useState<AuthorSuggestion[]>([]);
  const [authorsLoading, setAuthorsLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load existing preferences on mount
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/users/me/preferences`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setPreferredGenres(data.preferred_genres || []);
          setPreferredAuthors(data.preferred_authors || []);
        }
      });
  }, []);

  // Fetch recommended authors whenever genres change
  const fetchRecommendedAuthors = useCallback(async (genres: string[]) => {
    setAuthorsLoading(true);
    try {
      const genreParam = genres.join(',');
      const res = await fetch(`${API}/users/recommended-authors?genres=${encodeURIComponent(genreParam)}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setSuggestedAuthors(data);
      }
    } catch {
      // silently fail
    } finally {
      setAuthorsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendedAuthors(preferredGenres);
  }, [preferredGenres, fetchRecommendedAuthors]);

  const toggleGenre = (genre: string) => {
    setPreferredGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleAuthor = (name: string) => {
    setPreferredAuthors(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    
    if (!token) {
      addToast('Please log in to save preferences', 'error');
      setSaving(false);
      return;
    }

    const res = await fetch(`${API}/users/me/preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        preferred_genres: preferredGenres,
        preferred_authors: preferredAuthors,
        onboarding_completed: true
      })
    });
    setSaving(false);
    
    if (res.ok) {
      setSaved(true);
      addToast('Preferences saved! Recommendations regenerating...', 'success');
      setTimeout(() => { window.location.href = '/'; }, 1200);
    } else if (res.status === 401) {
      addToast('Session expired. Please log in again.', 'error');
      logout();
      setTimeout(() => { window.location.href = '/login'; }, 1000);
    } else {
      addToast(`Failed to save preferences (Error ${res.status}).`, 'error');
    }
  };

  const strength = getStrength(preferredGenres, preferredAuthors);

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
        <Cog size={48} color="#6A1B29" />
        <h2 style={{ fontSize: '1.5rem', color: '#6A1B29' }}>Please sign in to access settings</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48 }}>
        <div style={{
          background: 'linear-gradient(135deg, #6A1B29, #D4AF37)',
          padding: 14, borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(106,27,41,0.3)'
        }}>
          <Cog size={28} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '2.4rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: 'var(--burgundy)', margin: 0, lineHeight: 1 }}>
            Settings
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '6px 0 0', fontSize: '1rem' }}>
            Personalise your reading experience
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── SECTION 1 — PREFERRED GENRES ── */}
        <div className="card" style={{ padding: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: 'rgba(106,27,41,0.1)', borderRadius: 10, padding: 8 }}>
              <BookOpen size={20} color="#6A1B29" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Section 1 — Preferred Genres
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Choose what you love to read
              </p>
            </div>
          </div>

          {preferredGenres.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20,
              background: 'rgba(106,27,41,0.05)', borderRadius: 12, padding: '12px 16px'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6A1B29', alignSelf: 'center', marginRight: 4 }}>SELECTED:</span>
              {preferredGenres.map(g => (
                <span key={g} style={{
                  background: '#6A1B29', color: 'white', borderRadius: 20,
                  padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer'
                }} onClick={() => toggleGenre(g)}>
                  {g} ✕
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
            {AVAILABLE_GENRES.map(genre => {
              const active = preferredGenres.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 24,
                    border: `2px solid ${active ? '#6A1B29' : 'var(--border)'}`,
                    background: active ? 'linear-gradient(135deg, #6A1B29, #8B2234)' : 'var(--glass-bg)',
                    color: active ? 'white' : 'var(--text-secondary)',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                    boxShadow: active ? '0 4px 12px rgba(106,27,41,0.35)' : 'none',
                    transform: active ? 'translateY(-2px)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {active && <CheckCircle2 size={14} />}
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 2 — RECOMMENDED AUTHORS ── */}
        <div className="card" style={{ padding: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: 'rgba(212,175,55,0.15)', borderRadius: 10, padding: 8 }}>
              <User size={20} color="#D4AF37" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Section 2 — Recommended Authors
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {preferredGenres.length > 0
                  ? `Authors matched to: ${preferredGenres.join(', ')}`
                  : 'Select genres above to see personalised suggestions'}
              </p>
            </div>
          </div>

          {authorsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '3px solid var(--border)', borderTopColor: '#6A1B29',
                animation: 'spin 0.8s linear infinite'
              }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Finding the best authors for you…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : suggestedAuthors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <User size={40} color="var(--border)" style={{ margin: '0 auto 12px' }} />
              <p>No authors found. Try selecting more genres.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 16, marginTop: 20
            }}>
              {suggestedAuthors.map(author => {
                const selected = preferredAuthors.includes(author.name);
                return (
                  <button
                    key={author.id}
                    onClick={() => toggleAuthor(author.name)}
                    style={{
                      borderRadius: 16,
                      border: `2px solid ${selected ? '#D4AF37' : 'var(--border)'}`,
                      background: selected
                        ? 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))'
                        : 'var(--glass-bg)',
                      padding: '20px 16px',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                      textAlign: 'center',
                      boxShadow: selected ? '0 4px 16px rgba(212,175,55,0.25)' : 'none',
                      transform: selected ? 'translateY(-3px)' : 'none',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {selected && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: '#D4AF37', borderRadius: '50%',
                        width: 20, height: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <CheckCircle2 size={12} color="white" />
                      </div>
                    )}
                    {/* Avatar circle */}
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: selected
                        ? 'linear-gradient(135deg, #D4AF37, #B8962E)'
                        : 'linear-gradient(135deg, #6A1B29, #8B2234)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 12px',
                      fontSize: '1.4rem', fontWeight: 800, color: 'white',
                      boxShadow: selected ? '0 4px 12px rgba(212,175,55,0.4)' : '0 4px 12px rgba(106,27,41,0.3)',
                      border: selected ? '2px solid #D4AF37' : '2px solid rgba(255,255,255,0.1)'
                    }}>
                      {author.image_url ? (
                        <img src={author.image_url} alt={author.name}
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        author.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <p style={{
                      fontWeight: 700, fontSize: '0.9rem',
                      color: selected ? '#D4AF37' : 'var(--text-primary)',
                      margin: 0, lineHeight: 1.3,
                      wordBreak: 'break-word'
                    }}>
                      {author.name}
                    </p>
                    {author.nationality && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        {author.nationality}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {preferredAuthors.length > 0 && (
            <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(212,175,55,0.08)', borderRadius: 12, border: '1px solid rgba(212,175,55,0.2)' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#D4AF37', margin: 0 }}>
                ✓ {preferredAuthors.length} author{preferredAuthors.length !== 1 ? 's' : ''} selected: {preferredAuthors.join(' · ')}
              </p>
            </div>
          )}
        </div>

        {/* ── SECTION 3 — RECOMMENDATION PROFILE ── */}
        <div className="card" style={{ padding: 36, background: 'linear-gradient(135deg, rgba(106,27,41,0.04), rgba(212,175,55,0.04))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ background: 'rgba(106,27,41,0.1)', borderRadius: 10, padding: 8 }}>
              <Star size={20} color="#6A1B29" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Section 3 — Recommendation Profile
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Your personalisation summary
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{
              background: 'var(--glass-bg)', borderRadius: 16, padding: '20px 24px',
              border: '1.5px solid var(--border)', textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#6A1B29', lineHeight: 1 }}>
                {preferredGenres.length}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Genres Selected
              </div>
            </div>
            <div style={{
              background: 'var(--glass-bg)', borderRadius: 16, padding: '20px 24px',
              border: '1.5px solid var(--border)', textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#D4AF37', lineHeight: 1 }}>
                {preferredAuthors.length}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Authors Selected
              </div>
            </div>
            <div style={{
              background: 'var(--glass-bg)', borderRadius: 16, padding: '20px 24px',
              border: `1.5px solid ${strength.color}`, textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: strength.color, lineHeight: 1 }}>
                {strength.label}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Profile Strength
              </div>
            </div>
          </div>

          {/* Strength bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommendation Strength</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: strength.color }}>{strength.pct}%</span>
            </div>
            <div style={{ height: 10, background: 'var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${strength.pct}%`,
                background: `linear-gradient(90deg, #6A1B29, ${strength.color})`,
                borderRadius: 8,
                transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)'
              }} />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
              {strength.label === 'Strong'
                ? '🎯 Great profile! Your recommendations will be highly personalised.'
                : strength.label === 'Good'
                ? '📚 Good start! Add more genres or authors for better recommendations.'
                : '💡 Select at least 3 genres and 2 authors for the best results.'}
            </p>
          </div>
        </div>

        {/* ── APPEARANCE ── */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Palette size={18} color="#6A1B29" />
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Appearance</h3>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>Dark Mode</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Switch between light and dark theme</p>
            </div>
            <button onClick={toggleDark} style={{
              width: 60, height: 30, borderRadius: 15,
              background: darkMode ? '#6A1B29' : 'var(--border)',
              position: 'relative', cursor: 'pointer',
              transition: 'all 0.3s', border: 'none', display: 'flex', alignItems: 'center', padding: 4
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transform: darkMode ? 'translateX(30px)' : 'translateX(0)',
                transition: 'transform 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {darkMode ? <Moon size={10} color="#6A1B29" /> : <Sun size={10} color="#D4AF37" />}
              </div>
            </button>
          </div>
        </div>

        {/* ── DANGER ZONE ── */}
        <div className="card" style={{ padding: 28, border: '2px solid #FECACA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Trash2 size={18} color="#DC2626" />
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#DC2626', margin: 0 }}>Danger Zone</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.9rem' }}>
            Account deletion is permanent and irreversible.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={logout} className="btn-secondary" style={{ padding: '10px 20px' }}>
              Sign Out
            </button>
            <button
              onClick={() => confirm('Delete your account? This cannot be undone.') && addToast('Account deletion requested', 'info')}
              style={{
                background: '#DC2626', color: 'white', border: 'none',
                borderRadius: 12, padding: '10px 20px',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem'
              }}
            >
              <Trash2 size={14} /> Delete Account
            </button>
          </div>
        </div>

        {/* ── SAVE BUTTON ── */}
        <button
          onClick={handleSave}
          disabled={saving || saved}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '18px 40px',
            background: saved
              ? 'linear-gradient(135deg, #16a34a, #15803d)'
              : 'linear-gradient(135deg, #6A1B29, #8B2234)',
            color: 'white', border: 'none', borderRadius: 16,
            fontSize: '1.05rem', fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
            boxShadow: '0 8px 24px rgba(106,27,41,0.35)',
            transform: 'translateY(0)',
            transition: 'all 0.3s',
            opacity: saving ? 0.8 : 1
          }}
        >
          {saved ? (
            <><CheckCircle2 size={20} /> Saved! Redirecting…</>
          ) : saving ? (
            <><Zap size={20} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</>
          ) : (
            <><Save size={20} /> Save &amp; Regenerate Recommendations</>
          )}
        </button>

      </div>
    </div>
  );
}
