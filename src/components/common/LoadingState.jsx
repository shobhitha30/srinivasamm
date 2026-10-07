import React from 'react';

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" role="status" aria-label="Loading" />
      <p>{message}</p>
    </div>
  );
}
