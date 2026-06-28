'use client';
import { useEffect, useState } from 'react';
import { useAppStore } from '../../lib/zustandStore';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Users, ChartBar, BookOpen, Star, Activity, Eye, TrendingUp, LogOut, BarChart3, Target, Zap } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminPage() {
  const { user, token, logout } = useAppStore();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics'>('overview');

  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setTimeout(() => router.push('/login'), 2000);
      return;
    }
    loadStats();
    loadUsers();
    loadMetrics();
  }, [user, token, router]);

  const loadStats = async () => {
    try {
      const response = await fetch(`${API}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch(`${API}/recommendations/metrics`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const handleSelectUser = async (userId: number) => {
    try {
      const response = await fetch(`${API}/admin/users/${userId}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data.user);
        setUserStats(data);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      const endpoint = isActive ? '/admin/users/{id}/deactivate' : '/admin/users/{id}/activate';
      const response = await fetch(`${API}${endpoint.replace('{id}', userId.toString())}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 72px)', background: 'linear-gradient(135deg, #0E172A, #6A1B29)', color: 'white' }}>
        <ShieldCheck size={64} style={{ marginBottom: '20px' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px' }}>Access Denied</h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '24px' }}>You must be an admin to view this page. Redirecting...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6A1B29, #D4AF37)',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', margin: 0 }}>
              Admin Dashboard
            </h1>
            <p style={{ color: '#8A827A', margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: 500 }}>
              Platform management and analytics
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: '#DC2626',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </header>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '2px solid #E8E2D9', paddingBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'overview' ? '#6A1B29' : 'transparent',
            color: activeTab === 'overview' ? 'white' : '#4A4540',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'users' ? '#6A1B29' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#4A4540',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'analytics' ? '#6A1B29' : 'transparent',
            color: activeTab === 'analytics' ? 'white' : '#4A4540',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          Analytics
        </button>
      </div>

      {activeTab === 'overview' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>
          ) : stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <Users size={32} style={{ color: '#6A1B29', marginBottom: '16px' }} />
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1E1B18', marginBottom: '8px' }}>{stats.total_users}</div>
                <div style={{ fontSize: '0.9rem', color: '#8A827A', fontWeight: 600 }}>Total Users</div>
                <div style={{ fontSize: '0.8rem', color: '#8A827A', marginTop: '4px' }}>{stats.active_users} active</div>
              </div>
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <BookOpen size={32} style={{ color: '#6A1B29', marginBottom: '16px' }} />
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1E1B18', marginBottom: '8px' }}>{stats.total_books}</div>
                <div style={{ fontSize: '0.9rem', color: '#8A827A', fontWeight: 600 }}>Total Books</div>
              </div>
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <Star size={32} style={{ color: '#D4AF37', marginBottom: '16px' }} />
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1E1B18', marginBottom: '8px' }}>{stats.total_ratings}</div>
                <div style={{ fontSize: '0.9rem', color: '#8A827A', fontWeight: 600 }}>Total Ratings</div>
              </div>
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <Activity size={32} style={{ color: '#6A1B29', marginBottom: '16px' }} />
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1E1B18', marginBottom: '8px' }}>{stats.total_library_entries}</div>
                <div style={{ fontSize: '0.9rem', color: '#8A827A', fontWeight: 600 }}>Library Entries</div>
              </div>
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <Eye size={32} style={{ color: '#6A1B29', marginBottom: '16px' }} />
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1E1B18', marginBottom: '8px' }}>{stats.page_views_today}</div>
                <div style={{ fontSize: '0.9rem', color: '#8A827A', fontWeight: 600 }}>Page Views Today</div>
                <div style={{ fontSize: '0.8rem', color: '#8A827A', marginTop: '4px' }}>{stats.unique_visitors_today} unique</div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-grid" style={{ gap: '24px' }}>
          <div className="card" style={{ padding: '32px', maxHeight: '70vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: '1.4rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users size={20} /> Users ({users.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {users.map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleSelectUser(u.id)}
                  style={{
                    padding: '16px',
                    background: '#F5EFEB',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: selectedUser?.id === u.id ? '2px solid #6A1B29' : '2px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1E1B18' }}>{u.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#8A827A' }}>{u.email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: u.role === 'admin' ? '#6A1B29' : '#E8E2D9',
                        color: u.role === 'admin' ? 'white' : '#4A4540'
                      }}>{u.role}</span>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: u.is_active ? '#10B981' : '#EF4444',
                        color: 'white'
                      }}>{u.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.4rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ChartBar size={20} /> User Details
            </h2>
            {selectedUser && userStats ? (
              <div>
                <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #E8E2D9' }}>
                  <div style={{ fontWeight: 700, color: '#1E1B18', marginBottom: '4px' }}>{selectedUser.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#8A827A', marginBottom: '12px' }}>{selectedUser.email}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleToggleUserStatus(selectedUser.id, selectedUser.is_active)}
                      style={{
                        padding: '8px 16px',
                        background: selectedUser.is_active ? '#EF4444' : '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {selectedUser.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E1B18', marginBottom: '12px' }}>Library Stats</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '12px', background: '#F5EFEB', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6A1B29' }}>{userStats.library_stats.total_books}</div>
                      <div style={{ fontSize: '0.8rem', color: '#8A827A' }}>Total Books</div>
                    </div>
                    <div style={{ padding: '12px', background: '#F5EFEB', borderRadius: '8px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6A1B29' }}>{userStats.library_stats.avg_progress.toFixed(1)}%</div>
                      <div style={{ fontSize: '0.8rem', color: '#8A827A' }}>Avg Progress</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E1B18', marginBottom: '12px' }}>Status Distribution</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Object.entries(userStats.library_stats.shelf_counts).map(([status, count]) => (
                      <span key={status} style={{
                        padding: '6px 14px',
                        background: '#6A1B29',
                        color: 'white',
                        borderRadius: '16px',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        {status.replace(/_/g, ' ')}: {String(count)}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E1B18', marginBottom: '12px' }}>Engagement</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '12px', background: '#F5EFEB', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6A1B29' }}>{userStats.engagement_stats.total_ratings}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8A827A' }}>Ratings</div>
                    </div>
                    <div style={{ padding: '12px', background: '#F5EFEB', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#D4AF37' }}>{userStats.engagement_stats.avg_rating.toFixed(1)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8A827A' }}>Avg Rating</div>
                    </div>
                    <div style={{ padding: '12px', background: '#F5EFEB', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6A1B29' }}>{userStats.engagement_stats.recent_activity}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8A827A' }}>30d Activity</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8A827A' }}>
                <Users size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>Select a user to view detailed statistics</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {metrics && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
                <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                  <Target size={32} style={{ color: '#6A1B29', marginBottom: '16px' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1E1B18', marginBottom: '4px' }}>{metrics.total_users_rated}</div>
                  <div style={{ fontSize: '0.85rem', color: '#8A827A', fontWeight: 600 }}>Users with Ratings</div>
                </div>
                <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                  <BarChart3 size={32} style={{ color: '#6A1B29', marginBottom: '16px' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1E1B18', marginBottom: '4px' }}>{metrics.total_ratings}</div>
                  <div style={{ fontSize: '0.85rem', color: '#8A827A', fontWeight: 600 }}>Total Ratings</div>
                </div>
                <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                  <Star size={32} style={{ color: '#D4AF37', marginBottom: '16px' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1E1B18', marginBottom: '4px' }}>{metrics.average_rating}</div>
                  <div style={{ fontSize: '0.85rem', color: '#8A827A', fontWeight: 600 }}>Average Rating</div>
                </div>
                <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                  <Zap size={32} style={{ color: '#6A1B29', marginBottom: '16px' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1E1B18', marginBottom: '4px' }}>{Object.keys(metrics.algorithms_used).length}</div>
                  <div style={{ fontSize: '0.85rem', color: '#8A827A', fontWeight: 600 }}>Algorithms Active</div>
                </div>
              </div>

              <div className="card" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '1.4rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TrendingUp size={20} /> Model Information
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#F5EFEB', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6A1B29', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Algorithm</div>
                    <div style={{ fontSize: '0.9rem', color: '#1E1B18', fontWeight: 600 }}>{metrics.model_type}</div>
                  </div>
                  {metrics.features && metrics.features.map((f: string, i: number) => (
                    <div key={i} style={{ padding: '16px', background: '#F5EFEB', borderRadius: '12px' }}>
                      <div style={{ fontSize: '0.9rem', color: '#1E1B18', fontWeight: 600 }}>{f}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: '32px' }}>
                <h2 style={{ fontSize: '1.4rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', marginBottom: '24px' }}>
                  Recommendation Metrics (Precision@10, NDCG)
                </h2>
                <p style={{ color: '#8A827A', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  The system uses TF-IDF vectorization with cosine similarity for content-based filtering, augmented by collaborative filtering (user-based) and a hybrid weighted ranking algorithm. Metrics are computed using leave-one-out evaluation on rated books.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  {[
                    { label: 'Precision@10', desc: 'Relevant items in top-10' },
                    { label: 'Recall@10', desc: 'Coverage of all relevant items' },
                    { label: 'MAP', desc: 'Mean Average Precision' },
                    { label: 'NDCG@10', desc: 'Normalized Discounted Cumulative Gain' },
                  ].map(m => (
                    <div key={m.label} style={{ padding: '14px', background: '#F5EFEB', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6A1B29' }}>{m.label}</div>
                      <div style={{ fontSize: '0.78rem', color: '#8A827A', marginTop: 2 }}>{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {!metrics && (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <TrendingUp size={48} style={{ color: '#6A1B29', marginBottom: '16px' }} />
              <h2 style={{ fontSize: '1.4rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', marginBottom: '12px' }}>
                Loading Analytics...
              </h2>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
