'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '../lib/zustandStore';
import { useState, useEffect } from 'react';
import { Home, BookOpen, Library, User, Sun, Moon, Menu, X, Settings, LogOut, BarChart3, Cpu } from 'lucide-react';

export default function NavBar() {
  const { darkMode, toggleDark, library, user, logout } = useAppStore();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const isAdmin = user?.role === 'admin';

  // Base links visible to all authenticated users (and unauthenticated)
  const links = [
    { href: '/', label: 'Home', icon: <Home size={16} /> },
    { href: '/catalog', label: 'Catalog', icon: <BookOpen size={16} /> },
    { href: '/library', label: 'Library', count: library.length, icon: <Library size={16} /> },
    { href: '/profile', label: 'Profile', icon: <User size={16} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  // Admin-only links — completely excluded from DOM for non-admin users
  const adminLinks = isAdmin ? [
    { href: '/analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
    { href: '/demo', label: 'Demo', icon: <Cpu size={16} /> },
    { href: '/admin', label: 'Admin', icon: <Settings size={16} /> },
  ] : [];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: darkMode ? 'rgba(11,15,25,0.92)' : 'rgba(252,250,246,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '72px',
    }}>
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

      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} className="hide-mobile">
        {links.map(l => {
          const isActive = pathname === l.href;
          return (
            <Link key={l.href} href={l.href} className={`nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
              {l.icon}
              <span>{l.label}</span>
              {l.count !== undefined && l.count > 0 && (
                <span style={{
                  background: isActive ? 'white' : 'var(--burgundy)',
                  color: isActive ? 'var(--burgundy)' : 'white',
                  fontSize: '0.7rem',
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
        {adminLinks.map(l => (
          <Link key={l.href} href={l.href} className={`nav-link ${pathname === l.href ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
            {l.icon}
            <span>{l.label}</span>
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button onClick={toggleDark} style={{
          background: 'none', border: '1.5px solid var(--border)',
          borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer',
          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s'
        }} title={darkMode ? 'Light mode' : 'Dark mode'}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user ? (
          <>
            <Link href="/profile" className="hide-mobile" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              textDecoration: 'none', color: 'var(--text-primary)',
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              borderRadius: '12px', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600,
              transition: 'all 0.3s'
            }}>
              <span style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--burgundy), var(--gold))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '0.75rem', fontWeight: 700,
              }}>
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span>{user.name}</span>
            </Link>
            <button onClick={logout} className="hide-mobile" style={{
              background: 'none', border: '1.5px solid var(--border)',
              borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s'
            }} title="Sign out">
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <Link href="/login" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
            Sign In
          </Link>
        )}

        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          display: 'none', background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--text-primary)',
          width: '40px', height: '40px', alignItems: 'center', justifyContent: 'center',
          borderRadius: '12px',
        }} className="show-mobile">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div style={{
          position: 'absolute', top: '72px', left: 0, right: 0,
          background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
          borderBottom: '1.5px solid var(--border)',
          padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '6px',
          boxShadow: 'var(--glass-shadow)', animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} className="nav-link" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px' }}>
              {l.icon}
              <span style={{ flex: 1 }}>{l.label}</span>
              {l.count !== undefined && l.count > 0 && (
                <span style={{
                  background: 'var(--burgundy)',
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {l.count}
                </span>
              )}
            </Link>
          ))}
          {adminLinks.map(l => (
            <Link key={l.href} href={l.href} className="nav-link" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px' }}>
              {l.icon}
              <span style={{ flex: 1 }}>{l.label}</span>
            </Link>
          ))}
          {user && (
            <button onClick={() => { logout(); setMenuOpen(false); }} className="nav-link" style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
              background: 'none', border: 'none', cursor: 'pointer', width: '100%',
              color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600,
            }}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
