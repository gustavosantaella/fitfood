import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart } from 'lucide-react-native';
import { Config } from '@/constants/Config';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth state has finished checking
    if (!loading) {
      const timer = setTimeout(() => {
        if (session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      }, 1500); // Keep splash screen for at least 1.5s for branding effect
      return () => clearTimeout(timer);
    }
  }, [loading, session]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Config.theme.colors.background, '#0F172A']}
        style={styles.gradient}
      >
        <View style={styles.logoContainer}>
          <Heart size={64} color={Config.theme.colors.primary} fill={Config.theme.colors.primary} />
          <Text style={styles.title}>{Config.appName}</Text>
          <Text style={styles.subtitle}>Nutrición & Bienestar con IA</Text>
        </View>

        <ActivityIndicator size="small" color={Config.theme.colors.primary} style={styles.loader} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  title: {
    color: Config.theme.colors.text,
    fontSize: 40,
    fontWeight: '800',
    marginTop: Config.theme.spacing.md,
    letterSpacing: -1,
  },
  subtitle: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: Config.theme.spacing.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  loader: {
    position: 'absolute',
    bottom: 80,
  },
});
