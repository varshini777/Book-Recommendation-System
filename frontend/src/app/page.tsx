'use client';
import { useAppStore } from '../lib/zustandStore';
import BookCard from '../components/BookCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Sparkles, Library, Search, User, Mail, Globe, BookOpen, ThumbsUp, ArrowRight, Award, Flame } from 'lucide-react';
import { BOOKS, Book } from '../lib/data';

const GENRES = ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction', 'Fantasy', 'Thriller', 'Historical', 'Biography', 'Self-Help', 'Business', 'Philosophy', 'Poetry', 'Drama', 'Adventure'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Russian'];

export default function Home() {
  const { user, token, library } = useAppStore();
  const router = useRouter();
  const [recommended, setRecommended] = useState<Book[]>([]);
  const [trending, setTrending] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
    loadTrending();
  }, [user]);

  const loadRecommendations = async () => {
    try {
      const response = await fetch('http://localhost:8000/recommendations/?limit=8', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const books = Array.isArray(data) ? data : data.books || [];
        setRecommended(books.length > 0 ? books : BOOKS.slice(0, 8));
      } else {
        setRecommended(BOOKS.slice(0, 8));
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setRecommended(BOOKS.slice(0, 8));
    }
  };

  const loadTrending = async () => {
    try {
      const response = await fetch('http://localhost:8000/recommendations/trending?limit=8');
      if (response.ok) {
        const data = await response.json();
        const books = Array.isArray(data) ? data : data.books || [];
        setTrending(books.length > 0 ? books : BOOKS.slice(8, 16));
      } else {
        setTrending(BOOKS.slice(8, 16));
      }
    } catch (error) {
      console.error('Error loading trending:', error);
      setTrending(BOOKS.slice(8, 16));
    }
  };

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '60px' }} className="fade-in">
      
      {/* Hero Header Banner */}
      <section className="hero-gradient" style={{ color: 'white', padding: '90px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.08, backgroundImage: 'radial-gradient(#D4AF37 1.2px, transparent 0)', backgroundSize: '28px 28px' }}></div>
        
        {/* Glow ambient background details */}
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '120px', height: '120px', background: '#D4AF37', borderRadius: '50%', filter: 'blur(90px)', opacity: 0.2 }}></div>
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: '150px', height: '150px', background: '#6A1B29', borderRadius: '50%', filter: 'blur(90px)', opacity: 0.2 }}></div>

        <div style={{ maxWidth: '850px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 16px', borderRadius: '24px', fontWeight: 600, color: '#D4AF37', fontSize: '0.85rem' }}>
            <Sparkles size={14} />
            <span>Welcome back, {user.name}</span>
          </div>
          
          <h1 style={{ fontSize: '3.6rem', fontWeight: 800, margin: '24px 0 16px 0', fontFamily: 'Playfair Display, serif', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Discover Your Next <span style={{ color: '#D4AF37' }}>Literary Companion</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#ECE5DB', maxWidth: '650px', margin: '0 auto 36px auto', lineHeight: 1.6 }}>
            Our mathematical similarity algorithm mapped out fresh choices aligned with your reading preferences.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/catalog" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} />
              <span>Explore Catalog</span>
            </Link>
            <Link href="/library" className="btn-secondary" style={{ padding: '14px 32px', borderColor: 'rgba(255,255,255,0.3)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Library size={18} />
              <span>Personal Library</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main recommendation sections */}
      <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '56px' }}>
        
        {/* Recommended "For You" Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6A1B29' }}>
                <Award size={20} style={{ color: '#D4AF37' }} />
                <h2 className="section-title" style={{ margin: 0, fontSize: '1.8rem' }}>Tailored For You</h2>
              </div>
              <p style={{ color: '#8A827A', fontSize: '0.88rem', margin: '4px 0 0 0', fontWeight: 500 }}>
                Personalized recommendations based on your reading history and preferences.
              </p>
            </div>
            <Link href="/catalog" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6A1B29', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>Loading recommendations...</div>
          ) : recommended.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '28px' }}>
              {recommended.map((b: any) => (
                <BookCard key={b.id} book={b} showScore={true} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8A827A' }}>
              Add books to your library to get personalized recommendations.
            </div>
          )}
        </section>

        {/* Highlighted Banner Callout */}
        <section className="card" style={{ 
          background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.7) 100%)', 
          border: '1px solid #E8E2D9', 
          borderRadius: '28px', 
          padding: '40px 48px', 
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          alignItems: 'center', 
          gap: '40px',
        }}>
          <div style={{ 
            fontSize: '3rem', 
            background: 'white', 
            padding: '20px', 
            borderRadius: '24px', 
            boxShadow: '0 8px 24px rgba(106, 27, 41, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '90px',
            height: '90px'
          }} className="hide-mobile">
            <Sparkles size={40} style={{ color: '#D4AF37' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.45rem', fontFamily: 'Playfair Display, serif', color: '#6A1B29', fontWeight: 800, margin: '0 0 8px 0' }}>
              Did you know you can customize recommendations?
            </h3>
            <p style={{ color: '#8A827A', margin: '0 0 24px 0', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 500 }}>
              Add books to your Library, update your reading progress, or add review ratings. The hybrid content filtration updates dynamically in real-time as you log details.
            </p>
            <Link href="/library" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span>Open My Library</span>
              <Library size={16} />
            </Link>
          </div>
        </section>

        {/* Trending/Popular Books */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6A1B29' }}>
                <Flame size={20} style={{ color: '#6A1B29' }} />
                <h2 className="section-title" style={{ margin: 0, fontSize: '1.8rem' }}>Worldwide Trends</h2>
              </div>
              <p style={{ color: '#8A827A', fontSize: '0.88rem', margin: '4px 0 0 0', fontWeight: 500 }}>
                Most read, discussed, and highest rated titles among global readers.
              </p>
            </div>
          </div>
          {trending.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '28px' }}>
              {trending.map((b: any) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8A827A' }}>
              Loading trending books...
            </div>
          )}
        </section>

      </div>
      
      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
