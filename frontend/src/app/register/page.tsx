'use client';
import { useAppStore } from '../../lib/zustandStore';
import { useState, useEffect, useMemo } from 'react';
import { User, Mail, Lock, ArrowRight, BookOpen, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PasswordRule {
  label: string;
  test: (p: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters',               test: (p) => p.length >= 8 },
  { label: 'At least one uppercase letter (A-Z)',  test: (p) => /[A-Z]/.test(p) },
  { label: 'At least one lowercase letter (a-z)',  test: (p) => /[a-z]/.test(p) },
  { label: 'At least one number (0-9)',             test: (p) => /[0-9]/.test(p) },
  { label: 'At least one special character',        test: (p) => /[!@#$%^&*()\-_+=\[\]{}|;:'",.<>?/\\`~]/.test(p) },
];

function getStrength(password: string): { label: string; color: string; width: string } {
  const score = PASSWORD_RULES.filter(r => r.test(password)).length;
  if (password.length === 0) return { label: '', color: 'transparent', width: '0%' };
  if (score <= 2) return { label: 'Weak',   color: '#ef4444', width: '33%'  };
  if (score <= 4) return { label: 'Medium', color: '#f59e0b', width: '66%'  };
  return              { label: 'Strong',  color: '#22c55e', width: '100%' };
}

export default function Register() {
  const { user, register, login } = useAppStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      if (user.onboarded) {
        router.replace('/');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [user, router]);

  const strength = useMemo(() => getStrength(password), [password]);
  const allRulesPassed = useMemo(() => PASSWORD_RULES.every(r => r.test(password)), [password]);
  const passwordsMatch = password === confirm;
  const canSubmit = allRulesPassed && passwordsMatch && name.trim().length > 0 && email.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!allRulesPassed) { setError('Please ensure your password meets all requirements.'); return; }
    if (!passwordsMatch) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const success = await register(name, email, password);
    if (success) {
      const loginSuccess = await login(email, password);
      router.replace(loginSuccess ? '/onboarding' : '/login');
    } else {
      setError('Registration failed. Email may already be in use.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', background: 'linear-gradient(135deg, var(--cream) 0%, var(--surface) 100%)',
    }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '40px', borderRadius: '28px' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--burgundy), var(--gold))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px auto', boxShadow: '0 4px 12px rgba(106,27,41,0.2)',
          }}>
            <BookOpen size={28} color="white" />
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: 'var(--text-primary)', margin: '0 0 6px 0', fontWeight: 800 }}>
            Join LitRealm
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>
            Create your account and start discovering great books.
          </p>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
            color: '#dc2626', fontSize: '0.85rem', fontWeight: 500,
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── Full Name ── */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <User size={14} /> Full Name
            </label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="input-field" placeholder="Your full name" />
          </div>

          {/* ── Email ── */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Mail size={14} /> Email
            </label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="input-field" placeholder="you@example.com" />
          </div>

          {/* ── Password ── */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Lock size={14} /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required value={password}
                onChange={e => { setPassword(e.target.value); setPasswordTouched(true); }}
                className="input-field" placeholder="Create a strong password"
                style={{ paddingRight: '44px' }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength bar */}
            {passwordTouched && password.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Password strength</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: strength.color }}>{strength.label}</span>
                </div>
                <div style={{ height: '6px', borderRadius: '99px', background: 'var(--surface)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '99px', width: strength.width, background: strength.color, transition: 'width 0.3s ease, background 0.3s ease' }} />
                </div>
              </div>
            )}

            {/* Rules checklist */}
            {passwordTouched && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 500, color: passed ? '#22c55e' : 'var(--text-muted)', transition: 'color 0.2s ease' }}>
                      {passed ? <CheckCircle2 size={13} color="#22c55e" /> : <XCircle size={13} color="#9ca3af" />}
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Confirm Password ── */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Lock size={14} /> Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                required value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="input-field" placeholder="Re-enter password"
                style={{ paddingRight: '44px', borderColor: confirm.length > 0 && !passwordsMatch ? '#ef4444' : undefined }}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirm.length > 0 && !passwordsMatch && (
              <p style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '4px', fontWeight: 500 }}>Passwords do not match.</p>
            )}
          </div>

          {/* ── Submit ── */}
          <button type="submit" className="btn-primary" disabled={!canSubmit || loading}
            style={{
              padding: '14px 24px', fontSize: '0.95rem',
              display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '4px',
              opacity: canSubmit && !loading ? 1 : 0.5,
              cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
              transition: 'opacity 0.2s ease',
            }}>
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
