import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, Pressable,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Dumbbell, Flame, Clock, TrendingUp, Trophy,
  Plus, Trash2, ChevronRight, Zap, BookOpen, Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { Config } from '@/constants/Config';
import { Card } from '@/components/Card';
import { GymService } from '@/services/GymService';
import {
  MUSCLE_GROUPS,
  GymRoutine,
  getRandomMotivation,
} from '@/constants/GymData';
import { CreateRoutineModal, AiRoutineModal } from '@/components/modal';
import { SuccessModal, ErrorModal, ConfirmModal } from '@/components/modal';

interface WorkoutHistoryItem {
  id: string;
  muscleGroup: string;
  routineName?: string;
  durationMinutes: number;
  totalVolume: number;
  exerciseCount: number;
  createdAt: string;
}

export default function GymScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const gymService = GymService.getInstance();

  const [refreshing, setRefreshing] = useState(false);
  const [motivation, setMotivation] = useState(getRandomMotivation());

  // Today Stats
  const [todayStats, setTodayStats] = useState({
    workoutsCompleted: 0,
    totalMinutes: 0,
    totalVolume: 0,
    streak: 0,
  });

  // Routines
  const [routines, setRoutines] = useState<GymRoutine[]>([]);
  const [showCreateRoutine, setShowCreateRoutine] = useState(false);

  // History
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);

  // Modals
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  // AI Routine
  const [showAiRoutine, setShowAiRoutine] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);

  const fetchData = async () => {
    if (!user) return;

    const [stats, routinesData, historyData] = await Promise.all([
      gymService.getTodayStats(user.id),
      gymService.getRoutines(user.id),
      gymService.getWorkoutHistory(user.id, 5),
    ]);

    setTodayStats(stats);
    setRoutines(routinesData);
    setHistory(historyData);
    setMotivation(getRandomMotivation());
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleStartQuickWorkout = (groupId: string) => {
    router.push(`/gym-workout?group=${groupId}`);
  };

  const handleStartRoutine = (routine: GymRoutine) => {
    const primaryGroup = routine.muscleGroups[0] || 'fullbody';
    router.push(`/gym-workout?group=${primaryGroup}&routine=${encodeURIComponent(routine.name)}`);
  };

  const handleCreateRoutine = async (routine: {
    name: string;
    muscleGroups: string[];
    exercises: { name: string; muscleGroup: string }[];
    estimatedMinutes: number;
  }) => {
    if (!user) return;
    const { error } = await gymService.saveRoutine(user.id, routine);
    setShowCreateRoutine(false);

    if (error) {
      setModalTitle('Error');
      setModalMessage('No se pudo guardar la rutina.');
      setShowError(true);
    } else {
      setModalTitle('Rutina Creada');
      setModalMessage(`"${routine.name}" se ha guardado exitosamente.`);
      setShowSuccess(true);
      fetchData();
    }
  };

  const handleDeleteRoutine = (routine: GymRoutine) => {
    setModalTitle('Eliminar Rutina');
    setModalMessage(`¿Estás seguro de eliminar "${routine.name}"?`);
    setOnConfirmAction(() => async () => {
      setShowConfirm(false);
      await gymService.deleteRoutine(routine.id);
      fetchData();
    });
    setShowConfirm(true);
  };

  const handleDeleteHistory = (item: WorkoutHistoryItem) => {
    setModalTitle('Eliminar Historial');
    setModalMessage(`¿Eliminar este entrenamiento del historial?`);
    setOnConfirmAction(() => async () => {
      setShowConfirm(false);
      await gymService.deleteWorkout(item.id);
      fetchData();
    });
    setShowConfirm(true);
  };

  const handleRequestAiRoutine = async () => {
    if (!user || !user.user_metadata) {
      setModalTitle('Perfil Incompleto');
      setModalMessage('Configura tu perfil para generar rutinas con IA.');
      setShowError(true);
      return;
    }
    
    setShowAiRoutine(true);
    setAiLoading(true);
    
    try {
      const dto = {
        age: user.user_metadata.age || 25,
        height: user.user_metadata.height || 170,
        weightGoal: user.user_metadata.weightGoal || user.user_metadata.weight || 70,
        trainingDaysPerWeek: user.user_metadata.trainingDaysPerWeek || 4,
        goalsDescription: user.user_metadata.goalsDescription || 'Ganar fuerza y masa muscular',
      };
      
      const recommendation = await gymService.recommendRoutine(dto);
      setAiRecommendation(recommendation);
    } catch (error) {
      setShowAiRoutine(false);
      setModalTitle('Error de IA');
      setModalMessage('Hubo un problema generando tu rutina. Intenta de nuevo.');
      setShowError(true);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAiDay = async (day: any) => {
    if (!user) return;
    const routineName = `${day.day_of_week} - ${day.day_name}`;
    const routineObj = {
      name: routineName,
      muscleGroups: day.muscle_groups,
      exercises: day.exercises.map((e: any) => ({ name: e.name, muscleGroup: e.muscle_group })),
      estimatedMinutes: aiRecommendation?.estimated_minutes_per_day || 45,
    };
    
    await gymService.saveRoutine(user.id, routineObj);
    setModalTitle('Día Guardado');
    setModalMessage(`"${routineName}" se guardó en Mis Rutinas.`);
    setShowSuccess(true);
    fetchData();
  };

  const handleSaveAiAll = async () => {
    if (!user || !aiRecommendation) return;
    
    for (const day of aiRecommendation.days) {
      const routineName = `${day.day_of_week} - ${day.day_name}`;
      const routineObj = {
        name: routineName,
        muscleGroups: day.muscle_groups,
        exercises: day.exercises.map((e: any) => ({ name: e.name, muscleGroup: e.muscle_group })),
        estimatedMinutes: aiRecommendation.estimated_minutes_per_day,
      };
      await gymService.saveRoutine(user.id, routineObj);
    }
    
    setShowAiRoutine(false);
    setModalTitle('Rutina Completa Guardada');
    setModalMessage(`Se guardaron ${aiRecommendation.days.length} días de entrenamiento.`);
    setShowSuccess(true);
    fetchData();
  };

  const getGroupInfo = (groupId: string) => {
    return MUSCLE_GROUPS.find(g => g.id === groupId);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Config.theme.colors.secondary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Mi Gym</Text>
            <Text style={styles.subtitle}>{motivation}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Flame size={16} color="#F59E0B" />
            <Text style={styles.streakText}>{todayStats.streak}</Text>
          </View>
        </View>

        {/* Today Stats Banner */}
        <Pressable style={styles.statsBanner}>
          <LinearGradient
            colors={['#1a1f3a', '#131C2E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsBannerGradient}
          >
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <Dumbbell size={16} color={Config.theme.colors.primary} />
                </View>
                <Text style={styles.statValue}>{todayStats.workoutsCompleted}</Text>
                <Text style={styles.statLabel}>Entrenos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <View style={[styles.statIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                  <Clock size={16} color="#3B82F6" />
                </View>
                <Text style={styles.statValue}>{formatDuration(todayStats.totalMinutes)}</Text>
                <Text style={styles.statLabel}>Tiempo</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                  <TrendingUp size={16} color={Config.theme.colors.secondary} />
                </View>
                <Text style={styles.statValue}>
                  {todayStats.totalVolume > 999
                    ? `${(todayStats.totalVolume / 1000).toFixed(1)}k`
                    : todayStats.totalVolume}
                </Text>
                <Text style={styles.statLabel}>Vol (kg)</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <View style={[styles.statIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                  <Flame size={16} color="#EF4444" />
                </View>
                <Text style={styles.statValue}>{todayStats.streak}</Text>
                <Text style={styles.statLabel}>Racha</Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Quick Workout Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <Zap size={18} color={Config.theme.colors.secondary} />
            <Text style={styles.sectionTitle}>Entrenamiento Rápido</Text>
          </View>
        </View>

        <View style={styles.muscleGrid}>
          {MUSCLE_GROUPS.map(group => (
            <Pressable
              key={group.id}
              style={({ pressed }) => [
                styles.muscleCard,
                pressed && styles.muscleCardPressed,
              ]}
              onPress={() => handleStartQuickWorkout(group.id)}
            >
              <View style={[styles.muscleIconCircle, { backgroundColor: `${group.color}18` }]}>
                <Text style={styles.muscleEmoji}>{group.emoji}</Text>
              </View>
              <Text style={styles.muscleName}>{group.name}</Text>
              <Text style={styles.muscleDesc} numberOfLines={1}>{group.description}</Text>
              <View style={[styles.muscleAccent, { backgroundColor: group.color }]} />
            </Pressable>
          ))}
        </View>

        {/* My Routines Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <BookOpen size={18} color={Config.theme.colors.primary} />
            <Text style={styles.sectionTitle}>Mis Rutinas</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              style={[styles.addRoutineBtn, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}
              onPress={handleRequestAiRoutine}
            >
              <Sparkles size={14} color={Config.theme.colors.secondary} />
              <Text style={[styles.addRoutineBtnText, { color: Config.theme.colors.secondary }]}>IA</Text>
            </Pressable>
            <Pressable
              style={styles.addRoutineBtn}
              onPress={() => setShowCreateRoutine(true)}
            >
              <Plus size={14} color="#FFFFFF" />
              <Text style={styles.addRoutineBtnText}>Nueva</Text>
            </Pressable>
          </View>
        </View>

        {routines.length === 0 ? (
          <Card style={styles.emptyCard}>
            <BookOpen size={28} color={Config.theme.colors.textMuted} />
            <Text style={styles.emptyText}>Aún no tienes rutinas</Text>
            <Text style={styles.emptySubtext}>
              Crea rutinas personalizadas con tus ejercicios favoritos
            </Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => setShowCreateRoutine(true)}
            >
              <Plus size={14} color={Config.theme.colors.primary} />
              <Text style={styles.emptyBtnText}>Crear Mi Primera Rutina</Text>
            </Pressable>
          </Card>
        ) : (
          routines.map(routine => {
            const groupColors = routine.muscleGroups
              .map(gId => getGroupInfo(gId)?.color || Config.theme.colors.textMuted)
              .slice(0, 3);
            const groupNames = routine.muscleGroups
              .map(gId => getGroupInfo(gId)?.name || gId)
              .join(' · ');

            return (
              <Card
                key={routine.id}
                style={styles.routineCard}
                onPress={() => handleStartRoutine(routine)}
              >
                <View style={styles.routineHeader}>
                  <View style={styles.routineInfo}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    <Text style={styles.routineMeta}>
                      {groupNames} · ~{routine.estimatedMinutes} min · {routine.exercises.length} ejercicios
                    </Text>
                  </View>
                  <View style={styles.routineActions}>
                    <Pressable
                      style={styles.routineDeleteBtn}
                      onPress={() => handleDeleteRoutine(routine)}
                    >
                      <Trash2 size={14} color={Config.theme.colors.error} />
                    </Pressable>
                    <ChevronRight size={18} color={Config.theme.colors.textMuted} />
                  </View>
                </View>
                {/* Color dots for muscle groups */}
                <View style={styles.routineDots}>
                  {groupColors.map((color, i) => (
                    <View key={i} style={[styles.routineDot, { backgroundColor: color }]} />
                  ))}
                </View>
              </Card>
            );
          })
        )}

        {/* Recent History */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <Trophy size={18} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Historial Reciente</Text>
          </View>
        </View>

        {history.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Dumbbell size={28} color={Config.theme.colors.textMuted} />
            <Text style={styles.emptyText}>Sin entrenamientos aún</Text>
            <Text style={styles.emptySubtext}>
              Inicia un entrenamiento rápido para comenzar tu historial
            </Text>
          </Card>
        ) : (
          history.map(item => {
            const groupInfo = getGroupInfo(item.muscleGroup);
            return (
              <Card key={item.id} style={styles.historyCard}>
                <View style={styles.historyRow}>
                  <View style={[styles.historyIcon, { backgroundColor: `${groupInfo?.color || '#666'}18` }]}>
                    <Text style={{ fontSize: 18 }}>{groupInfo?.emoji || '🏋️'}</Text>
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTitle}>
                      {item.routineName || groupInfo?.name || item.muscleGroup}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {formatDate(item.createdAt)} · {formatDuration(item.durationMinutes)} · {item.exerciseCount} ejercicios
                    </Text>
                  </View>
                  <View style={styles.historyVolume}>
                    <Text style={styles.historyVolumeValue}>
                      {item.totalVolume > 999
                        ? `${(item.totalVolume / 1000).toFixed(1)}k`
                        : item.totalVolume}
                    </Text>
                    <Text style={styles.historyVolumeUnit}>kg</Text>
                    <Pressable
                      onPress={() => handleDeleteHistory(item)}
                      style={{ padding: 4, marginTop: 4 }}
                    >
                      <Trash2 size={14} color={Config.theme.colors.error} />
                    </Pressable>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Modals */}
      <CreateRoutineModal
        visible={showCreateRoutine}
        onSave={handleCreateRoutine}
        onClose={() => setShowCreateRoutine(false)}
      />

      <AiRoutineModal
        visible={showAiRoutine}
        recommendation={aiRecommendation}
        loading={aiLoading}
        onSaveDay={handleSaveAiDay}
        onSaveAll={handleSaveAiAll}
        onClose={() => setShowAiRoutine(false)}
      />

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: Config.theme.spacing.lg,
    paddingBottom: Config.theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Config.theme.spacing.md,
    marginBottom: Config.theme.spacing.md,
  },
  title: {
    color: Config.theme.colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Config.theme.colors.secondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Config.theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  streakText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 4,
  },
  // Stats Banner
  statsBanner: {
    borderRadius: Config.theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    marginBottom: Config.theme.spacing.lg,
  },
  statsBannerGradient: {
    padding: Config.theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    color: Config.theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: Config.theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.md,
    marginTop: Config.theme.spacing.sm,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: Config.theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Muscle Grid
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Config.theme.spacing.lg,
  },
  muscleCard: {
    width: '48%',
    backgroundColor: Config.theme.colors.cardBackground,
    borderRadius: Config.theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    padding: Config.theme.spacing.md,
    marginBottom: Config.theme.spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  muscleCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  muscleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  muscleEmoji: {
    fontSize: 20,
  },
  muscleName: {
    color: Config.theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  muscleDesc: {
    color: Config.theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },
  muscleAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: Config.theme.borderRadius.lg,
    borderBottomRightRadius: Config.theme.borderRadius.lg,
  },
  // Routines
  addRoutineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Config.theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Config.theme.borderRadius.sm,
  },
  addRoutineBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  routineCard: {
    marginBottom: Config.theme.spacing.sm,
    padding: Config.theme.spacing.md,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routineInfo: {
    flex: 1,
    marginRight: 8,
  },
  routineName: {
    color: Config.theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  routineMeta: {
    color: Config.theme.colors.textMuted,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  routineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routineDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routineDots: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  routineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Empty States
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Config.theme.spacing.xl,
    marginBottom: Config.theme.spacing.md,
  },
  emptyText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: Config.theme.spacing.sm,
  },
  emptySubtext: {
    color: Config.theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: Config.theme.spacing.lg,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Config.theme.spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Config.theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Config.theme.colors.primary,
  },
  emptyBtnText: {
    color: Config.theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  // History
  historyCard: {
    marginBottom: Config.theme.spacing.sm,
    padding: Config.theme.spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    color: Config.theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  historyMeta: {
    color: Config.theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  historyVolume: {
    alignItems: 'flex-end',
  },
  historyVolumeValue: {
    color: Config.theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  historyVolumeUnit: {
    color: Config.theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
});
