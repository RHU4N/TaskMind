import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { parseAuthUrlError } from '../utils/authMessages.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [authCallbackError, setAuthCallbackError] = useState('');
  const [enabledProviders, setEnabledProviders] = useState({ google: false, github: false });

  useEffect(() => {
    const urlErr = parseAuthUrlError(window.location.href);
    if (urlErr) {
      setAuthCallbackError(urlErr);
      const cleanUrl = `${window.location.pathname}`;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    if (!supabase) {
      setSession(null);
      return;
    }

    const viteEnv = import.meta.env ?? {};
    if (viteEnv.VITE_SUPABASE_URL && viteEnv.VITE_SUPABASE_PUBLISHABLE_KEY) {
      fetch(`${viteEnv.VITE_SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: viteEnv.VITE_SUPABASE_PUBLISHABLE_KEY },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((settings) => {
          if (settings?.external) {
            setEnabledProviders({
              google: Boolean(settings.external.google),
              github: Boolean(settings.external.github),
            });
          }
        })
        .catch(() => {});
    }

    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session ?? null))
      .catch(() => setSession(null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next ?? null);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      if (event === 'SIGNED_IN') setAuthCallbackError('');
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user: session?.user || null,
    configured: isSupabaseConfigured,
    passwordRecovery,
    authCallbackError,
    clearAuthCallbackError: () => setAuthCallbackError(''),
    enabledProviders,
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({ email: email.trim(), password }),
    signInWithMagicLink: (email) =>
      supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      }),
    signInWithProvider: (provider) =>
      supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      }),
    signUp: (email, password, profile = {}) => {
      const data =
        typeof profile === 'string'
          ? { full_name: profile.trim() }
          : {
              full_name: (profile.fullName || '').trim(),
              course: (profile.course || '').trim(),
              institution: (profile.institution || '').trim(),
              semester: (profile.semester || '').trim(),
            };
      return supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data, emailRedirectTo: window.location.origin },
      });
    },
    resendConfirmation: (email) =>
      supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      }),
    requestPasswordReset: (email) =>
      supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      }),
    updatePassword: async (password) => {
      const result = await supabase.auth.updateUser({ password });
      if (!result.error) setPasswordRecovery(false);
      return result;
    },
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
