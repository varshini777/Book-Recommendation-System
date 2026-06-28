'use client';
import { useEffect, useState } from 'react';
import { BarChart3, BookOpen, Users, Star, TrendingUp, Layers, Calendar } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DatasetStats {
  total_books: number;
  total_authors: number;
  total_genres: number;
  average_rating: number;
  year_range: { min: number; max: number };
  genre_distribution: Record<string, number>;
  language_distribution: Record<string, number>;
  model_info: {
    algorithm: string;
    vectorizer: string;
    corpus_fields: string[];
    similarity_method: string;
    ranking: string;
  };
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/recommendations/analytics`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />)}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: 'calc(100vh - 72px)' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', marginBottom: 10 }}>Analytics Unavailable</h1>
        <p style={{ color: 'var(--text-muted)' }}>Could not load dataset statistics.</p>
      </div>
    );
  }

  const topGenres = Object.entries(stats.genre_distribution)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 12);
  const maxGenreCount = topGenres.length > 0 ? topGenres[0][1] : 1;



  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: 48 }} className="fade-in">
      <div>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
          fontFamily: 'Playfair Display, serif', fontWeight: 800,
          color: 'var(--burgundy)', margin: '0 0 6px 0',
        }}>
          Reading Analytics
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500, margin: 0 }}>
          Dataset insights and recommendation model performance.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
        {[
          { icon: BookOpen, value: stats.total_books.toLocaleString(), label: 'Books', color: '#6A1B29' },
          { icon: Users, value: stats.total_authors.toLocaleString(), label: 'Authors', color: '#1A237E' },
          { icon: Layers, value: stats.total_genres, label: 'Genres', color: '#2E7D32' },
          { icon: Star, value: stats.average_rating.toFixed(1), label: 'Avg Rating', color: '#D4AF37' },
          { icon: Calendar, value: `${stats.year_range.min} - ${stats.year_range.max}`, label: 'Year Range', color: '#6A1B29' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}11`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, marginBottom: 24, color: 'var(--text-primary)' }}>
            Top Genres by Book Count
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topGenres.map(([name, count]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 100, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>{name}</span>
                <div style={{ flex: 1, height: 20, background: 'var(--surface)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(count / maxGenreCount) * 100}%`,
                    background: 'linear-gradient(90deg, #6A1B29, #D4AF37)',
                    borderRadius: 4,
                    transition: 'width 0.8s ease',
                  }} />
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--burgundy)', minWidth: 40 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

      <div className="card" style={{ padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6A1B29, #D4AF37)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} color="white" />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Recommendation Model
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
          {[
            { label: 'Algorithm', value: stats.model_info.algorithm },
            { label: 'Vectorizer', value: stats.model_info.vectorizer },
            { label: 'Similarity', value: stats.model_info.similarity_method },
            { label: 'Ranking', value: stats.model_info.ranking },
          ].map(item => (
            <div key={item.label} style={{ padding: 16, background: 'var(--surface)', borderRadius: 12 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.5 }}>{item.value}</div>
            </div>
          ))}
          <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 12 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Corpus Fields</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {stats.model_info.corpus_fields.map(f => (
                <span key={f} className="badge" style={{ fontSize: '0.75rem' }}>{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 800px) { .analytics-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
