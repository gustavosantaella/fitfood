import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Config } from '@/constants/Config';

function InitialLayout() {
  const { session, loading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (session) {
      if (profile) {
        if (!profile.onboarding_completed && !inOnboarding) {
          // If onboarding not completed, redirect to onboarding screen
          router.replace('/onboarding');
        } else if (profile.onboarding_completed && inOnboarding) {
          // If onboarding completed, redirect to dashboard
          router.replace('/(tabs)');
        } else if (inAuthGroup) {
          // If logged in but on login/register pages, redirect to dashboard
          router.replace('/(tabs)');
        }
      }
    } else if (!session && !inAuthGroup && segments[0] !== 'splash') {
      // Redirect unauthenticated users to login
      router.replace('/(auth)/login');
    }
  }, [session, loading, segments, profile]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Config.theme.colors.background },
      }}
    >
      <Stack.Screen name="splash" options={{ animation: 'fade' }} />
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="weight-picker" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="liquids-logger" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="gym-workout" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <InitialLayout />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
