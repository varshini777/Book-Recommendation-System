'use client';
import { useState } from 'react';
import { useAppStore } from '../../lib/zustandStore';
import { Bell, Shield, Palette, Globe, Trash2, Save, Cog } from 'lucide-react';

export default function Settings() {
  const { user, darkMode, toggleDark, logout, addToast } = useAppStore();
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [language, setLanguage] = useState('en');

  const handleSave = () => {
    // Save settings to backend
    addToast('Settings saved successfully!', 'success');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Delete account logic
      addToast('Account deletion requested', 'info');
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#6A1B29', marginBottom: '20px' }}>
          Please sign in to access settings
        </h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #6A1B29, #D4AF37)',
          padding: '12px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Cog size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#6A1B29', margin: 0 }}>
            Settings
          </h1>
          <p style={{ color: '#8A827A', margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: 500 }}>
            Manage your account preferences
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Appearance Settings */}
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Palette size={20} color="#6A1B29" />
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#1E1B18', margin: 0 }}>
              Appearance
            </h3>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #E8E2D9' }}>
            <div>
              <p style={{ fontWeight: 600, color: '#1E1B18', margin: '0 0 4px 0' }}>Dark Mode</p>
              <p style={{ fontSize: '0.85rem', color: '#8A827A', margin: 0 }}>Toggle dark theme</p>
            </div>
            <button
              onClick={toggleDark}
              style={{
                width: '56px',
                height: '28px',
                borderRadius: '14px',
                background: darkMode ? '#6A1B29' : '#E8E2D9',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: 'none'
              }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '3px',
                left: darkMode ? '31px' : '3px',
                transition: 'all 0.3s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Bell size={20} color="#6A1B29" />
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#1E1B18', margin: 0 }}>
              Notifications
            </h3>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #E8E2D9' }}>
            <div>
              <p style={{ fontWeight: 600, color: '#1E1B18', margin: '0 0 4px 0' }}>Push Notifications</p>
              <p style={{ fontSize: '0.85rem', color: '#8A827A', margin: 0 }}>Receive push notifications</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              style={{
                width: '56px',
                height: '28px',
                borderRadius: '14px',
                background: notifications ? '#6A1B29' : '#E8E2D9',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: 'none'
              }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '3px',
                left: notifications ? '31px' : '3px',
                transition: 'all 0.3s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
            <div>
              <p style={{ fontWeight: 600, color: '#1E1B18', margin: '0 0 4px 0' }}>Email Updates</p>
              <p style={{ fontSize: '0.85rem', color: '#8A827A', margin: 0 }}>Receive email notifications</p>
            </div>
            <button
              onClick={() => setEmailUpdates(!emailUpdates)}
              style={{
                width: '56px',
                height: '28px',
                borderRadius: '14px',
                background: emailUpdates ? '#6A1B29' : '#E8E2D9',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: 'none'
              }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: '3px',
                left: emailUpdates ? '31px' : '3px',
                transition: 'all 0.3s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
        </div>

        {/* Language Settings */}
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Globe size={20} color="#6A1B29" />
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#1E1B18', margin: 0 }}>
              Language & Region
            </h3>
          </div>
          
          <div style={{ padding: '16px 0' }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#1E1B18', marginBottom: '12px' }}>
              Preferred Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input-field"
              style={{ cursor: 'pointer' }}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Shield size={20} color="#6A1B29" />
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#1E1B18', margin: 0 }}>
              Security
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px 16px' }}>
              Change Password
            </button>
            <button className="btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px 16px' }}>
              Enable Two-Factor Authentication
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ padding: '32px', border: '2px solid #FECACA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Trash2 size={20} color="#DC2626" />
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 800, color: '#DC2626', margin: 0 }}>
              Danger Zone
            </h3>
          </div>
          
          <div style={{ padding: '16px 0' }}>
            <p style={{ color: '#8A827A', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 500 }}>
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDeleteAccount}
              style={{
                background: '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Trash2 size={16} />
              Delete Account
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="btn-primary"
          style={{ justifyContent: 'center', padding: '16px 32px', fontSize: '1rem' }}
        >
          <Save size={18} />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
}
