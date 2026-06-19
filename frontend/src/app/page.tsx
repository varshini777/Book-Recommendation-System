'use client';
import { useAppStore } from '../lib/zustandStore';
import BookCard from '../components/BookCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Sparkles, Library, Search, BookOpen, ArrowRight, Award, Flame, Star, TrendingUp, Gem, RefreshCw } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface BookLike {
  id: number;
  title: string;
  author_name?: string;
  cover_url?: string;
  genres?: string[];
  rating?: number;
  year?: number;
  rating_count?: number;
}

export default function Home() {
  const { user, token } = useAppStore();
  const router = useRouter();
  const [recommended, setRecommended] = useState<BookLike[]>([]);
  const [trending, setTrending] = useState<BookLike[]>([]);
  const [newReleases, setNewReleases] = useState<BookLike[]>([]);
  const [topRated, setTopRated] = useState<BookLike[]>([]);
  const [hiddenGems, setHiddenGems] = useState<BookLike[]>([]);
  const [coldStart, setColdStart] = useState<BookLike[]>([]);
  const [loading, setLoading] = useState({ rec: true, trend: true, newRel: true, top: true, gems: true, cold: true });

  useEffect(() => {
    if (!user) {
      loadColdStart();
    } else {
      loadRecommendations();
    }
    loadTrending();
    loadNewReleases();
    loadTopRated();
    loadHiddenGems();
  }, [user]);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  const loadSection = async (url: string, setter: Function, key: string, auth = false) => {
    try {
      const headers: Record<string, string> = {};
      if (auth && token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}${url}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setter(data.books || []);
      }
    } catch (e) {
      console.error(`Error loading ${key}:`, e);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const loadRecommendations = () => loadSection('/recommendations/?limit=8', setRecommended, 'rec', true);
  const loadTrending = () => loadSection('/recommendations/trending?limit=8', setTrending, 'trend');
  const loadNewReleases = () => loadSection('/recommendations/new-releases?limit=8', setNewReleases, 'newRel');
  const loadTopRated = () => loadSection('/recommendations/top-rated?limit=8', setTopRated, 'top');
  const loadHiddenGems = () => loadSection('/recommendations/hidden-gems?limit=8', setHiddenGems, 'gems');
  const loadColdStart = () => loadSection('/recommendations/cold-start?limit=8', setColdStart, 'cold');

  if (!user) return null;

  const Section = ({ title, icon: Icon, subtitle, books, loading: secLoading, link, accent }: any) => (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--burgundy)' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: accent || 'rgba(106,27,41,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} style={{ color: accent ? 'white' : '#D4AF37' }} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>{title}</h2>
          </div>
          {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '6px 0 0 46px', fontWeight: 500 }}>{subtitle}</p>}
        </div>
        {link && (
          <Link href={link} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            color: 'var(--burgundy)', fontWeight: 700, fontSize: '0.85rem',
            textDecoration: 'none', padding: '8px 16px', borderRadius: '10px',
            transition: 'all 0.3s',
          }}>
            <span>View All</span><ArrowRight size={14} />
          </Link>
        )}
      </div>
      {secLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: 340, borderRadius: 20 }} />
          ))}
        </div>
      ) : books.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
          {books.map((b: any) => <BookCard key={b.id} book={b} showExplanation={true} />)}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border)' }}>
          <BookOpen size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>No books available yet</p>
        </div>
      )}
    </section>
  );

  const stats = [
    { label: 'Books', value: '9,000+', icon: BookOpen },
    { label: 'Authors', value: '4,200+', icon: Award },
    { label: 'Genres', value: '24', icon: Sparkles },
    { label: 'Languages', value: 'Multiple', icon: Star },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '56px', paddingBottom: '60px' }} className="fade-in">
      {/* Hero */}
      <section className="hero-gradient" style={{
        color: 'white', padding: '100px 24px 80px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0.06,
          backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}></div>
        <div style={{
          position: 'absolute', top: '15%', left: '10%',
          width: '200px', height: '200px', background: '#D4AF37',
          borderRadius: '50%', filter: 'blur(120px)', opacity: 0.15
        }}></div>
        <div style={{
          position: 'absolute', bottom: '10%', right: '10%',
          width: '250px', height: '250px', background: '#6A1B29',
          borderRadius: '50%', filter: 'blur(120px)', opacity: 0.15
        }}></div>

        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            padding: '8px 20px', borderRadius: '24px',
            fontWeight: 600, color: '#D4AF37', fontSize: '0.85rem',
            marginBottom: '24px',
          }}>
            <Sparkles size={14} />
            <span>Welcome back, {user.name}</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.8rem)', fontWeight: 800,
            margin: '0 0 20px 0', fontFamily: 'Playfair Display, serif',
            lineHeight: 1.1, letterSpacing: '-0.02em',
          }}>
            Discover Your Next<br />
            <span style={{ color: '#D4AF37' }}>Literary Companion</span>
          </h1>

          <p style={{
            fontSize: '1.1rem', color: '#CBD5E1', maxWidth: '620px',
            margin: '0 auto 40px auto', lineHeight: 1.7, fontWeight: 400,
          }}>
            Hybrid content-based and collaborative recommendations powered by TF-IDF cosine similarity across 9,000+ curated books.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/catalog" className="btn-primary" style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '16px 36px', fontSize: '1rem',
            }}>
              <Search size={18} /><span>Explore Catalog</span>
            </Link>
            <Link href="/library" className="btn-secondary" style={{
              padding: '16px 36px', borderColor: 'rgba(255,255,255,0.25)',
              color: 'white', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem',
            }}>
              <Library size={18} /><span>My Library</span>
            </Link>
          </div>

          {/* Stats bar */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1px', marginTop: '48px',
            background: 'rgba(255,255,255,0.08)', borderRadius: '16px',
            overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                padding: '20px', textAlign: 'center',
                background: 'rgba(255,255,255,0.03)',
              }}>
                <s.icon size={20} style={{ color: '#D4AF37', marginBottom: '8px' }} />
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500, marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: '1320px', width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '56px' }}>
        <Section
          title="Tailored For You"
          icon={Award}
          subtitle="Personalized recommendations based on your reading history and preferences."
          books={recommended}
          loading={loading.rec}
          link="/catalog"
          accent="linear-gradient(135deg, #6A1B29, #8B263E)"
        />

        <Section
          title="New Releases"
          icon={Sparkles}
          subtitle="Fresh additions to our catalog."
          books={newReleases}
          loading={loading.newRel}
          link="/catalog"
          accent="linear-gradient(135deg, #1A237E, #283593)"
        />

        <Section
          title="Top Rated"
          icon={Star}
          subtitle="Highest rated books loved by readers worldwide."
          books={topRated}
          loading={loading.top}
          link="/catalog"
          accent="linear-gradient(135deg, #AA7C11, #D4AF37)"
        />

        {/* CTA Card */}
        <section className="card" style={{
          background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(255,255,255,0.6) 100%)',
          border: '1px solid var(--glass-border)',
          borderRadius: '28px', padding: '48px',
          display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '40px',
        }}>
          <div style={{
            fontSize: '3rem', background: 'white', padding: '24px', borderRadius: '24px',
            boxShadow: '0 8px 24px rgba(106, 27, 41, 0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100px', height: '100px',
          }} className="hide-mobile">
            <Sparkles size={44} style={{ color: '#D4AF37' }} />
          </div>
          <div>
            <h3 style={{
              fontSize: '1.5rem', fontFamily: 'Playfair Display, serif',
              color: 'var(--burgundy)', fontWeight: 800, margin: '0 0 10px 0',
            }}>
              Customize Your Recommendations
            </h3>
            <p style={{
              color: 'var(--text-muted)', margin: '0 0 28px 0', lineHeight: 1.7,
              fontSize: '0.95rem', fontWeight: 500,
            }}>
              Add books to your Library, update your reading progress, or add ratings. The hybrid recommendation engine learns from your activity and improves over time.
            </p>
            <Link href="/library" className="btn-primary" style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
            }}>
              <span>Open My Library</span><Library size={16} />
            </Link>
          </div>
        </section>

        <Section
          title="Hidden Gems"
          icon={Gem}
          subtitle="Underrated books with high ratings you might have missed."
          books={hiddenGems}
          loading={loading.gems}
          link="/catalog"
          accent="linear-gradient(135deg, #0E7C6B, #10B981)"
        />

        <Section
          title="Worldwide Trends"
          icon={Flame}
          subtitle="Most popular and highest rated titles among global readers."
          books={trending}
          loading={loading.trend}
          link="/catalog"
          accent="linear-gradient(135deg, #DC2626, #EF4444)"
        />
      </div>

      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
