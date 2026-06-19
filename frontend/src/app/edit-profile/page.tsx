'use client';
import { useState } from 'react';
import { useAppStore } from '../../lib/zustandStore';
import { User, Mail, Camera, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function EditProfile() {
  const { user, setUser, addToast } = useAppStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '👤');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAppStore.getState().token}`
        },
        body: JSON.stringify({ name, avatar }),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        addToast('Profile updated successfully!', 'success');
      } else {
        addToast('Error updating profile', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      addToast('Error updating profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const avatarOptions = ['👤', '👨', '👩', '🧑', '👴', '👵', '🧔', '👱', '👱‍♀️', '🦰', '🦱', '🦳', '🧑‍🦰', '👨‍🦰', '👩‍🦰'];

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#6A1B29', marginBottom: '20px' }}>
          Please sign in to edit your profile
        </h2>
        <Link href="/login" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <Link href="/profile" style={{ textDecoration: 'none', color: '#8A827A', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Profile</span>
        </Link>
      </div>

      <div className="card" style={{ padding: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6A1B29, #D4AF37)',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', margin: 0 }}>
              Edit Profile
            </h1>
            <p style={{ color: '#8A827A', margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: 500 }}>
              Update your personal information
            </p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Avatar Selection */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: '#4A4540' }}>
              <Camera size={14} /> Avatar
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              {avatarOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAvatar(opt)}
                  style={{
                    fontSize: '2rem',
                    padding: '12px',
                    borderRadius: '12px',
                    border: avatar === opt ? '3px solid #6A1B29' : '2px solid #E8E2D9',
                    background: avatar === opt ? 'rgba(106, 27, 41, 0.1)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              background: '#F5EFEB',
              borderRadius: '12px'
            }}>
              <span style={{ fontSize: '3rem' }}>{avatar}</span>
              <div>
                <p style={{ fontWeight: 600, color: '#1E1B18', margin: '0 0 4px 0' }}>Current Avatar</p>
                <p style={{ fontSize: '0.85rem', color: '#8A827A', margin: 0 }}>This will be displayed on your profile</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#4A4540' }}>
              <User size={14} /> Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Your full name"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#4A4540' }}>
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="input-field"
              style={{ background: '#F5EFEB', cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: '0.75rem', color: '#8A827A', marginTop: '6px' }}>
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          {/* Account Info */}
          <div style={{
            padding: '20px',
            background: '#F5EFEB',
            borderRadius: '12px',
            border: '1px solid #E8E2D9'
          }}>
            <p style={{ fontWeight: 600, color: '#1E1B18', margin: '0 0 12px 0' }}>Account Information</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#8A827A' }}>Role:</span>
                <span style={{ fontWeight: 600, color: '#1E1B18', marginLeft: '8px' }}>{user.role}</span>
              </div>
              <div>
                <span style={{ color: '#8A827A' }}>Status:</span>
                <span style={{ fontWeight: 600, color: '#1E1B18', marginLeft: '8px' }}>{user.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <div>
                <span style={{ color: '#8A827A' }}>Verified:</span>
                <span style={{ fontWeight: 600, color: '#1E1B18', marginLeft: '8px' }}>{user.is_verified ? 'Yes' : 'No'}</span>
              </div>
              <div>
                <span style={{ color: '#8A827A' }}>Member Since:</span>
                <span style={{ fontWeight: 600, color: '#1E1B18', marginLeft: '8px' }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '16px 32px', fontSize: '1rem' }}
            disabled={loading}
          >
            <Save size={18} />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
