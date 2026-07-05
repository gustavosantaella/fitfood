import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { LogOut, Target, Save, ShieldAlert, Award } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Config } from '@/constants/Config';
import { supabase } from '@/services/supabase';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { WeightChart } from '@/components/WeightChart';

interface WeightLog {
  id: string;
  weight: number;
  logged_at: string;
}

export default function ProfileScreen() {
  const { profile, user, signOut, updateProfile } = useAuth();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);

  // Form states
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [weightGoal, setWeightGoal] = useState(profile?.weight_goal?.toString() || '');
  const [calorieGoal, setCalorieGoal] = useState(profile?.daily_calorie_goal?.toString() || '');
  const [proteinGoal, setProteinGoal] = useState(profile?.daily_protein_goal?.toString() || '');
  const [carbsGoal, setCarbsGoal] = useState(profile?.daily_carbs_goal?.toString() || '');
  const [fatGoal, setFatGoal] = useState(profile?.daily_fat_goal?.toString() || '');
  
  const [saveLoading, setSaveLoading] = useState(false);

  // Sync state with profile updates
  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setWeightGoal(profile.weight_goal?.toString() || '');
      setCalorieGoal(profile.daily_calorie_goal?.toString() || '');
      setProteinGoal(profile.daily_protein_goal?.toString() || '');
      setCarbsGoal(profile.daily_carbs_goal?.toString() || '');
      setFatGoal(profile.daily_fat_goal?.toString() || '');
    }
  }, [profile]);

  const fetchWeightHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('id, weight, logged_at')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: true });

      if (error) throw error;
      setWeightLogs(data || []);
    } catch (err) {
      console.warn('Weight history fetch failed, falling back to mock trend:', err);
      // Fallback weight data
      setWeightLogs([
        { id: '1', weight: 75.4, logged_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '2', weight: 74.8, logged_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '3', weight: 74.2, logged_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '4', weight: 74.5, logged_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '5', weight: 73.9, logged_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '6', weight: 73.4, logged_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '7', weight: 72.8, logged_at: new Date().toISOString() },
      ]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWeightHistory();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWeightHistory();
    setRefreshing(false);
  };

  const handleSaveChanges = async () => {
    setSaveLoading(true);
    const updates = {
      full_name: fullName.trim(),
      weight_goal: weightGoal ? parseFloat(weightGoal) : null,
      daily_calorie_goal: calorieGoal ? parseInt(calorieGoal) : Config.nutrition.defaultCalorieGoal,
      daily_protein_goal: proteinGoal ? parseInt(proteinGoal) : Config.nutrition.defaultProteinGoal,
      daily_carbs_goal: carbsGoal ? parseInt(carbsGoal) : Config.nutrition.defaultCarbsGoal,
      daily_fat_goal: fatGoal ? parseInt(fatGoal) : Config.nutrition.defaultFatGoal,
    };

    const { error } = await updateProfile(updates);
    setSaveLoading(false);

    if (error) {
      Alert.alert('Error', 'No se pudieron actualizar los objetivos.');
    } else {
      Alert.alert('Perfil Guardado', 'Tus metas y datos personales han sido actualizados.');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          const { error } = await signOut();
          if (error) {
            Alert.alert('Error', 'No se pudo cerrar la sesión.');
          } else {
            router.replace('/(auth)/login');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Configuración</Text>
          <Text style={styles.subtitle}>Configura tus metas de salud y revisa tu peso</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Config.theme.colors.primary} />
          }
        >
          {/* User badge */}
          <Card style={styles.profileCard}>
            <View style={styles.badgeRow}>
              <View style={styles.avatar}>
                <Award size={28} color={Config.theme.colors.primary} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{fullName || 'Atleta FitFood'}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>
          </Card>

          {/* Weight history chart card */}
          <Card style={styles.chartCard}>
            <WeightChart logs={weightLogs} />
          </Card>

          {/* Goals form card */}
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <Target size={20} color={Config.theme.colors.primary} />
              <Text style={styles.formTitle}>Tus Objetivos</Text>
            </View>

            <Input
              label="Nombre Completo"
              placeholder="Ej. Juan Pérez"
              value={fullName}
              onChangeText={setFullName}
            />

            <Input
              label="Peso Meta (kg)"
              placeholder="Ej. 70"
              value={weightGoal}
              onChangeText={setWeightGoal}
              keyboardType="numeric"
            />

            <Input
              label="Límite Calórico Diario (kcal)"
              placeholder="Ej. 2000"
              value={calorieGoal}
              onChangeText={setCalorieGoal}
              keyboardType="numeric"
            />

            <View style={styles.macrosRow}>
              <View style={[styles.macroCol, { marginRight: Config.theme.spacing.sm }]}>
                <Input
                  label="Prot (g)"
                  placeholder="140"
                  value={proteinGoal}
                  onChangeText={setProteinGoal}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.macroCol, { marginHorizontal: Config.theme.spacing.xs }]}>
                <Input
                  label="Carbs (g)"
                  placeholder="220"
                  value={carbsGoal}
                  onChangeText={setCarbsGoal}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.macroCol, { marginLeft: Config.theme.spacing.sm }]}>
                <Input
                  label="Grasa (g)"
                  placeholder="65"
                  value={fatGoal}
                  onChangeText={setFatGoal}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Button
              title="Guardar Cambios"
              onPress={handleSaveChanges}
              loading={saveLoading}
              icon={<Save size={18} color="#FFFFFF" />}
            />
          </Card>

          {/* Logout button */}
          <Button
            title="Cerrar Sesión"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutBtn}
            textStyle={{ color: Config.theme.colors.error }}
            icon={<LogOut size={18} color={Config.theme.colors.error} />}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.theme.colors.background,
  },
  header: {
    paddingHorizontal: Config.theme.spacing.lg,
    paddingTop: Config.theme.spacing.md,
    marginBottom: Config.theme.spacing.md,
  },
  title: {
    color: Config.theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: Config.theme.spacing.lg,
    paddingBottom: Config.theme.spacing.xl,
  },
  profileCard: {
    marginBottom: Config.theme.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Config.theme.borderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: Config.theme.spacing.md,
  },
  userName: {
    color: Config.theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  userEmail: {
    color: Config.theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  chartCard: {
    marginBottom: Config.theme.spacing.md,
    padding: Config.theme.spacing.md,
  },
  formCard: {
    marginBottom: Config.theme.spacing.lg,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.md,
  },
  formTitle: {
    color: Config.theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCol: {
    flex: 1,
  },
  logoutBtn: {
    borderColor: Config.theme.colors.error,
    marginBottom: Config.theme.spacing.lg,
  },
});
