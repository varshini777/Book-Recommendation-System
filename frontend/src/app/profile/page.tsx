'use client';
import { useAppStore } from '../../lib/zustandStore';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Sparkles, Award, ShieldAlert, Globe, Layers, BookOpen, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

const GENRES = ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction', 'Fantasy', 'Thriller', 'Historical', 'Biography', 'Self-Help', 'Business', 'Philosophy', 'Poetry', 'Drama', 'Adventure'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Russian'];

export default function Profile() {
  const { user, token, library, logout } = useAppStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Update user profile
      const response = await fetch('http://localhost:8000/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, avatar: '👤' }),
      });
      
      if (response.ok) {
        // Update preferences
        const prefsResponse = await fetch('http://localhost:8000/users/me/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            preferred_genres: selectedGenres,
            preferred_languages: selectedLangs,
            preferred_authors: [],
            onboarding_completed: true
          }),
        });
        
        if (prefsResponse.ok) {
          alert('Profile and preferences updated successfully!');
        } else {
          alert('Profile updated but preferences failed');
        }
      } else {
        alert('Error updating profile');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
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

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#6A1B29', marginBottom: '20px' }}>
          Please sign in to view your profile
        </h2>
        <Link href="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }} className="fade-in profile-grid">
      
      {/* Column 1: Stats & Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* User Card */}
        <div className="card" style={{ padding: '36px 28px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #6A1B29, #D4AF37)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 10px 25px rgba(106, 27, 41, 0.15)',
            border: '4px solid #FCFAF6'
          }}>
            <User size={40} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, margin: 0, color: '#1E1B18' }}>
              {name || 'Reader'}
            </h2>
            <p style={{ color: '#8A827A', fontSize: '0.9rem', margin: '6px 0 0 0', fontWeight: 500 }}>
              {email || 'reader@example.com'}
            </p>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <Link href="/edit-profile" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', justifyContent: 'center' }}>
                Edit Profile
              </Link>
              <Link href="/settings" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', justifyContent: 'center' }}>
                <Settings size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Reading Stats */}
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'Playfair Display, serif', color: '#6A1B29', borderBottom: '1px solid #E8E2D9', paddingBottom: '10px', margin: 0, fontWeight: 800 }}>
            Reading Analytics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#F5EFEB', padding: '16px 12px', borderRadius: '14px', textAlign: 'center', border: '1px solid #E8E2D9' }}>
              <Layers size={18} style={{ color: '#6A1B29', marginBottom: '6px' }} />
              <span style={{ display: 'block', fontSize: '1.6rem', fontWeight: 800, color: '#1E1B18', lineHeight: 1.2 }}>{totalBooks}</span>
              <span style={{ fontSize: '0.75rem', color: '#8A827A', fontWeight: 600 }}>Library Books</span>
            </div>
            <div style={{ background: '#F5EFEB', padding: '16px 12px', borderRadius: '14px', textAlign: 'center', border: '1px solid #E8E2D9' }}>
              <BookOpen size={18} style={{ color: '#6A1B29', marginBottom: '6px' }} />
              <span style={{ display: 'block', fontSize: '1.6rem', fontWeight: 800, color: '#1E1B18', lineHeight: 1.2 }}>{currentlyReading}</span>
              <span style={{ fontSize: '0.75rem', color: '#8A827A', fontWeight: 600 }}>Reading Now</span>
            </div>
            <div style={{ background: '#F5EFEB', padding: '16px 12px', borderRadius: '14px', textAlign: 'center', border: '1px solid #E8E2D9' }}>
              <Sparkles size={18} style={{ color: '#D4AF37', marginBottom: '6px' }} />
              <span style={{ display: 'block', fontSize: '1.6rem', fontWeight: 800, color: '#1E1B18', lineHeight: 1.2 }}>{completed}</span>
              <span style={{ fontSize: '0.75rem', color: '#8A827A', fontWeight: 600 }}>Completed</span>
            </div>
            <div style={{ background: '#F5EFEB', padding: '16px 12px', borderRadius: '14px', textAlign: 'center', border: '1px solid #E8E2D9' }}>
              <Award size={18} style={{ color: '#6A1B29', marginBottom: '6px' }} />
              <span style={{ display: 'block', fontSize: '1.6rem', fontWeight: 800, color: '#1E1B18', lineHeight: 1.2 }}>★ {avgRating}</span>
              <span style={{ fontSize: '0.75rem', color: '#8A827A', fontWeight: 600 }}>Avg Rating</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 24px',
            background: '#DC2626',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s',
            justifyContent: 'center'
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      {/* Column 2: Edit Preferences Form */}
      <div className="card" style={{ padding: '48px' }}>
        <h1 style={{ fontSize: '2.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', margin: '0 0 28px 0' }}>
          Reading Preferences
        </h1>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Section 1: Genres */}
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#0E172A', borderBottom: '1px solid #E8E2D9', paddingBottom: '8px', marginBottom: '18px', fontFamily: 'Playfair Display, serif', fontWeight: 800 }}>
              My Genres (Recommendations Source)
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {GENRES.map(g => {
                const isSelected = selectedGenres.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => toggleGenre(g)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '24px',
                      border: '2px solid',
                      borderColor: isSelected ? '#6A1B29' : '#E8E2D9',
                      background: isSelected ? '#6A1B29' : 'transparent',
                      color: isSelected ? 'white' : '#4A4540',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isSelected ? '0 4px 10px rgba(106,27,41,0.12)' : 'none'
                    }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Languages */}
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#0E172A', borderBottom: '1px solid #E8E2D9', paddingBottom: '8px', marginBottom: '18px', fontFamily: 'Playfair Display, serif', fontWeight: 800 }}>
              Preferred Languages
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {LANGUAGES.map(l => {
                const isSelected = selectedLangs.includes(l);
                return (
                  <button
                    type="button"
                    key={l}
                    onClick={() => toggleLang(l)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '24px',
                      border: '2px solid',
                      borderColor: isSelected ? '#D4AF37' : '#E8E2D9',
                      background: isSelected ? '#D4AF37' : 'transparent',
                      color: isSelected ? 'white' : '#4A4540',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isSelected ? '0 4px 10px rgba(212,175,55,0.12)' : 'none'
                    }}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <button type="submit" className="btn-primary" style={{ marginTop: '16px', justifyContent: 'center', padding: '16px', borderRadius: '14px' }} disabled={loading}>
            {loading ? 'Saving...' : <><span>Save Preferences</span><Globe size={18} /></>}
          </button>
        </form>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
