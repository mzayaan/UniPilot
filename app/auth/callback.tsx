import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../src/lib/supabase';
import { Colors } from '../../src/lib/theme';

// CRITICAL: must be called in the component that receives the redirect
// This signals Expo that the auth session is complete and closes the browser
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      try {
        const url = await Linking.getInitialURL();
        if (!url) {
          router.replace('/(auth)/welcome');
          return;
        }

        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) {
            console.error('[AuthCallback] exchangeCodeForSession error:', error.message);
            router.replace('/(auth)/welcome');
            return;
          }
        } else {
          const hash = parsed.hash;
          if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
            }
          }
        }

        // AuthContext onAuthStateChange listener will handle navigation
        setTimeout(() => router.replace('/'), 300);
      } catch (err) {
        console.error('[AuthCallback] Unexpected error:', err);
        router.replace('/(auth)/welcome');
      }
    }

    handleCallback();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}
