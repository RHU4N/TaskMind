import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  useEffect(() => { if (!supabase) { setSession(null); return; } supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => { setSession(next); if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true); }); return () => subscription.unsubscribe(); }, []);
  const value = { session, user: session?.user || null, configured: isSupabaseConfigured, passwordRecovery, signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }), signUp: (email, password, fullName) => supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }), requestPasswordReset: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }), updatePassword: async (password) => { const result = await supabase.auth.updateUser({ password }); if (!result.error) setPasswordRecovery(false); return result; }, signOut: () => supabase.auth.signOut() };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
