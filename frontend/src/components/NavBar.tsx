'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/store';
import { useState } from 'react';

export default function NavBar() {
  const { darkMode, toggleDark, library, user } = useApp();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '/', label: '🏠 Home' },
    { href: '/catalog', label: '📚 Catalog' },
    { href: '/library', label: `🗂 Library ${library.length > 0 ? `(${library.length})` : ''}` },
    { href: '/profile', label: '👤 Profile' },
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: darkMode ? 'rgba(15,12,8,0.95)' : 'rgba(251,248,241,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '68px',
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.5rem' }}>📖</span>
        <span style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '1.4rem', fontWeight: 700,
          background: 'linear-gradient(135deg, #7B2D42, #C9963A)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>LitRealm</span>
      </Link>

      {/* Desktop links */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} className="hide-mobile">
        {links.map(l => (
          <Link key={l.href} href={l.href} className={`nav-link ${pathname === l.href ? 'active' : ''}`}>
            {l.label}
          </Link>
        ))}
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button onClick={toggleDark} style={{
          background: 'none', border: '1.5px solid var(--border)',
          borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: '1.1rem'
        }} title={darkMode ? 'Light mode' : 'Dark mode'}>
          {darkMode ? '☀️' : '🌙'}
        </button>

        {user ? (
          <Link href="/profile" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            textDecoration: 'none', color: 'var(--text-primary)',
            background: 'var(--surface)', border: '1.5px solid var(--border)',
            borderRadius: '10px', padding: '5px 12px', fontSize: '0.88rem', fontWeight: 500
          }}>
            <span style={{ fontSize: '1.2rem' }}>👤</span>
            {user.name}
          </Link>
        ) : (
          <Link href="/profile" className="btn-primary" style={{ padding: '7px 16px', fontSize: '0.88rem' }}>
            Sign In
          </Link>
        )}

        {/* Hamburger for mobile */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          display: 'none', background: 'none', border: 'none',
          fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-primary)'
        }} className="show-mobile">☰</button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: '68px', left: 0, right: 0,
          background: 'var(--cream)', borderBottom: '1px solid var(--border)',
          padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} className="nav-link" onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
