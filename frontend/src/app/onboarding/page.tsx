'use client';
import { useAppStore } from '@/lib/zustandStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Sparkles, BookOpen, User, Check, ChevronRight, Star, ArrowLeft, Award } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const STEPS = ['Genres', 'Authors', 'Books', 'Goals', 'Preview'];
const ALL_GENRES = ['Mystery', 'Thriller', 'Fantasy', 'Adventure', 'Science', 'History', 'Biography', 'Philosophy', 'Psychology', 'Business', 'Technology', 'Self Help', 'Education', 'Finance', 'Productivity', 'Leadership', 'Innovation', 'Space', 'Physics', 'Fiction', 'Computer Science', 'Artificial Intelligence', 'Cybersecurity', 'Data Science'];
const GOAL_OPTIONS = [
  { label: 'Casual Reader', value: 6, desc: '1-2 books per month' },
  { label: 'Avid Reader', value: 12, desc: '1 book per week' },
  { label: 'Bookworm', value: 24, desc: '2 books per month' },
  { label: 'Bibliophile', value: 52, desc: '1 book per week' },
];

const DEMO_SAMPLE_BOOKS = [
  { id: 1, title: 'The Hobbit', author: 'J.R.R. Tolkien' },
  { id: 2, title: 'Dune', author: 'Frank Herbert' },
  { id: 3, title: 'Sapiens', author: 'Yuval Noah Harari' },
  { id: 4, title: 'Steve Jobs', author: 'Walter Isaacson' },
  { id: 5, title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman' },
  { id: 6, title: 'Atomic Habits', author: 'James Clear' },
];

export default function Onboarding() {
  const { user, setPreferences, setOnboarded, token, addToast } = useAppStore();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);
  const [goal, setGoal] = useState(GOAL_OPTIONS[1]);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  const complete = async () => {
    const prefs = {
      preferred_genres: selectedGenres,
      preferred_authors: selectedAuthors,
      preferred_languages: ['English'],
      onboarding_completed: true,
    };
    setPreferences(prefs);
    setOnboarded(true);

    try {
      await fetch(`${API}/users/me/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(prefs),
      });
    } catch {}

    addToast('Welcome! Your recommendations are ready.', 'success');
    router.push('/');
  };

  if (!user) return null;

  const progress = ((step + 1) / STEPS.length) * 100;

  const container: React.CSSProperties = {
    maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px',
    display: 'flex', flexDirection: 'column', gap: 32, minHeight: '100vh',
  };

  return (
    <div style={container} className="fade-in">
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="progress-bar" style={{ flex: 1, height: 6 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#8A827A', minWidth: 50, textAlign: 'right' }}>
          {step + 1}/{STEPS.length}
        </span>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{
            padding: '6px 16px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
            background: i === step ? '#6A1B29' : i < step ? '#10b981' : '#E8E2D9',
            color: i <= step ? '#fff' : '#8A827A', transition: 'all 0.3s',
          }}>{s}</div>
        ))}
      </div>

      {/* Step 1: Genres */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}><Sparkles size={40} style={{ color: '#D4AF37' }} /></div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', margin: 0 }}>
              What genres do you love?
            </h1>
            <p style={{ color: '#8A827A', marginTop: 8, fontWeight: 500 }}>Pick at least 3 to get started.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {ALL_GENRES.map(g => {
              const sel = selectedGenres.includes(g);
              return (
                <button key={g} onClick={() => setSelectedGenres(prev =>
                  prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
                )} style={{
                  padding: '12px 24px', borderRadius: 30, border: '2px solid',
                  borderColor: sel ? '#6A1B29' : '#E8E2D9', cursor: 'pointer',
                  background: sel ? '#6A1B29' : 'transparent',
                  color: sel ? '#fff' : '#4A4540', fontWeight: 700, fontSize: '0.88rem',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  {sel && <Check size={14} />}{g}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Authors */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}><User size={40} style={{ color: '#D4AF37' }} /></div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', margin: 0 }}>
              Any favorite authors?
            </h1>
            <p style={{ color: '#8A827A', marginTop: 8, fontWeight: 500 }}>Type author names to follow them.</p>
          </div>
          <input
            placeholder="e.g., J.K. Rowling, Stephen King..."
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val && !selectedAuthors.includes(val)) {
                  setSelectedAuthors([...selectedAuthors, val]);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
            className="input-field" style={{ textAlign: 'center' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', minHeight: 40 }}>
            {selectedAuthors.map(a => (
              <span key={a} className="badge" style={{ background: '#6A1B29', color: '#fff', padding: '8px 16px', fontSize: '0.82rem' }}>
                {a}
                <button onClick={() => setSelectedAuthors(selectedAuthors.filter(x => x !== a))}
                  style={{ background: 'none', border: 'none', color: '#fff', marginLeft: 6, cursor: 'pointer', fontSize: '0.8rem' }}>x</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Books */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}><BookOpen size={40} style={{ color: '#D4AF37' }} /></div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', margin: 0 }}>
              Select some favorites
            </h1>
            <p style={{ color: '#8A827A', marginTop: 8, fontWeight: 500 }}>Pick books you have enjoyed reading.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {DEMO_SAMPLE_BOOKS.map(b => {
              const sel = selectedBooks.includes(b.id);
              return (
                <button key={b.id} onClick={() => setSelectedBooks(prev =>
                  prev.includes(b.id) ? prev.filter(x => x !== b.id) : [...prev, b.id]
                )} style={{
                  padding: 16, borderRadius: 16, border: '2px solid',
                  borderColor: sel ? '#6A1B29' : '#E8E2D9', cursor: 'pointer',
                  background: sel ? 'rgba(106,27,41,0.06)' : '#fff', textAlign: 'left',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ width: 40, height: 56, background: '#F5EFEB', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#8A827A' }}>
                    {sel ? <Check size={18} style={{ color: '#6A1B29' }} /> : '📚'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E1B18' }}>{b.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8A827A' }}>{b.author}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Goals */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}><Award size={40} style={{ color: '#D4AF37' }} /></div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', margin: 0 }}>
              Set a reading goal
            </h1>
            <p style={{ color: '#8A827A', marginTop: 8, fontWeight: 500 }}>How many books do you want to read this year?</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
            {GOAL_OPTIONS.map(g => (
              <button key={g.label} onClick={() => setGoal(g)} style={{
                padding: 24, borderRadius: 20, border: '2px solid',
                borderColor: goal.label === g.label ? '#6A1B29' : '#E8E2D9', cursor: 'pointer',
                background: goal.label === g.label ? 'rgba(106,27,41,0.06)' : '#fff',
                textAlign: 'center', transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#6A1B29' }}>{g.value}</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1E1B18', marginTop: 4 }}>{g.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#8A827A', marginTop: 4 }}>{g.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Preview */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}><Star size={60} style={{ color: '#D4AF37' }} /></div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', margin: 0 }}>
            You're all set!
          </h1>
          <p style={{ color: '#8A827A', fontWeight: 500, maxWidth: 400 }}>
            We'll personalize your recommendations based on {selectedGenres.length} genres, {selectedAuthors.length} authors, {selectedBooks.length} books, and a {goal.value}-book yearly goal.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {selectedGenres.slice(0, 6).map(g => <span key={g} className="badge" style={{ background: '#6A1B29', color: '#fff' }}>{g}</span>)}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 'auto', paddingTop: 24 }}>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="btn-secondary" style={{ padding: '14px 32px' }}>
            <ArrowLeft size={16} /> Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(step + 1)}
            className="btn-primary" style={{ padding: '14px 32px' }}
            disabled={step === 0 && selectedGenres.length < 3}>
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={complete} className="btn-primary" style={{ padding: '14px 40px', background: '#10b981' }}>
            <Star size={16} /> Start Reading
          </button>
        )}
      </div>
    </div>
  );
}
