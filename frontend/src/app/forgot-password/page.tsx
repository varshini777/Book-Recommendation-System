'use client';
import { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setSubmitted(true);
      } else {
        alert('Error sending reset email');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '420px', margin: '80px auto', padding: '36px', borderRadius: '24px' }}>
      {!submitted ? (
        <>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#6A1B29', marginBottom: '24px', textAlign: 'center' }}>
            <Mail size={24} style={{ marginRight: '8px' }} />
            Forgot Password
          </h2>
          <p style={{ color: '#8A827A', marginBottom: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#4A4540' }}>
                <Mail size={16} /> Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
              <ArrowRight size={16} />
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: '#8A827A' }}>
            Remember your password?{' '}
            <Link href="/login" style={{ color: '#6A1B29', fontWeight: 600 }}>
              Sign In
            </Link>
          </p>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: '#F5EFEB',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <Mail size={32} style={{ color: '#6A1B29' }} />
          </div>
          <h3 style={{ fontSize: '1.4rem', color: '#1E1B18', margin: '0 0 8px 0', fontFamily: 'Playfair Display, serif', fontWeight: 800 }}>
            Check Your Email
          </h3>
          <p style={{ color: '#8A827A', margin: '0 0 24px 0', fontSize: '0.92rem', fontWeight: 500 }}>
            We&apos;ve sent a password reset link to your email address.
          </p>
          <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Back to Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
