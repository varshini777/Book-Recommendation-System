'use client';
import { useAppStore } from '../../lib/zustandStore';
import { useState, useEffect } from 'react';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const { user, login } = useAppStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await login(email, password);
    if (success) {
      router.replace('/');
    } else {
      alert('Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ maxWidth: '420px', margin: '80px auto', padding: '36px', borderRadius: '24px' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#6A1B29', marginBottom: '24px', textAlign: 'center' }}>
        <User size={24} style={{ marginRight: '8px' }} />
        Sign In
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#4A4540' }}>
            <Mail size={16} /> Email
          </label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-field" />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#4A4540' }}>
            <Lock size={16} /> Password
          </label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input-field" />
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Signing in...' : <><ArrowRight size={16} /> Sign In</>}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: '#8A827A' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: '#6A1B29', fontWeight: 600 }}>Register</Link>
      </p>
      <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.85rem', color: '#8A827A' }}>
        <Link href="/forgot-password" style={{ color: '#6A1B29', fontWeight: 600 }}>Forgot password?</Link>
      </p>
    </div>
  );
}
