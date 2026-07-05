import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, RefreshControl, Pressable, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { LogOut, Target, Save, ShieldAlert, Award, Dumbbell, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Config } from '@/constants/Config';
import { supabase } from '@/services/supabase';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { WeightChart } from '@/components/WeightChart';
import { SuccessModal, ErrorModal, ConfirmModal, AiRecommendationModal } from '@/components/modal';
import { FoodService } from '@/services/FoodService';

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

  // Convert YYYY-MM-DD from database to DD/MM/AAAA for the input state
  const formatDateToDisplay = (dateDb: string | null) => {
    if (!dateDb) return '';
    const parts = dateDb.split('-');
    if (parts.length !== 3) return dateDb;
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // YYYY-MM-DD -> DD/MM/YYYY
  };

  // Convert DD/MM/AAAA to YYYY-MM-DD for database saving
  const formatDateToDb = (dateDisplay: string) => {
    if (!dateDisplay) return null;
    const parts = dateDisplay.split('/');
    if (parts.length !== 3) return null;
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD/MM/YYYY -> YYYY-MM-DD
  };

  // Form states
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [weightGoal, setWeightGoal] = useState(profile?.weight_goal?.toString() || '');
  const [calorieGoal, setCalorieGoal] = useState(profile?.daily_calorie_goal?.toString() || '');
  const [proteinGoal, setProteinGoal] = useState(profile?.daily_protein_goal?.toString() || '');
  const [carbsGoal, setCarbsGoal] = useState(profile?.daily_carbs_goal?.toString() || '');
  const [fatGoal, setFatGoal] = useState(profile?.daily_fat_goal?.toString() || '');
  const [height, setHeight] = useState(profile?.height?.toString() || '');
  const [birthDate, setBirthDate] = useState(formatDateToDisplay(profile?.birth_date));
  const [age, setAge] = useState(profile?.age?.toString() || '0');
  const [trainingDays, setTrainingDays] = useState<number | null>(profile?.training_days_per_week || null);
  const [trainingDuration, setTrainingDuration] = useState<string | null>(profile?.training_duration_per_session || null);
  const [exerciseTab, setExerciseTab] = useState<'preguntas' | 'rutina'>('preguntas');
  
  const [waterGoal, setWaterGoal] = useState(profile?.daily_water_goal?.toString() || '2000');
  const [sugarLimit, setSugarLimit] = useState(profile?.daily_sugar_limit?.toString() || '50');
  const [goalsDescription, setGoalsDescription] = useState(profile?.goals_description || '');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  
  const [saveLoading, setSaveLoading] = useState(false);

  // Modal states
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  const handleBirthDateChange = (text: string) => {
    // Keep only numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;

    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }

    setBirthDate(formatted);

    // Calculate age automatically on 8 digits
    if (cleaned.length === 8) {
      const day = parseInt(cleaned.slice(0, 2));
      const month = parseInt(cleaned.slice(2, 4));
      const year = parseInt(cleaned.slice(4, 8));

      // Validate month and day bounds
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const dob = new Date(year, month - 1, day);
        if (!isNaN(dob.getTime())) {
          const today = new Date();
          let calculatedAge = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            calculatedAge--;
          }
          setAge(Math.max(0, calculatedAge).toString());
        }
      }
    }
  };

  // Sync state with profile updates
  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setWeightGoal(profile.weight_goal?.toString() || '');
      setCalorieGoal(profile.daily_calorie_goal?.toString() || '');
      setProteinGoal(profile.daily_protein_goal?.toString() || '');
      setCarbsGoal(profile.daily_carbs_goal?.toString() || '');
      setFatGoal(profile.daily_fat_goal?.toString() || '');
      setHeight(profile.height?.toString() || '');
      setBirthDate(formatDateToDisplay(profile.birth_date));
      setAge(profile.age?.toString() || '0');
      setTrainingDays(profile.training_days_per_week);
      setTrainingDuration(profile.training_duration_per_session);
      setWaterGoal(profile.daily_water_goal?.toString() || '2000');
      setSugarLimit(profile.daily_sugar_limit?.toString() || '50');
      setGoalsDescription(profile.goals_description || '');
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

  const handleCalculateAiGoals = async () => {
    if (!age || parseInt(age) === 0 || !height || parseFloat(height) === 0 || !weightGoal || parseFloat(weightGoal) === 0) {
      setModalTitle('Faltan Datos');
      setModalMessage('Para ajustar tus metas con IA, primero completa tu Edad (Fecha de nacimiento), Estatura y Peso Meta.');
      setShowError(true);
      return;
    }

    setAiLoading(true);
    try {
      const formattedHistory = weightLogs.slice(-5).map(w => ({
        weight: w.weight,
        loggedAt: w.logged_at,
      }));

      const recommendation = await FoodService.getInstance().recommendPlan({
        age: parseInt(age),
        height: parseFloat(height),
        weightGoal: parseFloat(weightGoal),
        trainingDaysPerWeek: trainingDays,
        trainingDurationPerSession: trainingDuration,
        goalsDescription: goalsDescription.trim(),
        weightHistory: formattedHistory,
      });

      setAiRecommendation(recommendation);
      setShowAiModal(true);
    } catch (err: any) {
      setModalTitle('Error de Cálculo');
      setModalMessage(err.message || 'No se pudo generar la recomendación con la IA.');
      setShowError(true);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiGoals = () => {
    if (!aiRecommendation) return;
    setCalorieGoal(aiRecommendation.daily_calorie_goal.toString());
    setProteinGoal(aiRecommendation.daily_protein_goal.toString());
    setCarbsGoal(aiRecommendation.daily_carbs_goal.toString());
    setFatGoal(aiRecommendation.daily_fat_goal.toString());
    setWaterGoal(aiRecommendation.daily_water_goal.toString());
    setSugarLimit(aiRecommendation.daily_sugar_limit.toString());
    setShowAiModal(false);

    setModalTitle('Metas Aplicadas');
    setModalMessage('Se han cargado las metas recomendadas por la IA en el formulario. Presiona "Guardar Cambios" para confirmarlas.');
    setShowSuccess(true);
  };

  const handleSaveChanges = async () => {
    setSaveLoading(true);
    const updates = {
      full_name: fullName.trim(),
      weight_goal: weightGoal ? parseFloat(weightGoal) : null,
      height: height ? parseFloat(height) : null,
      birth_date: formatDateToDb(birthDate),
      age: age ? parseInt(age) : 0,
      training_days_per_week: trainingDays,
      training_duration_per_session: trainingDuration,
      daily_calorie_goal: calorieGoal ? parseInt(calorieGoal) : Config.nutrition.defaultCalorieGoal,
      daily_protein_goal: proteinGoal ? parseInt(proteinGoal) : Config.nutrition.defaultProteinGoal,
      daily_carbs_goal: carbsGoal ? parseInt(carbsGoal) : Config.nutrition.defaultCarbsGoal,
      daily_fat_goal: fatGoal ? parseInt(fatGoal) : Config.nutrition.defaultFatGoal,
      daily_water_goal: waterGoal ? parseFloat(waterGoal) : 2000,
      daily_sugar_limit: sugarLimit ? parseInt(sugarLimit) : 50,
      goals_description: goalsDescription.trim(),
    };

    const { error } = await updateProfile(updates);
    setSaveLoading(false);

    if (error) {
      setModalTitle('Error');
      setModalMessage('No se pudieron actualizar los objetivos.');
      setShowError(true);
    } else {
      setModalTitle('Perfil Guardado');
      setModalMessage('Tus metas y datos personales han sido actualizados.');
      setShowSuccess(true);
    }
  };

  const handleLogout = async () => {
    setModalTitle('Cerrar Sesión');
    setModalMessage('¿Estás seguro de que deseas salir?');
    setOnConfirmAction(() => async () => {
      setShowConfirm(false);
      const { error } = await signOut();
      if (error) {
        setModalTitle('Error');
        setModalMessage('No se pudo cerrar la sesión.');
        setShowError(true);
      } else {
        router.replace('/(auth)/login');
      }
    });
    setShowConfirm(true);
  };

  const getBMIInfo = () => {
    const weightVal = weightLogs.length > 0 
      ? weightLogs[weightLogs.length - 1].weight 
      : (profile?.weight_goal || 0);
    const heightVal = profile?.height || 0;
    
    if (weightVal <= 0 || heightVal <= 0) return null;
    
    const heightMeters = heightVal / 100;
    const bmi = weightVal / (heightMeters * heightMeters);
    
    let category = 'Normal';
    let color = Config.theme.colors.primary;
    
    if (bmi < 18.5) {
      category = 'Bajo peso';
      color = '#3B82F6';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Sobrepeso';
      color = '#F59E0B';
    } else if (bmi >= 30) {
      category = 'Obesidad';
      color = Config.theme.colors.error;
    }
    
    return {
      value: bmi.toFixed(1),
      category,
      color,
    };
  };

  const bmiInfo = getBMIInfo();

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
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Config.theme.colors.primary} />
          }
        >
          <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
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

          {/* Warning Banner if Weight Goal is Unset/0 */}
          {(!profile?.weight_goal || profile.weight_goal === 0) && (
            <Card
              style={styles.warningCard}
              onPress={() => router.push('/weight-picker?mode=goal')}
            >
              <View style={styles.warningHeader}>
                <ShieldAlert size={20} color="#F59E0B" />
                <Text style={styles.warningTitle}>Falta tu Peso Objetivo</Text>
              </View>
              <Text style={styles.warningText}>
                Aún no has definido tu peso meta. Presiona aquí para establecerlo de manera interactiva con nuestra regla.
              </Text>
            </Card>
          )}

          {/* Warning Banner if Height is Unset/0 */}
          {(!profile?.height || profile.height === 0) && (
            <Card
              style={[styles.warningCard, { borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.03)' }]}
              onPress={() => router.push('/weight-picker?type=height')}
            >
              <View style={styles.warningHeader}>
                <ShieldAlert size={20} color="#3B82F6" />
                <Text style={[styles.warningTitle, { color: '#3B82F6' }]}>Falta tu Estatura</Text>
              </View>
              <Text style={styles.warningText}>
                Aún no has definido tu estatura. Presiona aquí para establecerla de manera interactiva con nuestra regla.
              </Text>
            </Card>
          )}

          {/* BMI Info Card */}
          {bmiInfo && (
            <Card style={styles.bmiCard}>
              <View style={styles.bmiHeader}>
                <Text style={styles.bmiLabel}>Índice de Masa Corporal (IMC)</Text>
                <View style={[styles.bmiBadge, { backgroundColor: bmiInfo.color }]}>
                  <Text style={styles.bmiBadgeText}>{bmiInfo.category}</Text>
                </View>
              </View>
              <View style={styles.bmiValueRow}>
                <Text style={styles.bmiValue}>{bmiInfo.value}</Text>
                <Text style={styles.bmiSubtext}>
                  {bmiInfo.category === 'Normal' 
                    ? '¡Excelente! Tu Índice de Masa Corporal se encuentra en un rango de peso saludable.' 
                    : `Tu IMC se encuentra en el rango de ${bmiInfo.category.toLowerCase()}. Mantén tus registros activos para alcanzar tu meta.`}
                </Text>
              </View>
            </Card>
          )}

          {/* Weight history chart card */}
          <Card style={styles.chartCard}>
            <WeightChart logs={weightLogs} />
          </Card>

          {/* Section 1: Mi Información */}
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <Award size={20} color={Config.theme.colors.primary} />
              <Text style={styles.formTitle}>Mi Información</Text>
            </View>

            <Input
              label="Nombre Completo"
              placeholder="Ej. Juan Pérez"
              value={fullName}
              onChangeText={setFullName}
            />

            <Input
              label="Fecha de Nacimiento (DD/MM/AAAA)"
              placeholder="Ej. 12/04/1995"
              value={birthDate}
              onChangeText={handleBirthDateChange}
              keyboardType="numeric"
              maxLength={10}
            />

            <Input
              label="Edad"
              value={age && parseInt(age) > 0 ? `${age} años` : '0 años'}
              editable={false}
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)' }}
            />

            <Pressable onPress={() => router.push('/weight-picker?type=height')}>
              <View pointerEvents="none">
                <Input
                  label="Estatura (cm)"
                  placeholder="Presiona para establecer estatura"
                  value={height && parseFloat(height) > 0 ? `${parseFloat(height).toFixed(1)} cm` : 'Sin definir'}
                  editable={false}
                />
              </View>
            </Pressable>
          </Card>

          {/* Section 2: Mis Objetivos */}
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Target size={20} color={Config.theme.colors.primary} />
                <Text style={styles.formTitle}>Mis Objetivos</Text>
              </View>
              <Pressable 
                onPress={handleCalculateAiGoals} 
                disabled={aiLoading}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Config.theme.borderRadius.sm }}
              >
                <Sparkles size={14} color={Config.theme.colors.secondary} />
                <Text style={{ color: Config.theme.colors.secondary, fontSize: 11, fontWeight: '700', marginLeft: 4 }}>
                  {aiLoading ? 'Ajustando...' : 'Ajustar Valores'}
                </Text>
              </Pressable>
            </View>

            <Pressable onPress={() => router.push('/weight-picker?mode=goal')}>
              <View pointerEvents="none">
                <Input
                  label="Peso Meta (kg)"
                  placeholder="Presiona para establecer peso meta"
                  value={weightGoal && parseFloat(weightGoal) > 0 ? `${parseFloat(weightGoal).toFixed(1)} kg` : 'Sin definir'}
                  editable={false}
                />
              </View>
            </Pressable>

            <Input
              label="Descripción de tu Meta (IA)"
              placeholder="Ej. Quiero ganar masa muscular magra, entrenando fuerte."
              value={goalsDescription}
              onChangeText={setGoalsDescription}
              multiline={true}
              numberOfLines={4}
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

            <View style={styles.macrosRow}>
              <View style={[styles.macroCol, { marginRight: Config.theme.spacing.sm }]}>
                <Input
                  label="Líquidos (ml)"
                  placeholder="2000"
                  value={waterGoal}
                  onChangeText={setWaterGoal}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.macroCol, { marginLeft: Config.theme.spacing.sm }]}>
                <Input
                  label="Azúcar Máx (g)"
                  placeholder="50"
                  value={sugarLimit}
                  onChangeText={setSugarLimit}
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

          {/* Section 3: Ejercicios */}
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <Dumbbell size={20} color={Config.theme.colors.secondary} />
              <Text style={styles.formTitle}>Ejercicios</Text>
            </View>

            {/* Inner Tabs Selector */}
            <View style={styles.innerTabsContainer}>
              <Pressable
                style={[styles.innerTab, exerciseTab === 'preguntas' && styles.innerTabActive]}
                onPress={() => setExerciseTab('preguntas')}
              >
                <Text style={[styles.innerTabText, exerciseTab === 'preguntas' && styles.innerTabTextActive]}>Preguntas</Text>
              </Pressable>
              <Pressable
                style={[styles.innerTab, exerciseTab === 'rutina' && styles.innerTabActive]}
                onPress={() => setExerciseTab('rutina')}
              >
                <Text style={[styles.innerTabText, exerciseTab === 'rutina' && styles.innerTabTextActive]}>Mi Rutina</Text>
              </Pressable>
            </View>

            {exerciseTab === 'preguntas' ? (
              <View style={styles.questionsContainer}>
                <Text style={styles.questionLabel}>¿Cuántos días a la semana entrenas?</Text>
                <View style={styles.daysRow}>
                  {[1, 2, 3, 4, 5, 6, 7].map(d => (
                    <Pressable
                      key={d}
                      style={[styles.dayCircle, trainingDays === d && styles.dayCircleActive]}
                      onPress={() => setTrainingDays(d)}
                    >
                      <Text style={[styles.dayCircleText, trainingDays === d && styles.dayCircleTextActive]}>{d}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.questionLabel}>¿Cuánto tiempo entrenas por sesión?</Text>
                <View style={styles.durationRow}>
                  {['30 min', '1 hora', '2 horas', '2h+'].map(dur => (
                    <Pressable
                      key={dur}
                      style={[styles.durationTab, trainingDuration === dur && styles.durationTabActive]}
                      onPress={() => setTrainingDuration(dur)}
                    >
                      <Text style={[styles.durationTabText, trainingDuration === dur && styles.durationTabTextActive]}>{dur}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.questionsContainer}>
                <Text style={styles.routinePlaceholder}>
                  Próximamente: Diseña tu plan de rutinas personalizadas con nuestro entrenador de IA.
                </Text>
              </View>
            )}
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
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccess}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setShowSuccess(false)}
      />

      <ErrorModal
        visible={showError}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setShowError(false)}
      />

      <ConfirmModal
        visible={showConfirm}
        title={modalTitle}
        message={modalMessage}
        onConfirm={onConfirmAction || (() => {})}
        onClose={() => setShowConfirm(false)}
      />

      <AiRecommendationModal
        visible={showAiModal}
        recommendation={aiRecommendation}
        onApply={handleApplyAiGoals}
        onClose={() => setShowAiModal(false)}
      />
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
  warningCard: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
    marginBottom: Config.theme.spacing.md,
    padding: Config.theme.spacing.md,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  warningTitle: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  warningText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  bmiCard: {
    marginBottom: Config.theme.spacing.md,
  },
  bmiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.xs,
  },
  bmiLabel: {
    color: Config.theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bmiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Config.theme.borderRadius.xs,
  },
  bmiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  bmiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bmiValue: {
    color: Config.theme.colors.text,
    fontSize: 32,
    fontWeight: '900',
    marginRight: Config.theme.spacing.md,
  },
  bmiSubtext: {
    color: Config.theme.colors.textSecondary,
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  innerTabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Config.theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    padding: 3,
    marginBottom: Config.theme.spacing.md,
  },
  innerTab: {
    flex: 1,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Config.theme.borderRadius.sm,
  },
  innerTabActive: {
    backgroundColor: Config.theme.colors.secondary,
  },
  innerTabText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  innerTabTextActive: {
    color: '#FFFFFF',
  },
  questionsContainer: {
    width: '100%',
  },
  questionLabel: {
    color: Config.theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Config.theme.spacing.sm,
    marginTop: Config.theme.spacing.xs,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Config.theme.spacing.md,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  dayCircleActive: {
    backgroundColor: Config.theme.colors.primary,
    borderColor: Config.theme.colors.primary,
  },
  dayCircleText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  dayCircleTextActive: {
    color: '#FFFFFF',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Config.theme.spacing.md,
  },
  durationTab: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Config.theme.borderRadius.md,
    marginHorizontal: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  durationTabActive: {
    backgroundColor: Config.theme.colors.primary,
    borderColor: Config.theme.colors.primary,
  },
  durationTabText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  durationTabTextActive: {
    color: '#FFFFFF',
  },
  routinePlaceholder: {
    color: Config.theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: Config.theme.spacing.lg,
  },
});
