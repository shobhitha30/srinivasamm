import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ensureUserProfile, getUserProfile } from '../services/profileService';
import { normalizeRole } from '../lib/roles';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileResolved, setProfileResolved] = useState(false);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  // True once the initial session check has finished. Auth forms key off this
  // (not `loading`) so a sign-in attempt never unmounts the form and lose errors.
  const [bootstrapped, setBootstrapped] = useState(false);
  const inflightSyncs = useRef(new Map());
  const lastUserIdRef = useRef(null);

  // A new user just signed in: profileResolved still refers to the previous
  // (or anonymous) state, so hold routing until their profile is fetched.
  function trackUser(currentUser) {
    const nextId = currentUser?.id ?? null;
    if (lastUserIdRef.current !== nextId) {
      lastUserIdRef.current = nextId;
      if (currentUser) setProfileResolved(false);
    }
  }

  async function repairProfileFromServer(role = null, accessToken = null) {
    try {
      if (!accessToken) return null;

      const res = await fetch('/api/auth/fix-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ role }),
        signal:
          typeof AbortSignal !== 'undefined' && AbortSignal.timeout
            ? AbortSignal.timeout(3000)
            : undefined,
      });
      if (!res.ok) return null;

      const body = await res.json();
      return body?.profile ?? null;
    } catch (err) {
      console.error('Profile repair failed:', err);
      return null;
    }
  }

  // Asks the API server to mark an address as verified so the user can sign
  // in straight away instead of waiting for a confirmation email.
  async function confirmEmail(email) {
    try {
      const res = await fetch('/api/auth/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal:
          typeof AbortSignal !== 'undefined' && AbortSignal.timeout
            ? AbortSignal.timeout(6000)
            : undefined,
      });
      return res.ok;
    } catch (err) {
      console.warn('Auto-confirm unavailable:', err);
      return false;
    }
  }

  async function syncAndFetchProfile(currentUser, fullNameInput = null, accessToken = null) {
    // getSession() and the INITIAL_SESSION event both fire on cold start —
    // dedupe so we only run one profile fetch / repair per user.
    const syncKey = `${currentUser.id}|${fullNameInput ?? ''}`;
    const inflight = inflightSyncs.current.get(syncKey);
    if (inflight) return inflight;

    const run = (async () => {
      try {
        const storedRole = localStorage.getItem('srinivasam_oauth_role');
        const intentRole =
          normalizeRole(storedRole) || normalizeRole(currentUser.user_metadata?.role);

        let userProf = await getUserProfile(currentUser.id);
        const needsRepair =
          !userProf || (userProf.role === 'donor' && !!intentRole && intentRole !== 'donor');

        if (needsRepair) {
          userProf =
            (await repairProfileFromServer(intentRole, accessToken)) ||
            (await ensureUserProfile(currentUser, fullNameInput, intentRole).catch((err) => {
              console.warn('Profile upsert failed:', err);
              return null;
            })) ||
            userProf;
        }

        localStorage.removeItem('srinivasam_oauth_role');
        setProfile(userProf ?? null);
        return userProf ?? null;
      } catch (err) {
        console.warn('Profile sync warning:', err);
        return null;
      } finally {
        setProfileResolved(true);
        setLoading(false);
      }
    })();

    inflightSyncs.current.set(syncKey, run);
    try {
      return await run;
    } finally {
      inflightSyncs.current.delete(syncKey);
    }
  }

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        const sessionUser = session?.user ?? null;
        trackUser(sessionUser);
        setUser(sessionUser);
        if (sessionUser) {
          syncAndFetchProfile(sessionUser, null, session.access_token);
        } else {
          setProfileResolved(true);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Initial session check failed:', err);
        setProfileResolved(true);
        setLoading(false);
      })
      .finally(() => {
        setBootstrapped(true);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        trackUser(currentUser);
        setUser(currentUser);
        setBootstrapped(true);

        if (currentUser) {
          await syncAndFetchProfile(currentUser, null, session?.access_token);
        } else {
          setProfile(null);
          setProfileResolved(true);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signUp(email, password, fullName, role = 'donor') {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (error) {
        if (error.message?.includes('User already registered') || error.message?.includes('already exists')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        throw error;
      }

      // No session = the address still needs verifying. Verify it server-side
      // and sign straight in, so signup lands in the portal with no email step.
      if (data?.user && !data?.session) {
        const confirmed = await confirmEmail(email);
        if (confirmed) {
          const { data: signin, error: signinError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signinError) {
            const msg = signinError.message || '';
            if (msg.includes('Invalid login credentials')) {
              throw new Error(
                'This email is already registered with a different password. Please sign in instead.'
              );
            }
            throw signinError;
          }
          data.session = signin.session;
          data.user = signin.user;
        }
      }

      let prof = null;
      if (data?.session && data?.user) {
        prof = await syncAndFetchProfile(data.user, fullName, data.session.access_token);
      }

      return { ...data, profile: prof };
    } finally {
      setLoading(false);
    }
  }

  async function signInWithPassword(email, password) {
    setLoading(true);
    try {
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Email confirmation is not enforced — verify the address and retry once
      // so an existing unconfirmed account can still sign in directly.
      if (error && error.message?.includes('Email not confirmed')) {
        const confirmed = await confirmEmail(email);
        if (confirmed) {
          ({ data, error } = await supabase.auth.signInWithPassword({ email, password }));
        }
      }

      if (error) throw error;

      let prof = null;
      if (data?.user) {
        prof = await syncAndFetchProfile(data.user, null, data.session?.access_token);
      }

      return { ...data, profile: prof };
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle(role = 'donor') {
    if (role) {
      localStorage.setItem('srinivasam_oauth_role', role);
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) throw error;
    return data;
  }

  async function signOut() {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setProfileResolved(true);
    setLoading(false);
    if (error) throw error;
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
  }

  async function updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message || 'Could not update profile.');

    const updated = data || { id: userId, ...profile, ...updates };
    setProfile(updated);
    return updated;
  }

  const value = {
    user,
    session,
    profile,
    profileResolved,
    bootstrapped,
    loading,
    notice,
    setNotice,
    signUp,
    signInWithPassword,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
