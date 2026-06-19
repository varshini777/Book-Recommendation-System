'use client';

import { useAppStore } from '@/lib/zustandStore';

export default function Toast() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxWidth: 360,
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          style={{
            padding: '14px 20px',
            borderRadius: 12,
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            animation: 'slideIn 0.3s ease',
            background:
              t.type === 'success' ? '#10b981' :
              t.type === 'error' ? '#ef4444' : '#3b82f6',
          }}
        >
          {t.message}
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
