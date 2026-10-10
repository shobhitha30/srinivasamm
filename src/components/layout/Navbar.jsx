import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon } from 'lucide-react';
import { ZEFFY_DONATION_URL } from '../../utils/zeffyDonation';

function SrinivasamLogoMark() {
  return (
    <img src="/srinivasam-logo.svg" alt="SriNivasam Logo" style={{ height: '32px', width: 'auto' }} />
  );
}

function HamburgerIcon({ open }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {open ? (
        <>
          <line x1="4" y1="4" x2="18" y2="18" />
          <line x1="18" y1="4" x2="4" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="7" x2="19" y2="7" />
          <line x1="3" y1="11" x2="19" y2="11" />
          <line x1="3" y1="15" x2="19" y2="15" />
        </>
      )}
    </svg>
  );
}

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const closeMenu = () => setMenuOpen(false);
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark');
      setIsDark(true);
    }
  }, []);
  const toggleTheme = () => {
    if (isDark) {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const displayInitial = (profile?.full_name || user?.email || 'D').charAt(0).toUpperCase();
  const displayName = profile?.full_name || user?.email?.split('@')[0] || '';

  const PublicLinks = () => (
    <>
      <Link to="/causes" className={`nav-link${isActive('/causes') ? ' active' : ''}`} onClick={closeMenu}>Explore Causes</Link>
      <Link to="/how-it-works" className={`nav-link${isActive('/how-it-works') ? ' active' : ''}`} onClick={closeMenu}>How It Works</Link>
      <Link to="/blogs" className={`nav-link${isActive('/blogs') ? ' active' : ''}`} onClick={closeMenu}>Blogs</Link>
      <Link to="/trustees" className={`nav-link${isActive('/trustees') ? ' active' : ''}`} onClick={closeMenu}>Trustees</Link>
      <Link to="/faqs" className={`nav-link${isActive('/faqs') ? ' active' : ''}`} onClick={closeMenu}>FAQs</Link>
    </>
  );

  const OrphanageLinks = () => (
    <>
      <Link to="/orphanage/dashboard" className={`nav-link${isActive('/orphanage/dashboard') ? ' active' : ''}`} onClick={closeMenu}>Orphanage Portal</Link>
    </>
  );

  const DonorLinks = () => (
    <>
      <Link to="/dashboard" className={`nav-link${isActive('/dashboard') ? ' active' : ''}`} onClick={closeMenu}>Home</Link>
      <Link to="/causes" className={`nav-link${isActive('/causes') ? ' active' : ''}`} onClick={closeMenu}>Explore</Link>
      <Link to="/donations" className={`nav-link${isActive('/donations') ? ' active' : ''}`} onClick={closeMenu}>My Donations</Link>
      <Link to="/occasions" className={`nav-link${isActive('/occasions') ? ' active' : ''}`} onClick={closeMenu}>My Occasions</Link>
    </>
  );

  const VolunteerLinks = () => (
    <>
      <Link to="/volunteer/dashboard" className={`nav-link${isActive('/volunteer/dashboard') ? ' active' : ''}`} onClick={closeMenu}>Volunteer Dashboard</Link>
      <Link to="/causes" className={`nav-link${isActive('/causes') ? ' active' : ''}`} onClick={closeMenu}>Explore Causes</Link>
    </>
  );

  const AdminLinks = () => (
    <>
      <Link to="/admin/dashboard" className={`nav-link${isActive('/admin/dashboard') ? ' active' : ''}`} onClick={closeMenu}>Admin Dashboard</Link>
    </>
  );

  const getHomePath = () => {
    if (!user) return '/';
    if (profile?.role === 'admin') return '/admin/dashboard';
    if (profile?.role === 'orphanage') return '/orphanage/dashboard';
    if (profile?.role === 'volunteer') return '/volunteer/dashboard';
    return '/dashboard';
  };

  const getLinks = () => {
    if (!user) return <PublicLinks />;
    if (profile?.role === 'admin') return <AdminLinks />;
    if (profile?.role === 'orphanage') return <OrphanageLinks />;
    if (profile?.role === 'volunteer') return <VolunteerLinks />;
    return <DonorLinks />;
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to={getHomePath()} className="navbar-brand" aria-label="Srinivasam home">
          <SrinivasamLogoMark />
          <span className="navbar-brand-name">Srinivasam</span>
        </Link>

        {/* Desktop Links */}
        <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
          {getLinks()}
          <div className="navbar-mobile-auth">
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <Link to="/profile" className="btn btn-outline btn-sm" onClick={closeMenu} style={{ width: '100%', justifyContent: 'center' }}>
                  My Profile ({displayName})
                </Link>
                <button className="btn btn-primary btn-sm" onClick={() => { closeMenu(); handleSignOut(); }} style={{ width: '100%', justifyContent: 'center' }}>
                  Sign out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <Link to="/login" className="btn btn-outline btn-sm" onClick={closeMenu} style={{ width: '100%', justifyContent: 'center' }}>Log in</Link>
                <Link to="/signup" className="btn btn-primary btn-sm" onClick={closeMenu} style={{ width: '100%', justifyContent: 'center' }}>Sign up</Link>
              </div>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="navbar-right">
          {!(profile?.role === 'orphanage' || profile?.role === 'admin' || location.pathname.startsWith('/orphanage') || location.pathname.startsWith('/admin')) && (
            <a
              href={ZEFFY_DONATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-cta btn-sm navbar-donate-btn"
            >
              Donate Now
            </a>
          )}

          {/* Desktop Auth Controls */}
          <div className="navbar-desktop-auth">
            {user ? (
              <div className="navbar-user">
                <Link to="/profile" className="navbar-avatar" aria-label="My profile" title={displayName}>
                  {displayInitial}
                </Link>
                <span className="navbar-name">{displayName}</span>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Link to="/login" className="btn btn-outline btn-sm">Log in</Link>
                <Link to="/signup" className="btn btn-primary btn-sm">Sign up</Link>
              </div>
            )}
          </div>

          <button onClick={toggleTheme} className="btn btn-ghost btn-sm" aria-label="Toggle Theme" style={{ padding: '0.35rem 0.5rem' }}>{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>

          {/* Mobile hamburger */}
          <button
            className="navbar-menu-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </div>
    </nav>
  );
}
