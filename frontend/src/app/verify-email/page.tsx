'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token');
      return;
    }

    // Simulate verification (in real app, this would call the backend)
    setTimeout(() => {
      setStatus('success');
      setMessage('Your email has been successfully verified!');
    }, 1500);
  }, [token]);

  return (
    <div className="card" style={{ maxWidth: '420px', margin: '80px auto', padding: '36px', borderRadius: '24px', textAlign: 'center' }}>
      {status === 'loading' && (
        <>
          <div style={{
            background: '#F5EFEB',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            animation: 'pulse 2s infinite'
          }}>
            <Mail size={32} style={{ color: '#6A1B29' }} />
          </div>
          <h3 style={{ fontSize: '1.4rem', color: '#1E1B18', margin: '0 0 8px 0', fontFamily: 'Playfair Display, serif', fontWeight: 800 }}>
            Verifying Your Email
          </h3>
          <p style={{ color: '#8A827A', margin: '0 0 24px 0', fontSize: '0.92rem', fontWeight: 500 }}>
            Please wait while we verify your email address...
          </p>
        </>
      )}
      
      {status === 'success' && (
        <>
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
            Email Verified!
          </h3>
          <p style={{ color: '#8A827A', margin: '0 0 24px 0', fontSize: '0.92rem', fontWeight: 500 }}>
            {message}
          </p>
          <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>Sign In</span>
            <ArrowRight size={16} />
          </Link>
        </>
      )}
      
      {status === 'error' && (
        <>
          <div style={{
            background: '#FEE2E2',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <XCircle size={32} style={{ color: '#DC2626' }} />
          </div>
          <h3 style={{ fontSize: '1.4rem', color: '#1E1B18', margin: '0 0 8px 0', fontFamily: 'Playfair Display, serif', fontWeight: 800 }}>
            Verification Failed
          </h3>
          <p style={{ color: '#8A827A', margin: '0 0 24px 0', fontSize: '0.92rem', fontWeight: 500 }}>
            {message}
          </p>
          <Link href="/login" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>Back to Sign In</span>
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '80px 20px' }}>Loading verification...</div>}>
      <VerifyEmailStatus />
    </Suspense>
  );
}
