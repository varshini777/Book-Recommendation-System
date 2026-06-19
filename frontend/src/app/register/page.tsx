'use client';
import { useAppStore } from '../../lib/zustandStore';
import { useState, useEffect } from 'react';
import { User, Mail, Lock, ArrowRight, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const { user, register, login } = useAppStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const success = await register(name, email, password);
    if (success) {
      const loginSuccess = await login(email, password);
      if (loginSuccess) {
        router.replace('/onboarding');
      } else {
        router.replace('/login');
      }
    } else {
      setError('Registration failed. Email may already be in use.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 72px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      background: 'linear-gradient(135deg, var(--cream) 0%, var(--surface) 100%)',
    }}>
      <div className="card" style={{
        maxWidth: '460px', width: '100%', padding: '40px',
        borderRadius: '28px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--burgundy), var(--gold))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 4px 12px rgba(106, 27, 41, 0.2)',
          }}>
            <BookOpen size={28} color="white" />
          </div>
          <h2 style={{
            fontFamily: 'Playfair Display, serif', fontSize: '1.6rem',
            color: 'var(--text-primary)', margin: '0 0 6px 0', fontWeight: 800,
          }}>
            Join LitRealm
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>
            Create your account and start discovering great books.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
            color: '#dc2626', fontSize: '0.85rem', fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <User size={14} /> Full Name
            </label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="input-field" placeholder="Your full name" />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Mail size={14} /> Email
            </label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Lock size={14} /> Password
            </label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="input-field" placeholder="Min 8 characters" minLength={8} />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Lock size={14} /> Confirm Password
            </label>
            <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
              className="input-field" placeholder="Re-enter password" />
          </div>
          <button type="submit" className="btn-primary" style={{
            padding: '14px 24px', fontSize: '0.95rem',
            display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
            marginTop: '4px',
          }} disabled={loading}>
            {loading ? 'Creating account...' : <><ArrowRight size={16} /> Create Account</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--burgundy)', fontWeight: 700 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
