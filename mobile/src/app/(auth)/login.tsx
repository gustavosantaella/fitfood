import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, Heart } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Config } from '@/constants/Config';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { ErrorModal } from '@/components/modal';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const [showError, setShowError] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const { signIn } = useAuth();
  const router = useRouter();

  const validate = () => {
    const tempErrors: typeof errors = {};
    if (!email) {
      tempErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'El formato de correo no es válido';
    }
    
    if (!password) {
      tempErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      tempErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      // Check if error message refers to unconfirmed email
      const isEmailNotConfirmed = 
        error.message?.toLowerCase().includes('email not confirmed') || 
        error.message?.toLowerCase().includes('email not verified') ||
        error.message?.toLowerCase().includes('confirmar');

      if (isEmailNotConfirmed) {
        setModalTitle('Email no Confirmado');
        setModalMessage('Por favor, revisa tu bandeja de entrada y confirma tu correo electrónico antes de iniciar sesión.');
      } else {
        setModalTitle('Error de Inicio de Sesión');
        setModalMessage(error.message || 'Verifica tu correo o contraseña.');
      }
      setShowError(true);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
            <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Heart size={32} color={Config.theme.colors.primary} fill={Config.theme.colors.primary} />
            </View>
            <Text style={styles.title}>Bienvenido a {Config.appName}</Text>
            <Text style={styles.subtitle}>Ingresa tus datos para continuar tu camino fitness</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Correo Electrónico"
              placeholder="tuemail@correo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              icon={<Mail size={20} color={Config.theme.colors.textSecondary} />}
            />

            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
              icon={<Lock size={20} color={Config.theme.colors.textSecondary} />}
            />

            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
              <Button
                title="Regístrate"
                variant="text"
                onPress={() => router.push('/(auth)/register')}
                style={styles.footerLink}
              />
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>

      <ErrorModal
        visible={showError}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setShowError(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Config.theme.spacing.lg,
    paddingVertical: Config.theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Config.theme.spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: Config.theme.borderRadius.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.md,
  },
  title: {
    color: Config.theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: Config.theme.spacing.xs,
    paddingHorizontal: Config.theme.spacing.md,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: Config.theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Config.theme.spacing.lg,
  },
  footerText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    marginVertical: 0,
    width: 'auto',
    height: 'auto',
    paddingHorizontal: Config.theme.spacing.xs,
  },
});
