import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

// Required for completing the auth session on the callback screen
WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google';

// In Expo Go:          exp://IP:PORT/--/auth/callback
// In production build: unipilot://auth/callback
const REDIRECT_URL = Linking.createURL('auth/callback');

/**
 * Sign in with an OAuth provider via Supabase (PKCE flow).
 *
 * The deep-link callback is handled globally in AuthContext so it fires
 * even when the browser tab is stuck open on Android.
 *
 * iOS:     openAuthSessionAsync intercepts the exp:// redirect → closes browser.
 * Android: Chrome Custom Tab stays open (stuck on loading) → Android delivers
 *          the exp:// URL as an intent to Expo Go → AuthContext's Linking
 *          listener catches it, calls exchangeCodeForSession, session is set.
 */
export async function signInWithOAuth(
  provider: OAuthProvider,
): Promise<{ error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: REDIRECT_URL,
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error: error as Error };
    if (!data.url) return { error: new Error('No OAuth URL returned from Supabase') };

    // Open the browser. On iOS this also intercepts the redirect and closes
    // the browser automatically. On Android the session is established via
    // AuthContext's deep-link listener — the browser may stay open briefly.
    const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URL);

    // iOS path: browser closed with the redirect URL — exchange the code now
    // (AuthContext listener won't fire on iOS since the URL was intercepted)
    if (result.type === 'success' && result.url) {
      const parsed = new URL(result.url);
      const code = parsed.searchParams.get('code');
      if (code) {
        const { error: ex } = await supabase.auth.exchangeCodeForSession(result.url);
        if (ex) return { error: ex as Error };
      }
    }

    return { error: null };
  } catch (err: any) {
    return { error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export const oAuthProviders: Array<{
  id: OAuthProvider;
  label: string;
  icon: string;
  color: string;
}> = [
  { id: 'google', label: 'Google', icon: 'google', color: '#DB4437' },
];
