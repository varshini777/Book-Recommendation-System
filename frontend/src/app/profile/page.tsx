'use client';
import { useApp } from '../../lib/store';
import { GENRES, LANGUAGES } from '../../lib/data';
import { useState, useEffect } from 'react';

export default function Profile() {
  const { user, setUser, prefs, setPrefs, setOnboarded, library, addToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
    setSelectedGenres(prefs.genres);
    setSelectedLangs(prefs.languages);
  }, [user, prefs]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      name,
      email,
      avatar: '👤'
    });
    setPrefs({
      genres: selectedGenres,
      languages: selectedLangs,
      authors: []
    });
    addToast("Profile and preferences updated successfully! ✨", "success");
  };

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleLang = (lang: string) => {
    setSelectedLangs(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  // Profile Statistics
  const totalBooks = library.length;
  const currentlyReading = library.filter(e => e.shelf === 'Currently Reading').length;
  const completed = library.filter(e => e.shelf === 'Completed').length;
  const ratedBooks = library.filter(e => e.rating > 0);
  const avgRating = ratedBooks.length > 0 
    ? (ratedBooks.reduce((acc, curr) => acc + curr.rating, 0) / ratedBooks.length).toFixed(1)
    : '0.0';

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }} className="fade-in profile-grid">
      
      {/* Column 1: Stats & Reset */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* User Card */}
        <div className="card" style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <div style={{ fontSize: '4rem', width: '100px', height: '100px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', border: '2px solid var(--border)' }}>
            👤
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, margin: 0 }}>
              {name || 'Reader'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
              {email || 'reader@example.com'}
            </p>
          </div>
        </div>

        {/* Reading Stats */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', color: 'var(--navy)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0 }}>
            Reading Analytics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--burgundy)' }}>{totalBooks}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Library Books</span>
            </div>
            <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--navy)' }}>{currentlyReading}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reading Now</span>
            </div>
            <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gold)' }}>{completed}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed</span>
            </div>
            <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--burgundy)' }}>★ {avgRating}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Rating</span>
            </div>
          </div>
        </div>

        {/* Danger zone / Reset */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', borderColor: '#fca5a5' }}>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', color: '#dc2626', margin: 0 }}>
            Danger Zone
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Clearing system data deletes all preferences and library books permanently.
          </p>
          {!confirmReset ? (
            <button 
              type="button"
              onClick={() => setConfirmReset(true)}
              className="btn-secondary"
              style={{ borderColor: '#dc2626', color: '#dc2626', justifyContent: 'center' }}
            >
              Reset System Data ⚠️
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }} className="fade-in">
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#dc2626', fontWeight: 600 }}>
                Are you absolutely sure? This cannot be undone!
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button"
                  onClick={handleReset}
                  className="btn-primary"
                  style={{ background: '#dc2626', color: 'white', fontSize: '0.8rem', padding: '6px 12px', flex: 1, justifyContent: 'center' }}
                >
                  Yes, Reset
                </button>
                <button 
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Edit Preferences Form */}
      <div className="card" style={{ padding: '40px' }}>
        <h1 style={{ fontSize: '2.0rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: 'var(--burgundy)', margin: '0 0 24px 0' }}>
          Profile & Preferences
        </h1>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 1: Account Settings */}
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--navy)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '16px', fontFamily: 'Playfair Display, serif' }}>
              Account Settings
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="form-row">
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Full Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Email Address</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" />
              </div>
            </div>
          </div>

          {/* Section 2: Genres */}
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--navy)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '16px', fontFamily: 'Playfair Display, serif' }}>
              My Genres (Recommendations Source)
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {GENRES.map(g => {
                const isSelected = selectedGenres.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => toggleGenre(g)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      border: '1.5px solid',
                      borderColor: isSelected ? 'var(--burgundy)' : 'var(--border)',
                      background: isSelected ? 'var(--burgundy)' : 'transparent',
                      color: isSelected ? 'white' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Languages */}
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--navy)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '16px', fontFamily: 'Playfair Display, serif' }}>
              Preferred Languages
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {LANGUAGES.map(l => {
                const isSelected = selectedLangs.includes(l);
                return (
                  <button
                    type="button"
                    key={l}
                    onClick={() => toggleLang(l)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      border: '1.5px solid',
                      borderColor: isSelected ? 'var(--gold)' : 'var(--border)',
                      background: isSelected ? 'var(--gold)' : 'transparent',
                      color: isSelected ? 'white' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <button type="submit" className="btn-primary" style={{ marginTop: '12px', justifyContent: 'center' }}>
            Save Changes ✨
          </button>
        </form>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
          .form-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
