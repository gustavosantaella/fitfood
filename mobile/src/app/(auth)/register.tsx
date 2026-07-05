import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, Heart } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Config } from '@/constants/Config';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { SuccessModal, ErrorModal } from '@/components/modal';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { signUp } = useAuth();
  const router = useRouter();

  const validate = () => {
    const tempErrors: typeof errors = {};
    
    if (!fullName.trim()) {
      tempErrors.fullName = 'El nombre completo es requerido';
    }
    
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
    
    if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);

    if (error) {
      setModalTitle('Error de Registro');
      setModalMessage(error.message || 'No se pudo crear la cuenta');
      setShowError(true);
    } else {
      setModalTitle('Cuenta Creada');
      setModalMessage('¡Registro exitoso! Por favor inicia sesión con tus nuevas credenciales.');
      setShowSuccess(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Heart size={32} color={Config.theme.colors.primary} fill={Config.theme.colors.primary} />
            </View>
            <Text style={styles.title}>Crea tu Cuenta</Text>
            <Text style={styles.subtitle}>Únete a {Config.appName} y comienza a registrar tu progreso hoy</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Nombre Completo"
              placeholder="Ej. Juan Pérez"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              error={errors.fullName}
              icon={<User size={20} color={Config.theme.colors.textSecondary} />}
            />

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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              error={errors.password}
              icon={<Lock size={20} color={Config.theme.colors.textSecondary} />}
            />

            <Input
              label="Confirmar Contraseña"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              error={errors.confirmPassword}
              icon={<Lock size={20} color={Config.theme.colors.textSecondary} />}
            />

            <Button
              title="Registrarse"
              onPress={handleRegister}
              loading={loading}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
              <Button
                title="Inicia Sesión"
                variant="text"
                onPress={() => router.replace('/(auth)/login')}
                style={styles.footerLink}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccess}
        title={modalTitle}
        message={modalMessage}
        onClose={() => {
          setShowSuccess(false);
          router.replace('/(auth)/login');
        }}
      />

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
    marginBottom: Config.theme.spacing.lg,
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
