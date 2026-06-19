'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cpu, Database, Layers, Settings, BarChart3, Sparkles, BookOpen, Globe, GitBranch } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ModelInfo {
  model_type: string;
  features: string[];
  total_users_rated: number;
  total_ratings: number;
  average_rating: number;
  algorithms_used: Record<string, number>;
}

export default function DemoPage() {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/recommendations/metrics`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setInfo(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: 48 }} className="fade-in">
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontFamily: 'Playfair Display, serif', fontWeight: 800,
          color: 'var(--burgundy)', margin: '0 0 8px 0',
        }}>
          LitRealm - Professor Demo
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500, margin: 0, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          MCA Final Year Project — Intelligent Book Recommendation System using TF-IDF &amp; Cosine Similarity
        </p>
      </div>

      <div className="card" style={{ padding: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #6A1B29, #D4AF37)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={24} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, margin: 0 }}>ML Model Architecture</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hybrid recommendation engine</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {[
            { icon: Database, title: 'Dataset', desc: 'Goodbooks-10k — 9,007 books, 4,262 authors, 24 genres' },
            { icon: Layers, title: 'Vectorizer', desc: 'TF-IDF with max_features=5000, ngram_range=(1,2)' },
            { icon: GitBranch, title: 'Similarity', desc: 'Cosine Similarity on sparse TF-IDF vectors' },
            { icon: Sparkles, title: 'Ranking', desc: 'Hybrid weighted score: 0.4 sim + 0.2 pref + 0.15 pop + 0.15 rating + 0.1 fresh' },
            { icon: BarChart3, title: 'Features', desc: 'Content-based, collaborative filtering, genre preference, cold-start handling' },
            { icon: Globe, title: 'Languages', desc: 'Multi-language support with language-based filtering' },
          ].map(item => (
            <div key={item.title} style={{ padding: 20, background: 'var(--surface)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(106,27,41,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.icon size={18} style={{ color: 'var(--burgundy)' }} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{item.title}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {info && (
        <div className="card" style={{ padding: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #1A237E, #6A1B29)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, margin: 0 }}>System Metrics</h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Live dataset statistics</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {[
              { label: 'Total Users Rated', value: info.total_users_rated },
              { label: 'Total Ratings', value: info.total_ratings },
              { label: 'Avg Rating', value: info.average_rating.toFixed(1) },
              { label: 'Algorithms', value: Object.keys(info.algorithms_used).length },
              { label: 'Model Type', value: info.model_type.split('(')[0].trim() },
              { label: 'Features', value: info.features.length },
            ].map(m => (
              <div key={m.label} style={{ padding: 16, background: 'var(--surface)', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--burgundy)' }}>{m.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #2E7D32, #1A237E)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={24} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, margin: 0 }}>System Architecture</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Full-stack technology stack</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { title: 'Backend', items: ['FastAPI (Python 3.11)', 'SQLAlchemy ORM', 'SQLite Database', 'JWT Authentication', 'TF-IDF Vectorizer', 'Scikit-learn'] },
            { title: 'Frontend', items: ['Next.js 14 (React 18)', 'TypeScript', 'Zustand State Management', 'Lucide Icons', 'CSS Variables (Theme)', 'Responsive Design'] },
            { title: 'ML Pipeline', items: ['TF-IDF Vectorization', 'Cosine Similarity', 'Hybrid Weighted Ranking', 'Genre Preference Matching', 'Cold-Start Handling', 'Diversity Injection'] },
            { title: 'Features', items: ['Personalized Recommendations', 'Also Enjoyed / Similar Books', 'Reading Analytics', 'Library Management', 'Genre/Author Browsing', 'Search with Autocomplete'] },
          ].map(section => (
            <div key={section.title} style={{ padding: 20, background: 'var(--surface)', borderRadius: 14 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 14px', color: 'var(--burgundy)' }}>{section.title}</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {section.items.map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--burgundy)', flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Link href="/" className="btn-primary" style={{ padding: '14px 32px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 10, borderRadius: 14 }}>
          <BookOpen size={18} /> Explore the System
        </Link>
      </div>
    </div>
  );
}
