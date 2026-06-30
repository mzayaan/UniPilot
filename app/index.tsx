import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { LoadingSpinner } from '../src/components/ui/LoadingSpinner';

/**
 * Root entry point — redirects to the appropriate screen based on auth state.
 * This prevents Expo Router from having an undefined initial route.
 */
export default function RootIndex() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/(auth)/welcome');
    } else if (!profile?.onboarding_complete) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [session, profile, loading]);

  return <LoadingSpinner fullScreen />;
}
