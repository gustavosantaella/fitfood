import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, Keyboard, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, Calendar, ChevronRight, ChevronLeft, Dumbbell, Award, Target } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Config } from '@/constants/Config';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FoodService } from '@/services/FoodService';
import { SuccessModal, ErrorModal } from '@/components/modal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();

  const [step, setStep] = useState(1);

  // Step 1 States: Personal Info
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState('0');
  const [height, setHeight] = useState(profile?.height?.toString() || '');

  // DatePicker States
  const [dateValue, setDateValue] = useState<Date>(() => {
    if (profile?.birth_date) {
      const parsed = new Date(profile.birth_date);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date(new Date().getFullYear() - 25, 0, 1); // default 25 yrs ago
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(dateValue);

  // Step 2 States: Physical Goals
  const [weightGoal, setWeightGoal] = useState('');
  const [goalsDescription, setGoalsDescription] = useState('');

  // Step 3 States: Exercise Questions
  const [trainingDays, setTrainingDays] = useState<number | null>(null);
  const [trainingDuration, setTrainingDuration] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  // Format Date object to DD/MM/YYYY
  const formatDateString = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Age calculation helper
  const calculateAge = (dob: Date) => {
    const today = new Date();
    let calculatedAge = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      calculatedAge--;
    }
    return Math.max(0, calculatedAge).toString();
  };

  // Sync profile details if they load asynchronously
  useEffect(() => {
    if (profile) {
      if (profile.full_name) setFullName(profile.full_name);
      if (profile.birth_date) {
        const parts = profile.birth_date.split('-');
        if (parts.length === 3) {
          const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
          setBirthDate(formatted);
          const dob = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          if (!isNaN(dob.getTime())) {
            setDateValue(dob);
            setTempDate(dob);
            setAge(calculateAge(dob));
          }
        }
      }
      if (profile.height) {
        setHeight(profile.height.toString());
      }
    }
  }, [profile]);

  // DatePicker Change Handlers
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) {
      setDateValue(selectedDate);
      setBirthDate(formatDateString(selectedDate));
      setAge(calculateAge(selectedDate));
    }
  };

  const onDateChangeIOS = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const confirmDateIOS = () => {
    setDateValue(tempDate);
    setBirthDate(formatDateString(tempDate));
    setAge(calculateAge(tempDate));
    setShowDatePicker(false);
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      // Format birth_date if exists
      let dbDateString = null;
      if (birthDate) {
        let parts = birthDate.split('/');
        if (parts.length === 3) {
          dbDateString = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const parsedAge = age && parseInt(age) > 0 ? parseInt(age) : null;
      const parsedHeight = height ? parseFloat(height) : null;
      const parsedWeightGoal = weightGoal ? parseFloat(weightGoal) : null;

      const updates: any = {
        onboarding_completed: true,
      };

      if (fullName.trim()) updates.full_name = fullName.trim();
      if (dbDateString) updates.birth_date = dbDateString;
      if (parsedAge) updates.age = parsedAge;
      if (parsedHeight) updates.height = parsedHeight;
      if (parsedWeightGoal) updates.weight_goal = parsedWeightGoal;
      if (goalsDescription.trim()) updates.goals_description = goalsDescription.trim();
      if (trainingDays) updates.training_days_per_week = trainingDays;
      if (trainingDuration) updates.training_duration_per_session = trainingDuration;

      const { error } = await updateProfile(updates);
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (err: any) {
      setModalTitle('Error al omitir');
      setModalMessage(err.message || 'No se pudo completar la omisión del onboarding.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim()) {
        setModalTitle('Campo requerido');
        setModalMessage('Por favor, introduce tu nombre.');
        setShowError(true);
        return;
      }
      if (!birthDate || parseInt(age) === 0) {
        setModalTitle('Fecha inválida');
        setModalMessage('Por favor, introduce una fecha de nacimiento válida DD/MM/AAAA.');
        setShowError(true);
        return;
      }
      if (!height || parseFloat(height) <= 0) {
        setModalTitle('Estatura requerida');
        setModalMessage('Por favor, introduce tu estatura en centímetros.');
        setShowError(true);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!weightGoal || parseFloat(weightGoal) <= 0) {
        setModalTitle('Peso Meta requerido');
        setModalMessage('Por favor, introduce tu peso meta en kilogramos.');
        setShowError(true);
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!trainingDays) {
      setModalTitle('Pregunta requerida');
      setModalMessage('Por favor, selecciona cuántos días entrenas a la semana.');
      setShowError(true);
      return;
    }
    if (!trainingDuration) {
      setModalTitle('Pregunta requerida');
      setModalMessage('Por favor, selecciona la duración promedio de tus sesiones.');
      setShowError(true);
      return;
    }

    setLoading(true);
    try {
      // 1. Format dates and parse numbers
      const parsedAge = parseInt(age);
      const parsedHeight = parseFloat(height);
      const parsedWeightGoal = parseFloat(weightGoal);

      let parts = birthDate.split('/');
      let dbDateString = null;
      if (parts.length === 3) {
        dbDateString = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }

      // 2. Fetch AI suggestions plan for them to start with
      let calorieGoal = Config.nutrition.defaultCalorieGoal;
      let proteinGoal = Config.nutrition.defaultProteinGoal;
      let carbsGoal = Config.nutrition.defaultCarbsGoal;
      let fatGoal = Config.nutrition.defaultFatGoal;
      let waterGoal = 2000;
      let sugarLimit = 50;

      try {
        const recommendation = await FoodService.getInstance().recommendPlan({
          age: parsedAge,
          height: parsedHeight,
          weightGoal: parsedWeightGoal,
          trainingDaysPerWeek: trainingDays,
          trainingDurationPerSession: trainingDuration,
          goalsDescription: goalsDescription.trim(),
        });

        calorieGoal = recommendation.daily_calorie_goal;
        proteinGoal = recommendation.daily_protein_goal;
        carbsGoal = recommendation.daily_carbs_goal;
        fatGoal = recommendation.daily_fat_goal;
        waterGoal = recommendation.daily_water_goal;
        sugarLimit = recommendation.daily_sugar_limit;
      } catch (aiErr) {
        console.warn('AI calculation failed inside onboarding, utilizing default values:', aiErr);
      }

      // 3. Save profile updates to Supabase
      const { error } = await updateProfile({
        full_name: fullName.trim(),
        birth_date: dbDateString,
        age: parsedAge,
        height: parsedHeight,
        weight_goal: parsedWeightGoal,
        goals_description: goalsDescription.trim(),
        training_days_per_week: trainingDays,
        training_duration_per_session: trainingDuration,
        daily_calorie_goal: calorieGoal,
        daily_protein_goal: proteinGoal,
        daily_carbs_goal: carbsGoal,
        daily_fat_goal: fatGoal,
        daily_water_goal: waterGoal,
        daily_sugar_limit: sugarLimit,
        onboarding_completed: true,
      });

      if (error) throw error;

      setModalTitle('¡Registro completado!');
      setModalMessage('Tus metas se han calculado inteligentemente con IA. ¡Empecemos!');
      setShowSuccess(true);
    } catch (err: any) {
      setModalTitle('Error al registrar');
      setModalMessage(err.message || 'No se pudieron guardar tus datos.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

          {/* Header row */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Comencemos</Text>
              <Text style={styles.headerSubtitle}>Paso {step} de 3</Text>
            </View>
            <Pressable
              style={[styles.skipBtn, { borderColor: Config.theme.colors.error }]}
              onPress={handleSkip}
            >
              <Text style={[styles.skipText, { color: '#FFFFFF' }]}>Omitir</Text>
            </Pressable>
          </View>

          {/* Stepper Progress bar */}
          <View style={styles.stepperBarTrack}>
            <View style={[styles.stepperBarFill, { width: `${(step / 3) * 100}%` }]} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

            {/* STEP 1: Personal Data */}
            {step === 1 && (
              <Card style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <Award size={20} color={Config.theme.colors.primary} />
                  <Text style={styles.stepTitle}>Información Básica</Text>
                </View>
                <Text style={styles.stepDescription}>Cuéntanos un poco sobre ti para personalizar tus objetivos.</Text>

                <Input
                  label="Nombre Completo"
                  placeholder="Ej. Juan Pérez"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />

                <Pressable onPress={() => {
                  if (Platform.OS === 'ios') {
                    setTempDate(dateValue);
                  }
                  setShowDatePicker(true);
                }}>
                  <View pointerEvents="none">
                    <Input
                      label="Fecha de nacimiento"
                      placeholder="Selecciona tu fecha"
                      value={birthDate}
                      editable={false}
                      icon={<Calendar size={18} color={Config.theme.colors.textSecondary} />}
                    />
                  </View>
                </Pressable>

                {parseInt(age) > 0 && (
                  <View style={styles.ageBadge}>
                    <Text style={styles.ageBadgeText}>Edad calculada: {age} años</Text>
                  </View>
                )}

                <Input
                  label="Estatura (cm)"
                  placeholder="Ej. 175"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                />
              </Card>
            )}

            {/* STEP 2: Physical Goals */}
            {step === 2 && (
              <Card style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <Target size={20} color={Config.theme.colors.primary} />
                  <Text style={styles.stepTitle}>Metas Físicas</Text>
                </View>
                <Text style={styles.stepDescription}>Establece tu peso meta e indícanos lo que deseas conseguir.</Text>

                <Input
                  label="Peso Objetivo (kg)"
                  placeholder="Ej. 70"
                  value={weightGoal}
                  onChangeText={setWeightGoal}
                  keyboardType="numeric"
                />

                <Input
                  label="Descripción de tu objetivo (IA)"
                  placeholder="Ej. Quiero tonificar mi abdomen y ganar resistencia física, entrenando en casa."
                  value={goalsDescription}
                  onChangeText={setGoalsDescription}
                  multiline={true}
                  numberOfLines={4}
                />
              </Card>
            )}

            {/* STEP 3: Exercise Habits */}
            {step === 3 && (
              <Card style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <Dumbbell size={20} color={Config.theme.colors.primary} />
                  <Text style={styles.stepTitle}>Actividad Semanal</Text>
                </View>
                <Text style={styles.stepDescription}>¿Cómo es tu rutina de entrenamientos actual?</Text>

                <Text style={styles.questionLabel}>¿Cuántos días a la semana entrenas?</Text>
                <View style={styles.daysRow}>
                  {[1, 2, 3, 4, 5, 6, 7].map(d => (
                    <Pressable
                      key={d}
                      style={[styles.dayCircle, trainingDays === d && styles.dayCircleActive]}
                      onPress={() => setTrainingDays(d)}
                    >
                      <Text style={[styles.dayCircleText, trainingDays === d && styles.dayCircleTextActive]}>
                        {d}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.questionLabel}>¿Cuánto tiempo entrenas por sesión?</Text>
                <View style={styles.durationContainer}>
                  {['30 min', '1h', '2h', 'Más de 2h'].map(opt => (
                    <Pressable
                      key={opt}
                      style={[styles.durationOption, trainingDuration === opt && styles.durationOptionActive]}
                      onPress={() => setTrainingDuration(opt)}
                    >
                      <Text style={[styles.durationText, trainingDuration === opt && styles.durationTextActive]}>
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Card>
            )}

            {/* Navigation buttons */}
            <View style={styles.buttonRow}>
              {step > 1 ? (
                <Button
                  title="Atrás"
                  onPress={handleBack}
                  variant="outline"
                  style={styles.halfButton}
                  icon={<ChevronLeft size={18} color={Config.theme.colors.primary} />}
                />
              ) : (
                <View style={styles.halfButtonPlaceholder} />
              )}

              {step < 3 ? (
                <Button
                  title="Siguiente"
                  onPress={handleNext}
                  variant="primary"
                  style={styles.halfButton}
                  icon={<ChevronRight size={18} color="#FFFFFF" />}
                />
              ) : (
                <Button
                  title="Completar"
                  onPress={handleComplete}
                  variant="primary"
                  style={styles.halfButton}
                  loading={loading}
                  icon={<Sparkles size={16} color="#FFFFFF" />}
                />
              )}
            </View>

          </ScrollView>

        </KeyboardAvoidingView>
      </Pressable>

      <SuccessModal visible={showSuccess} title={modalTitle} message={modalMessage} onClose={handleSuccessClose} />
      <ErrorModal visible={showError} title={modalTitle} message={modalMessage} onClose={() => setShowError(false)} />

      {/* iOS DateTimePicker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
            <View style={styles.pickerModalContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerHeaderTitle}>Fecha de nacimiento</Text>
                <TouchableOpacity onPress={confirmDateIOS} style={styles.confirmBtn}>
                  <Text style={styles.confirmBtnText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  textColor="#FFFFFF"
                  onChange={onDateChangeIOS}
                  maximumDate={new Date()}
                />
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Android DateTimePicker dialog */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Config.theme.spacing.lg,
    paddingTop: Config.theme.spacing.md,
    paddingBottom: Config.theme.spacing.sm,
  },
  headerTitle: {
    color: Config.theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Config.theme.borderRadius.sm,
    borderWidth: 1.5,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepperBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: Config.theme.spacing.lg,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: Config.theme.spacing.xs,
  },
  stepperBarFill: {
    height: '100%',
    backgroundColor: Config.theme.colors.primary,
  },
  scrollContent: {
    paddingHorizontal: Config.theme.spacing.lg,
    paddingTop: Config.theme.spacing.lg,
    paddingBottom: 40,
  },
  stepCard: {
    padding: Config.theme.spacing.lg,
    marginBottom: Config.theme.spacing.lg,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.xs,
  },
  stepTitle: {
    color: Config.theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  stepDescription: {
    color: Config.theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Config.theme.spacing.lg,
  },
  ageBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Config.theme.borderRadius.sm,
    marginBottom: Config.theme.spacing.md,
  },
  ageBadgeText: {
    color: Config.theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  questionLabel: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: Config.theme.spacing.md,
    marginBottom: Config.theme.spacing.sm,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Config.theme.spacing.xs,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleActive: {
    backgroundColor: Config.theme.colors.primary,
    borderColor: Config.theme.colors.primary,
  },
  dayCircleText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  dayCircleTextActive: {
    color: '#FFFFFF',
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Config.theme.spacing.xs,
  },
  durationOption: {
    width: '48%',
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    borderRadius: Config.theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.sm,
  },
  durationOptionActive: {
    backgroundColor: Config.theme.colors.primary,
    borderColor: Config.theme.colors.primary,
  },
  durationText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  durationTextActive: {
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Config.theme.spacing.sm,
  },
  halfButton: {
    flex: 0.48,
    marginVertical: 0,
    height: 52,
  },
  halfButtonPlaceholder: {
    flex: 0.48,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.75)',
    justifyContent: 'flex-end',
  },
  pickerModalContainer: {
    backgroundColor: Config.theme.colors.cardBackground,
    borderTopLeftRadius: Config.theme.borderRadius.xl,
    borderTopRightRadius: Config.theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    borderBottomWidth: 0,
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Config.theme.spacing.lg,
    paddingVertical: Config.theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
  },
  pickerHeaderTitle: {
    color: Config.theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: Config.theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Config.theme.borderRadius.md,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  pickerWrapper: {
    justifyContent: 'center',
    paddingVertical: Config.theme.spacing.md,
  },
  heightContainer: {
    marginTop: Config.theme.spacing.sm,
    width: '100%',
  },
  heightLabel: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Config.theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heightValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: Config.theme.spacing.xs,
    marginBottom: Config.theme.spacing.xs,
  },
  heightValueText: {
    color: Config.theme.colors.text,
    fontSize: 36,
    fontWeight: '800',
  },
  heightUnitText: {
    color: Config.theme.colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 4,
  },
  rulerWrapper: {
    width: '100%',
    marginVertical: Config.theme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: Config.theme.borderRadius.md,
    paddingVertical: Config.theme.spacing.sm,
  },
});
