import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AuthNotice() {
  const { notice, setNotice } = useAuth();

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);

  if (!notice) return null;

  return (
    <div className="auth-notice-wrap">
      <div className={`alert alert-${notice.type || 'info'} auth-notice`} role="status">
        <span>{notice.text}</span>
        <button
          type="button"
          onClick={() => setNotice(null)}
          className="auth-notice-close"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
