'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '../lib/zustandStore';
import { useState } from 'react';
import { Home, BookOpen, Library, User, Sun, Moon, Menu, X, Settings } from 'lucide-react';

export default function NavBar() {
  const { darkMode, toggleDark, library, user } = useAppStore();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: '/', label: 'Home', icon: <Home size={16} /> },
    { href: '/catalog', label: 'Catalog', icon: <BookOpen size={16} /> },
    { href: '/library', label: `Library`, count: library.length, icon: <Library size={16} /> },
    { href: '/profile', label: 'Profile', icon: <User size={16} /> },
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: darkMode ? 'rgba(11,15,25,0.9)' : 'rgba(252,250,246,0.9)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '72px',
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--burgundy), var(--gold))',
          padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(106, 27, 41, 0.15)'
        }}>
          <BookOpen size={20} color="white" />
        </div>
        <span style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '1.35rem', fontWeight: 700,
          letterSpacing: '0.08em',
          background: 'linear-gradient(135deg, var(--burgundy), var(--gold))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>LitRealm</span>
      </Link>

      {/* Desktop links */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} className="hide-mobile">
        {links.map(l => {
          const isActive = pathname === l.href;
          return (
            <Link key={l.href} href={l.href} className={`nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {l.icon}
              <span>{l.label}</span>
              {l.count !== undefined && l.count > 0 && (
                <span style={{
                  background: isActive ? 'white' : 'var(--burgundy)',
                  color: isActive ? 'var(--burgundy)' : 'white',
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  marginLeft: '2px',
                  transition: 'all 0.3s'
                }}>
                  {l.count}
                </span>
              )}
            </Link>
          );
        })}
        {user && user.role === 'admin' && (
          <Link href="/admin" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} />
            <span>Admin</span>
          </Link>
        )}
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button onClick={toggleDark} style={{
          background: 'none', border: '1.5px solid var(--border)',
          borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer',
          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s'
        }} title={darkMode ? 'Light mode' : 'Dark mode'} className="btn-secondary">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user ? (
          <>
            <Link href="/profile" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              textDecoration: 'none', color: 'var(--text-primary)',
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              borderRadius: '12px', padding: '6px 14px', fontSize: '0.88rem', fontWeight: 600,
              transition: 'all 0.3s'
            }}>
              <User size={16} style={{ color: 'var(--burgundy)' }} />
              <span>{user.name}</span>
            </Link>
            {user.role === 'admin' && (
              <Link href="/admin" className="show-mobile" style={{
                display: 'none', alignItems: 'center', gap: '8px',
                textDecoration: 'none', color: 'var(--text-primary)',
                background: 'var(--surface)', border: '1.5px solid var(--border)',
                borderRadius: '12px', padding: '6px 14px', fontSize: '0.88rem', fontWeight: 600,
                transition: 'all 0.3s'
              }}>
                <Settings size={16} style={{ color: 'var(--burgundy)' }} />
              </Link>
            )}
          </>
        ) : (
          <Link href="/login" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.88rem' }}>
            Sign In
          </Link>
        )}

        {/* Hamburger for mobile */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          display: 'none', background: 'none', border: 'none',
          fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-primary)'
        }} className="show-mobile">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: '72px', left: 0, right: 0,
          background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
          borderBottom: '1.5px solid var(--border)',
          padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px',
          boxShadow: 'var(--glass-shadow)', animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} className="nav-link" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {l.icon}
              <span style={{ flex: 1 }}>{l.label}</span>
              {l.count !== undefined && l.count > 0 && (
                <span style={{
                  background: 'var(--burgundy)',
                  color: 'white',
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {l.count}
                </span>
              )}
            </Link>
          ))}
          {user && user.role === 'admin' && (
            <Link href="/admin" className="nav-link" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Settings size={16} />
              <span style={{ flex: 1 }}>Admin</span>
            </Link>
          )}
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
