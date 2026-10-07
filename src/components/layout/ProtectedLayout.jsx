import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole, roleHome } from '../../lib/roles';

function LoadingScreen({ text = 'Connecting to Srinivasam...' }) {
  return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>{text}</p>
    </div>
  );
}

function roleGuard(profile, allowedRoles) {
  const role = normalizeRole(profile?.role);
  if (!role) return allowedRoles.includes('donor') ? 'allowed' : roleHome('donor');
  return allowedRoles.includes(role) ? 'allowed' : roleHome(role);
}

export function ProtectedLayout() {
  const { user, profile, profileResolved, loading } = useAuth();

  if (loading || !profileResolved) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  const guard = roleGuard(profile, ['donor', 'admin']);
  if (guard !== 'allowed') return <Navigate to={guard} replace />;

  return <Outlet />;
}

export function AccountLayout() {
  const { user, loading, profileResolved } = useAuth();

  if (loading || (user && !profileResolved)) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function AdminLayout() {
  const { user, profile, loading } = useAuth();
  const isSessionAdmin = sessionStorage.getItem('srinivasam_admin') === 'true';

  if (loading) return <LoadingScreen />;
  if (isSessionAdmin || (user && profile?.role === 'admin')) {
    return <Outlet />;
  }
  return <Navigate to="/admin/login" replace />;
}

export function OrphanageLayout() {
  const { user, profile, profileResolved, loading } = useAuth();

  if (loading || !profileResolved) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  const guard = roleGuard(profile, ['orphanage']);
  if (guard !== 'allowed') return <Navigate to={guard} replace />;

  return <Outlet />;
}

export function VolunteerLayout() {
  const { user, profile, profileResolved, loading } = useAuth();

  if (loading || !profileResolved) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  const guard = roleGuard(profile, ['volunteer']);
  if (guard !== 'allowed') return <Navigate to={guard} replace />;

  return <Outlet />;
}

export function PublicOnlyLayout() {
  const { user, profile, profileResolved, bootstrapped } = useAuth();

  // Key off `bootstrapped` rather than `loading`: `loading` also flips to true
  // while a sign-in/sign-up is in flight, which used to unmount the auth form
  // and silently swallow the error message.
  if (!bootstrapped || (user && !profileResolved)) {
    return <LoadingScreen text="Loading Srinivasam..." />;
  }

  if (user) {
    return <Navigate to={roleHome(profile?.role)} replace />;
  }

  return <Outlet />;
}
