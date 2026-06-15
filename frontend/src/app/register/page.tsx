'use client';
import { useAppStore } from '../../lib/zustandStore';
import { useState, useEffect } from 'react';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const { user, register } = useAppStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    
    const success = await register(name, email, password);
    if (success) {
      alert('Registration successful! Please sign in.');
      router.replace('/login');
    } else {
      alert('Registration failed. Email may already be in use.');
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ maxWidth: '460px', margin: '80px auto', padding: '36px', borderRadius: '24px' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#6A1B29', marginBottom: '24px', textAlign: 'center' }}>
        <User size={24} style={{ marginRight: '8px' }} />
        Create Account
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#4A4540' }}>
            <User size={16} /> Name
          </label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Your full name" />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#4A4540' }}>
            <Mail size={16} /> Email
          </label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#4A4540' }}>
            <Lock size={16} /> Password
          </label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Minimum 8 characters" minLength={8} />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#4A4540' }}>
            <Lock size={16} /> Confirm Password
          </label>
          <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className="input-field" placeholder="Re-enter your password" />
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Creating account...' : <><ArrowRight size={16} /> Register</>}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: '#8A827A' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#6A1B29', fontWeight: 600 }}>Sign In</Link>
      </p>
    </div>
  );
}
