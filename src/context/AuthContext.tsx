import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { UserProfile, Subscription } from '../types';
import { identifyUser, logOutPurchases, getCustomerInfo, syncCustomerInfoToSupabase } from '../lib/purchases';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── OAuth deep-link handler ────────────────────────────────────────────────
    // On Android, Chrome Custom Tab can't intercept exp:// URLs — Android delivers
    // the redirect as a deep-link intent to Expo Go instead. We handle it here
    // (root level) so it's always listening, even while the browser is open.
    async function handleDeepLink(url: string) {
      if (!url.includes('auth/callback')) return;
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        if (code) {
          // PKCE: exchange code for session — onAuthStateChange below picks it up
          await supabase.auth.exchangeCodeForSession(url);
        } else {
          // Implicit flow fallback
          const params = new URLSearchParams(parsed.hash.replace('#', ''));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Deep link handling error:', err);
      }
    }

    // Handle case where app was cold-launched from the OAuth redirect
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });

    // Handle case where the redirect arrives while the app is already running
    // (the common Android scenario — browser stuck, intent delivered to Expo Go)
    const linkingSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    // ── Initial session ────────────────────────────────────────────────────────
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([
          fetchProfile(session.user.id),
          fetchSubscription(session.user.id),
        ]);
        identifyUser(session.user.id).then(async () => {
          const info = await getCustomerInfo();
          if (info) await syncCustomerInfoToSupabase(info, session!.user!.id);
          fetchSubscription(session!.user!.id);
        }).catch(() => {});
      }
      setLoading(false);
    });

    // ── Auth state listener ────────────────────────────────────────────────────
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
          fetchSubscription(session.user.id);
        } else {
          setProfile(null);
          setSubscription(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.unsubscribe();
      linkingSub.remove();
    };
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data as UserProfile);
  }

  async function fetchSubscription(userId: string) {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) setSubscription(data as Subscription);
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    logOutPurchases().catch(() => {});
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  async function refreshSubscription() {
    if (user) await fetchSubscription(user.id);
  }

  return (
    <AuthContext.Provider value={{
      session, user, profile, subscription, loading,
      signUp, signIn, signOut, refreshProfile, refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
