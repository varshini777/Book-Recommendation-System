'use client';
import { useApp } from '../lib/store';
import { getRecommendations, getTrending } from '../lib/recommendations';
import BookCard from '../components/BookCard';
import Link from 'next/link';
import { GENRES, LANGUAGES } from '../lib/data';
import { useState } from 'react';

export default function Home() {
  const { onboarded, setOnboarded, prefs, setPrefs, user, setUser, library } = useApp();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['English']);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLogin, setIsLogin] = useState(false);

  // Recommendation calculations
  const excludeIds = library.map(e => e.book.id);
  const recommended = getRecommendations({
    genres: prefs.genres.length > 0 ? prefs.genres : ['Fiction', 'Classic'],
    languages: prefs.languages.length > 0 ? prefs.languages : ['English']
  }, excludeIds, 8);
  const trending = getTrending(8);

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGenres.length === 0 || selectedLangs.length === 0) {
      alert("Please select at least one genre and language to generate recommendations!");
      return;
    }
    setPrefs({
      genres: selectedGenres,
      languages: selectedLangs,
      authors: []
    });
    setUser({
      name: userName || 'Reader',
      email: userEmail || 'reader@example.com',
      avatar: '👤'
    });
    setOnboarded(true);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      name: userName || 'Book Lover',
      email: userEmail || 'user@example.com',
      avatar: '👤'
    });
    setOnboarded(true);
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

  // 1. If not onboarded (or not logged in), show Onboarding Wizard/Registration flow
  if (!onboarded || !user) {
    return (
      <div style={{ minHeight: 'calc(100vh - 68px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'var(--cream)' }}>
        <div style={{ maxWidth: '800px', width: '100%', padding: '40px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', animation: 'fadeInUp 0.6s ease' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '3rem' }}>📚</span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '12px 0 6px 0', color: 'var(--burgundy)', fontFamily: 'Playfair Display, serif' }}>
              Welcome to LitRealm
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
              Your intelligent personalized book discovery community.
            </p>
          </div>

          <form onSubmit={handleOnboardingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Step 1: User Profile info */}
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--navy)', borderBottom: '1.5px solid var(--border)', paddingBottom: '8px', fontFamily: 'Playfair Display, serif' }}>
                1. Create Your Account
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Full Name</label>
                  <input required type="text" placeholder="Your Name" value={userName} onChange={e => setUserName(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Email Address</label>
                  <input required type="email" placeholder="you@example.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="input-field" />
                </div>
              </div>
            </div>

            {/* Step 2: Genres selection */}
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--navy)', borderBottom: '1.5px solid var(--border)', paddingBottom: '8px', fontFamily: 'Playfair Display, serif' }}>
                2. Select Preferred Genres (Choose 2 or more)
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {GENRES.map(g => {
                  const isSelected = selectedGenres.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => toggleGenre(g)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: '1.5px solid',
                        borderColor: isSelected ? 'var(--burgundy)' : 'var(--border)',
                        background: isSelected ? 'var(--burgundy)' : 'transparent',
                        color: isSelected ? 'white' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Languages selection */}
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: 'var(--navy)', borderBottom: '1.5px solid var(--border)', paddingBottom: '8px', fontFamily: 'Playfair Display, serif' }}>
                3. Choose Preferred Languages
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {LANGUAGES.map(l => {
                  const isSelected = selectedLangs.includes(l);
                  return (
                    <button
                      type="button"
                      key={l}
                      onClick={() => toggleLang(l)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: '1.5px solid',
                        borderColor: isSelected ? 'var(--gold)' : 'var(--border)',
                        background: isSelected ? 'var(--gold)' : 'transparent',
                        color: isSelected ? 'white' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.05rem', marginTop: '12px' }}>
              Create Account & Get Recommendations ✨
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Onboarded User Dashboard
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '60px' }} className="fade-in">
      
      {/* Hero Header Banner */}
      <section className="hero-gradient" style={{ color: 'white', padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: 'radial-gradient(var(--gold) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: '1rem', background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '20px', fontWeight: 600, color: 'var(--gold-light)' }}>
            Welcome back, {user.name}! 📚
          </span>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, margin: '20px 0 16px 0', fontFamily: 'Playfair Display, serif', lineHeight: 1.2 }}>
            Discover Your Next Literary Obsession
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#ECE5DB', maxWidth: '650px', margin: '0 auto 36px auto', lineHeight: 1.6 }}>
            Our recommendation algorithm has curated list-based matches based on your interest preferences in <strong style={{ color: 'var(--gold-light)' }}>{prefs.genres.slice(0, 3).join(', ')}</strong>.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/catalog" className="btn-primary" style={{ padding: '14px 32px' }}>
              Explore Catalog 🔍
            </Link>
            <Link href="/library" className="btn-secondary" style={{ padding: '14px 32px', borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}>
              View My Library 🗂️
            </Link>
          </div>
        </div>
      </section>

      {/* Main recommendation sections */}
      <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
        
        {/* Recommended "For You" Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>Intelligent Suggestions For You</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Cosine similarity vector matching your selected languages and genres.</p>
            </div>
            <Link href="/catalog" style={{ color: 'var(--burgundy)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
              View All →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {recommended.map(b => (
              <BookCard key={b.id} book={b} showScore={true} />
            ))}
          </div>
        </section>

        {/* Highlighted Banner Callout */}
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '40px', display: 'flex', alignItems: 'center', gap: '40px' }} className="card">
          <div style={{ fontSize: '4rem' }} className="hide-mobile">🎯</div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontFamily: 'Playfair Display, serif', color: 'var(--burgundy)', fontWeight: 700, margin: '0 0 8px 0' }}>
              Did you know you can customize recommendations?
            </h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px 0', lineHeight: 1.6 }}>
              Add more ratings, review logs, and progress tracks in your digital Library page. The hybrid content filtering algorithm updates dynamically in real-time as you interact with books.
            </p>
            <Link href="/library" className="btn-primary">
              Open My Library
            </Link>
          </div>
        </section>

        {/* Trending/Popular Books */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>Trending Worldwide</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Most read and highest rated by the community readers.</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {trending.map(b => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
