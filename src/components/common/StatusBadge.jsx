import React from 'react';

const STATUS_CONFIG = {
  verified:  { label: 'Verified',  className: 'badge-verified', dot: '#059669' },
  pending:   { label: 'Pending',   className: 'badge-pending',  dot: '#d97706' },
  rejected:  { label: 'Rejected',  className: 'badge-rejected', dot: '#dc2626' },
  suspended: { label: 'Suspended', className: 'badge-suspended',dot: '#9ca3af' },
  active:    { label: 'Active',    className: 'badge-verified', dot: '#059669' },
  completed: { label: 'Completed', className: 'badge-primary',  dot: '#2563eb' },
  cancelled: { label: 'Cancelled', className: 'badge-rejected', dot: '#dc2626' },
  draft:     { label: 'Draft',     className: 'badge-suspended',dot: '#9ca3af' },
};

/**
 * StatusBadge — shows verification or status labels.
 * @param {string} status — one of: verified, pending, rejected, suspended, active, completed, cancelled, draft
 * @param {boolean} showDot — whether to show a leading dot indicator
 */
export function StatusBadge({ status, showDot = true }) {
  const config = STATUS_CONFIG[status?.toLowerCase()] ?? {
    label: status ?? 'Unknown',
    className: 'badge-suspended',
    dot: '#9ca3af',
  };

  return (
    <span className={`badge ${config.className}`}>
      {showDot && (
        <span
          className="status-dot"
          style={{ background: config.dot }}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
}
