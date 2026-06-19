'use client';
import { useAppStore } from '@/lib/zustandStore';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, BookOpen, Star, Award, Flame, Target, TrendingUp, Library, LogOut, Settings, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function Profile() {
  const { user, library, logout, addToast, readingGoal, loadReadingGoal, updateReadingGoal } = useAppStore();
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('12');

  useEffect(() => {
    if (!user) router.replace('/login');
    calculateStreak();
  }, [user, library]);

  useEffect(() => {
    if (user) {
      loadReadingGoal();
    }
  }, [user]);

  useEffect(() => {
    if (readingGoal) {
      setGoalInput(readingGoal.target_books.toString());
    }
  }, [readingGoal]);

  const calculateStreak = () => {
    if (library.length === 0) return;
    const days = Math.min(library.filter(e => e.status === 'completed' || e.progress > 0).length, 30);
    setStreak(days);
  };

  if (!user) return null;

  const totalBooks = library.length;
  const reading = library.filter(e => e.status === 'currently_reading').length;
  const completed = library.filter(e => e.status === 'completed').length;
  const wantToRead = library.filter(e => e.status === 'want_to_read').length;
  const rated = library.filter(e => e.rating > 0);
  const avg = rated.length > 0 ? (rated.reduce((a, c) => a + c.rating, 0) / rated.length) : 0;
  const totalProgress = library.reduce((a, e) => a + e.progress, 0);
  const avgProgress = totalBooks > 0 ? Math.round(totalProgress / totalBooks) : 0;
  const pagesRead = library.reduce((a, e) => a + (e.book?.pages || 300) * (e.progress / 100), 0);
  
  const targetBooksCount = readingGoal?.target_books || 12;
  const goalProgress = completed > 0 ? Math.min(100, (completed / targetBooksCount) * 100) : 0;

  const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
    <div style={{ background: '#F5EFEB', padding: '20px 16px', borderRadius: 16, border: '1px solid #E8E2D9', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <div style={{ padding: 8, background: '#fff', borderRadius: 12, display: 'flex' }}>
          <Icon size={20} style={{ color: color || '#6A1B29' }} />
        </div>
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E1B18', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#8A827A', fontWeight: 600, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: '#8A827A', fontWeight: 500, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }} className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40, flexWrap: 'wrap' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #6A1B29, #D4AF37)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #FCFAF6', boxShadow: '0 10px 25px rgba(106,27,41,0.15)' }}>
          <User size={32} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, margin: 0, color: '#1E1B18' }}>{user.name}</h1>
          <p style={{ color: '#8A827A', margin: '4px 0 0 0', fontSize: '0.9rem', fontWeight: 500 }}>{user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/edit-profile" className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}><Settings size={14} /> Edit</Link>
          <button onClick={() => { logout(); router.push('/login'); }}
            style={{ padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, marginBottom: 40 }}>
        <StatCard icon={Library} label="Total Books" value={totalBooks} color="#6A1B29" />
        <StatCard icon={BookOpen} label="Currently Reading" value={reading} color="#3b82f6" />
        <StatCard icon={Star} label="Completed" value={completed} color="#10b981" />
        <StatCard icon={Flame} label="Reading Streak" value={`${streak}d`} color="#f59e0b" sub="days active" />
        <StatCard icon={Target} label="Avg Rating" value={avg.toFixed(1)} color="#D4AF37" sub="/ 5" />
        <StatCard icon={TrendingUp} label="Avg Progress" value={`${avgProgress}%`} color="#8B5CF6" />
        <StatCard icon={Calendar} label="Pages Read" value={Math.round(pagesRead).toLocaleString()} color="#EC4899" />
        <StatCard icon={Award} label="Want to Read" value={wantToRead} color="#6B7280" />
      </div>

      {/* Reading Goal & Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28, marginBottom: 40 }}>
        {/* Goal */}
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, margin: 0, color: '#0E172A', display: 'flex', alignItems: 'center' }}>
              <Target size={18} style={{ color: '#D4AF37', marginRight: 8 }} /> {new Date().getFullYear()} Reading Goal
            </h3>
            
            {isEditingGoal ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  style={{
                    width: '60px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    outline: 'none',
                    textAlign: 'center'
                  }}
                />
                <button
                  onClick={async () => {
                    const parsed = parseInt(goalInput);
                    if (isNaN(parsed) || parsed <= 0) {
                      addToast('Please enter a valid positive number for your goal', 'error');
                      return;
                    }
                    const success = await updateReadingGoal(parsed);
                    if (success) {
                      setIsEditingGoal(false);
                    }
                  }}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingGoal(false);
                    setGoalInput(targetBooksCount.toString());
                  }}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--burgundy)' }}>
                  {completed} / {targetBooksCount}
                </span>
                <button
                  onClick={() => setIsEditingGoal(true)}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '8px' }}
                >
                  Edit Goal
                </button>
              </div>
            )}
          </div>
          
          <div className="progress-bar" style={{ height: 12, marginBottom: 8 }}>
            <div className="progress-fill" style={{ width: `${goalProgress}%` }} />
          </div>
          
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#8A827A', fontWeight: 500 }}>
            {goalProgress >= 100 
              ? 'Goal completed! Amazing! 🎉' 
              : `${Math.max(0, targetBooksCount - completed)} more books to reach your goal`}
          </p>
        </div>

        {/* Genre distribution */}
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, margin: '0 0 16px 0', color: '#0E172A' }}>
            <Award size={18} style={{ color: '#D4AF37', marginRight: 8 }} /> Library Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Completed', value: completed, pct: totalBooks > 0 ? (completed / totalBooks) * 100 : 0, color: '#10b981' },
              { label: 'Reading', value: reading, pct: totalBooks > 0 ? (reading / totalBooks) * 100 : 0, color: '#3b82f6' },
              { label: 'Want to Read', value: wantToRead, pct: totalBooks > 0 ? (wantToRead / totalBooks) * 100 : 0, color: '#6B7280' },
            ].map(d => (
              <div key={d.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#4A4540', marginBottom: 4 }}>
                  <span>{d.label}</span><span>{d.value} ({Math.round(d.pct)}%)</span>
                </div>
                <div className="progress-bar" style={{ height: 6 }}>
                  <div style={{ height: '100%', borderRadius: 6, background: d.color, width: `${d.pct}%`, transition: 'width 0.6s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{ padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, margin: 0, color: '#0E172A' }}>
            Recent Activity
          </h3>
          <Link href="/library" style={{ color: '#6A1B29', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View Library <ChevronRight size={14} />
          </Link>
        </div>
        {library.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {library.slice(0, 5).map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, background: '#F5EFEB', borderRadius: 12, border: '1px solid #E8E2D9' }}>
                <div style={{ width: 36, height: 50, background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#8A827A' }}>📚</div>
                <div style={{ flex: 1 }}>
                  <Link href={`/catalog/${e.book_id}`} style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1E1B18', textDecoration: 'none' }}>
                    {e.book?.title || `Book #${e.book_id}`}
                  </Link>
                  <div style={{ fontSize: '0.75rem', color: '#8A827A', marginTop: 2 }}>
                    {e.status?.replace(/_/g, ' ')} · {e.progress}% complete
                  </div>
                </div>
                {e.rating > 0 && <span style={{ color: '#D4AF37', fontWeight: 700 }}>{'★'.repeat(e.rating)}</span>}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#8A827A' }}>
            <p style={{ fontWeight: 600 }}>No books in your library yet.</p>
            <Link href="/catalog" className="btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>Browse Books</Link>
          </div>
        )}
      </div>
    </div>
  );
}
