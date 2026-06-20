'use client';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AccessDenied() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 72px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
      background: 'linear-gradient(135deg, var(--cream) 0%, var(--surface) 100%)',
    }}>
      <div className="card" style={{
        maxWidth: '480px', width: '100%', padding: '48px',
        borderRadius: '28px', textAlign: 'center',
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '24px',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px auto',
        }}>
          <ShieldAlert size={36} color="#ef4444" />
        </div>
        
        <h1 style={{
          fontFamily: 'Cinzel, serif', fontSize: '2rem', fontWeight: 700,
          color: 'var(--text)', marginBottom: '12px'
        }}>Access Denied</h1>
        
        <p style={{
          color: 'var(--text-light)', fontSize: '1.05rem', lineHeight: 1.6,
          marginBottom: '32px'
        }}>
          You do not have the required permissions to view this page. This area is restricted to administrators.
        </p>

        <Link href="/" style={{ textDecoration: 'none' }}>
          <button className="primary-button" style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
            <ArrowLeft size={18} />
            Return to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
