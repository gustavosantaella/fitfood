import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, ScrollView, Pressable,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Dumbbell, Plus, Clock, X, Check, Trash2,
  ChevronDown, Play, Pause, Square,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { Config } from '@/constants/Config';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { GymService } from '@/services/GymService';
import {
  MUSCLE_GROUPS, GymExercise, GymSet,
} from '@/constants/GymData';
import { SelectExerciseModal, WorkoutSummaryModal } from '@/components/modal';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export default function GymWorkoutScreen() {
  const { group, routine } = useLocalSearchParams<{ group: string; routine?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const gymService = GymService.getInstance();

  const muscleGroup = group || 'fullbody';
  const routineName = routine ? decodeURIComponent(routine) : undefined;
  const groupInfo = MUSCLE_GROUPS.find(g => g.id === muscleGroup);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<string>(new Date().toISOString());

  // Exercises
  const [exercises, setExercises] = useState<GymExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  // Summary Modal
  const [showSummary, setShowSummary] = useState(false);

  // Last weights cache
  const [lastWeights, setLastWeights] = useState<Record<string, number>>({});

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsTimerRunning(prev => !prev);
  };

  // Add exercise from picker
  const handleAddExercise = async (exercise: { name: string; group: string }) => {
    const newExercise: GymExercise = {
      id: generateId(),
      name: exercise.name,
      muscleGroup: exercise.group,
      sets: [
        { id: generateId(), weight: 0, reps: 0, completed: false },
      ],
    };
    setExercises(prev => [...prev, newExercise]);
    setShowExercisePicker(false);

    // Fetch last weight for this exercise
    if (user) {
      const lastWeight = await gymService.getLastWeight(user.id, exercise.name);
      if (lastWeight !== null) {
        setLastWeights(prev => ({ ...prev, [exercise.name]: lastWeight }));
      }
    }
  };

  // Remove exercise
  const handleRemoveExercise = (exerciseId: string) => {
    setExercises(prev => prev.filter(e => e.id !== exerciseId));
  };

  // Add set to exercise
  const handleAddSet = (exerciseId: string) => {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id === exerciseId) {
          const lastSet = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: generateId(),
                weight: lastSet?.weight || 0,
                reps: lastSet?.reps || 0,
                completed: false,
              },
            ],
          };
        }
        return ex;
      })
    );
  };

  // Remove last set from exercise
  const handleRemoveSet = (exerciseId: string, setId: string) => {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id === exerciseId && ex.sets.length > 1) {
          return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
        }
        return ex;
      })
    );
  };

  // Update set values
  const handleUpdateSet = (
    exerciseId: string,
    setId: string,
    field: 'weight' | 'reps',
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(s =>
              s.id === setId ? { ...s, [field]: numValue } : s
            ),
          };
        }
        return ex;
      })
    );
  };

  // Toggle set completion
  const handleToggleSet = (exerciseId: string, setId: string) => {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(s =>
              s.id === setId ? { ...s, completed: !s.completed } : s
            ),
          };
        }
        return ex;
      })
    );
  };

  // Calculate total volume
  const calculateVolume = () => {
    return exercises.reduce((total, ex) => {
      return total + ex.sets
        .filter(s => s.completed)
        .reduce((sum, s) => sum + s.weight * s.reps, 0);
    }, 0);
  };

  // Handle finish workout
  const handleFinishWorkout = () => {
    if (exercises.length === 0) {
      Alert.alert('Sin Ejercicios', 'Agrega al menos un ejercicio antes de finalizar.');
      return;
    }
    setIsTimerRunning(false);
    setShowSummary(true);
  };

  // Save workout
  const handleSaveWorkout = async () => {
    if (!user) return;

    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    await gymService.saveWorkout(user.id, {
      muscleGroup,
      routineName,
      exercises,
      startTime: startTimeRef.current,
      endTime: new Date().toISOString(),
      durationMinutes,
      totalVolume: calculateVolume(),
    });

    setShowSummary(false);
    router.back();
  };

  // Handle discard
  const handleDiscard = () => {
    Alert.alert(
      'Descartar Entrenamiento',
      '¿Estás seguro? Se perderá todo el progreso.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Pressable onPress={handleDiscard} style={styles.topBarBtn}>
            <X size={20} color={Config.theme.colors.error} />
          </Pressable>

          <View style={styles.topBarCenter}>
            <Text style={styles.topBarEmoji}>{groupInfo?.emoji || '🏋️'}</Text>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {routineName || groupInfo?.name || 'Entrenamiento'}
            </Text>
          </View>

          <Pressable onPress={handleFinishWorkout} style={styles.finishBtn}>
            <Check size={16} color="#FFFFFF" />
            <Text style={styles.finishBtnText}>Finalizar</Text>
          </Pressable>
        </View>

        {/* Timer Bar */}
        <View style={styles.timerBar}>
          <LinearGradient
            colors={[`${groupInfo?.color || Config.theme.colors.primary}15`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.timerGradient}
          >
            <Pressable onPress={toggleTimer} style={styles.timerBtn}>
              {isTimerRunning ? (
                <Pause size={14} color={Config.theme.colors.text} />
              ) : (
                <Play size={14} color={Config.theme.colors.primary} />
              )}
            </Pressable>
            <Clock size={14} color={Config.theme.colors.textSecondary} />
            <Text style={styles.timerText}>{formatTimer(elapsedSeconds)}</Text>
            <View style={styles.timerDivider} />
            <Dumbbell size={14} color={Config.theme.colors.textSecondary} />
            <Text style={styles.timerStat}>{exercises.length} ejercicios</Text>
            <View style={styles.timerDivider} />
            <Text style={styles.timerStat}>{calculateVolume().toLocaleString()} kg vol</Text>
          </LinearGradient>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Exercise Cards */}
          {exercises.map((exercise, exIdx) => {
            const exGroupInfo = MUSCLE_GROUPS.find(g => g.id === exercise.muscleGroup);
            const lastWeight = lastWeights[exercise.name];

            return (
              <Card key={exercise.id} style={styles.exerciseCard}>
                {/* Exercise Header */}
                <View style={styles.exerciseHeader}>
                  <View style={[styles.exerciseDot, { backgroundColor: exGroupInfo?.color || Config.theme.colors.primary }]} />
                  <View style={styles.exerciseNameContainer}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    {lastWeight !== undefined && (
                      <Text style={styles.lastWeight}>Último: {lastWeight} kg</Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => handleRemoveExercise(exercise.id)}
                    style={styles.exerciseRemoveBtn}
                  >
                    <Trash2 size={14} color={Config.theme.colors.error} />
                  </Pressable>
                </View>

                {/* Sets Table Header */}
                <View style={styles.setsHeader}>
                  <Text style={[styles.setHeaderText, { flex: 0.5 }]}>SET</Text>
                  <Text style={[styles.setHeaderText, { flex: 1 }]}>PESO (kg)</Text>
                  <Text style={[styles.setHeaderText, { flex: 1 }]}>REPS</Text>
                  <Text style={[styles.setHeaderText, { flex: 0.5, textAlign: 'center' }]}>✓</Text>
                </View>

                {/* Sets Rows */}
                {exercise.sets.map((set, setIdx) => (
                  <View
                    key={set.id}
                    style={[
                      styles.setRow,
                      set.completed && styles.setRowCompleted,
                    ]}
                  >
                    <Text style={[styles.setNumber, { flex: 0.5 }]}>{setIdx + 1}</Text>
                    <View style={{ flex: 1, paddingRight: 4 }}>
                      <TextInput
                        style={[styles.setInput, set.completed && styles.setInputCompleted]}
                        value={set.weight > 0 ? set.weight.toString() : ''}
                        onChangeText={v => handleUpdateSet(exercise.id, set.id, 'weight', v)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={Config.theme.colors.textMuted}
                      />
                    </View>
                    <View style={{ flex: 1, paddingRight: 4 }}>
                      <TextInput
                        style={[styles.setInput, set.completed && styles.setInputCompleted]}
                        value={set.reps > 0 ? set.reps.toString() : ''}
                        onChangeText={v => handleUpdateSet(exercise.id, set.id, 'reps', v)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={Config.theme.colors.textMuted}
                      />
                    </View>
                    <View style={{ flex: 0.5, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                      <Pressable
                        style={[styles.checkBtn, set.completed && styles.checkBtnCompleted]}
                        onPress={() => handleToggleSet(exercise.id, set.id)}
                      >
                        {set.completed && <Check size={14} color="#FFFFFF" />}
                      </Pressable>
                      {exercise.sets.length > 1 && (
                        <Pressable
                          onPress={() => handleRemoveSet(exercise.id, set.id)}
                          style={styles.removeSetBtn}
                        >
                          <X size={10} color={Config.theme.colors.textMuted} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}

                {/* Add Set Button */}
                <Pressable
                  style={styles.addSetBtn}
                  onPress={() => handleAddSet(exercise.id)}
                >
                  <Plus size={14} color={Config.theme.colors.primary} />
                  <Text style={styles.addSetText}>Agregar Set</Text>
                </Pressable>
              </Card>
            );
          })}

          {/* Add Exercise Button */}
          <Pressable
            style={styles.addExerciseBtn}
            onPress={() => setShowExercisePicker(true)}
          >
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.08)', 'rgba(16, 185, 129, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addExerciseBtnGradient}
            >
              <View style={styles.addExerciseIconCircle}>
                <Plus size={20} color={Config.theme.colors.primary} />
              </View>
              <Text style={styles.addExerciseText}>Agregar Ejercicio</Text>
            </LinearGradient>
          </Pressable>

          {/* Empty state hint */}
          {exercises.length === 0 && (
            <View style={styles.emptyHint}>
              <Dumbbell size={40} color={Config.theme.colors.textMuted} />
              <Text style={styles.emptyHintTitle}>¡Comienza tu entrenamiento!</Text>
              <Text style={styles.emptyHintText}>
                Presiona "Agregar Ejercicio" para añadir{'\n'}tu primer movimiento.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Exercise Picker Modal */}
      <SelectExerciseModal
        visible={showExercisePicker}
        groupFilter={muscleGroup}
        onSelect={handleAddExercise}
        onClose={() => setShowExercisePicker(false)}
      />

      {/* Workout Summary Modal */}
      <WorkoutSummaryModal
        visible={showSummary}
        muscleGroup={muscleGroup}
        exercises={exercises}
        durationMinutes={Math.max(1, Math.round(elapsedSeconds / 60))}
        totalVolume={calculateVolume()}
        onSave={handleSaveWorkout}
        onClose={() => {
          setShowSummary(false);
          setIsTimerRunning(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.theme.colors.background,
  },
  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Config.theme.spacing.lg,
    paddingVertical: Config.theme.spacing.sm,
  },
  topBarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: Config.theme.spacing.sm,
  },
  topBarEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  topBarTitle: {
    color: Config.theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Config.theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Config.theme.borderRadius.sm,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  // Timer Bar
  timerBar: {
    marginHorizontal: Config.theme.spacing.lg,
    borderRadius: Config.theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    marginBottom: Config.theme.spacing.md,
  },
  timerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Config.theme.spacing.md,
    paddingVertical: 10,
  },
  timerBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  timerText: {
    color: Config.theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginLeft: 4,
  },
  timerDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 10,
  },
  timerStat: {
    color: Config.theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  scrollContent: {
    paddingHorizontal: Config.theme.spacing.lg,
    paddingBottom: Config.theme.spacing.xxl,
  },
  // Exercise Card
  exerciseCard: {
    marginBottom: Config.theme.spacing.md,
    padding: Config.theme.spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.md,
  },
  exerciseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  exerciseNameContainer: {
    flex: 1,
  },
  exerciseName: {
    color: Config.theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  lastWeight: {
    color: Config.theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  exerciseRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Sets Table
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    marginBottom: 4,
  },
  setHeaderText: {
    color: Config.theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: Config.theme.borderRadius.sm,
    paddingHorizontal: 2,
    marginVertical: 1,
  },
  setRowCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  setNumber: {
    color: Config.theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  setInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Config.theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    height: 36,
    paddingHorizontal: 10,
    color: Config.theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  setInputCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.2)',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
  },
  checkBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Config.theme.colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnCompleted: {
    backgroundColor: Config.theme.colors.primary,
    borderColor: Config.theme.colors.primary,
  },
  removeSetBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 6,
    borderRadius: Config.theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    borderStyle: 'dashed',
  },
  addSetText: {
    color: Config.theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  // Add Exercise
  addExerciseBtn: {
    borderRadius: Config.theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    marginBottom: Config.theme.spacing.lg,
  },
  addExerciseBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Config.theme.spacing.md,
  },
  addExerciseIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addExerciseText: {
    color: Config.theme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  // Empty Hint
  emptyHint: {
    alignItems: 'center',
    paddingVertical: Config.theme.spacing.xxl,
  },
  emptyHintTitle: {
    color: Config.theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: Config.theme.spacing.md,
  },
  emptyHintText: {
    color: Config.theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
