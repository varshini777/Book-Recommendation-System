'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      
      if (response.ok) {
        setSuccess(true);
      } else {
        setError('Invalid or expired reset token');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card" style={{ maxWidth: '420px', margin: '80px auto', padding: '36px', borderRadius: '24px', textAlign: 'center' }}>
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
          <CheckCircle2 size={32} style={{ color: '#6A1B29' }} />
        </div>
        <h3 style={{ fontSize: '1.4rem', color: '#1E1B18', margin: '0 0 8px 0', fontFamily: 'Playfair Display, serif', fontWeight: 800 }}>
          Password Reset Successful
        </h3>
        <p style={{ color: '#8A827A', margin: '0 0 24px 0', fontSize: '0.92rem', fontWeight: 500 }}>
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
        <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span>Sign In</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '420px', margin: '80px auto', padding: '36px', borderRadius: '24px' }}>
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#6A1B29', marginBottom: '24px', textAlign: 'center' }}>
        <Lock size={24} style={{ marginRight: '8px' }} />
        Reset Password
      </h2>
      <p style={{ color: '#8A827A', marginBottom: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
        Enter your new password below.
      </p>
      
      {error && (
        <div style={{
          background: '#FEE2E2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#4A4540' }}>
            <Lock size={16} /> New Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field"
            placeholder="Minimum 8 characters"
            minLength={8}
          />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#4A4540' }}>
            <Lock size={16} /> Confirm Password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="input-field"
            placeholder="Re-enter your password"
          />
        </div>
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '12px 24px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
          disabled={loading || !token}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
          <ArrowRight size={16} />
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: '#8A827A' }}>
        Remember your password?{' '}
        <Link href="/login" style={{ color: '#6A1B29', fontWeight: 600 }}>
          Sign In
        </Link>
      </p>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '80px 20px' }}>Loading reset form...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
