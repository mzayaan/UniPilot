import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { initPurchases } from '../src/lib/purchases';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Initialise RevenueCat — user identified later via AuthContext after login
    initPurchases().catch(() => {});
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen
              name="auth/callback"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="modules/add"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="modules/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="tasks/add"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="tasks/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="grades/[moduleId]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ai/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="subscription/index"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="settings"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="calendar"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="flashcards"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="quiz"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="budget/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="group-projects/index"
              options={{ headerShown: false }}
            />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
