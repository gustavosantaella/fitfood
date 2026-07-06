import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Sparkles, X, Check, Dumbbell, Clock, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Config } from '@/constants/Config';
import { MUSCLE_GROUPS } from '@/constants/GymData';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

interface AiRoutineDay {
  day_of_week: string;
  day_name: string;
  muscle_groups: string[];
  exercises: {
    name: string;
    muscle_group: string;
    sets: number;
    reps: string;
  }[];
}

interface AiRoutineRecommendation {
  routine_name: string;
  days: AiRoutineDay[];
  estimated_minutes_per_day: number;
  justification: string;
}

interface AiRoutineModalProps {
  visible: boolean;
  recommendation: AiRoutineRecommendation | null;
  loading: boolean;
  onSaveDay: (day: AiRoutineDay) => void;
  onSaveAll: () => void;
  onClose: () => void;
}

export const AiRoutineModal: React.FC<AiRoutineModalProps> = ({
  visible,
  recommendation,
  loading,
  onSaveDay,
  onSaveAll,
  onClose,
}) => {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const getGroupInfo = (groupId: string) => {
    return MUSCLE_GROUPS.find(g => g.id === groupId);
  };

  const toggleDay = (dayOfWeek: string) => {
    setExpandedDay(prev => (prev === dayOfWeek ? null : dayOfWeek));
  };

  if (loading) {
    return (
      <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Card style={styles.loadingContainer}>
            <View style={styles.loadingIconCircle}>
              <Sparkles size={32} color={Config.theme.colors.secondary} />
            </View>
            <ActivityIndicator size="large" color={Config.theme.colors.secondary} style={{ marginVertical: 16 }} />
            <Text style={styles.loadingTitle}>Diseñando tu rutina con IA...</Text>
            <Text style={styles.loadingSubtext}>
              Analizando tu perfil, objetivos y nivel{'\n'}para crear la rutina perfecta para ti.
            </Text>
          </Card>
        </View>
      </Modal>
    );
  }

  if (!recommendation) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Card style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.aiIconCircle}>
                  <Sparkles size={24} color={Config.theme.colors.secondary} />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.aiLabel}>Rutina Generada por IA</Text>
                  <Text style={styles.routineName}>{recommendation.routine_name}</Text>
                </View>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={Config.theme.colors.textSecondary} />
              </Pressable>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statChip}>
                <Dumbbell size={12} color={Config.theme.colors.primary} />
                <Text style={styles.statChipText}>{recommendation.days.length} días</Text>
              </View>
              <View style={styles.statChip}>
                <Clock size={12} color="#3B82F6" />
                <Text style={styles.statChipText}>~{recommendation.estimated_minutes_per_day} min/sesión</Text>
              </View>
            </View>

            {/* Justification */}
            <View style={styles.justificationCard}>
              <Text style={styles.justificationText}>{recommendation.justification}</Text>
            </View>

            {/* Days */}
            {recommendation.days.map(day => {
              const isExpanded = expandedDay === day.day_of_week;
              const dayGroups = day.muscle_groups.map(g => getGroupInfo(g)).filter(Boolean);

              return (
                <View key={day.day_of_week} style={styles.dayContainer}>
                  <Pressable
                    style={styles.dayHeader}
                    onPress={() => toggleDay(day.day_of_week)}
                  >
                    <View style={styles.dayLeft}>
                      <View style={styles.dayNumberCircle}>
                        <Text style={styles.dayNumber}>{day.day_of_week.substring(0, 3)}</Text>
                      </View>
                      <View style={styles.dayInfo}>
                        <Text style={styles.dayName}>{day.day_name}</Text>
                        <View style={styles.dayGroupDots}>
                          {dayGroups.map((g, i) => (
                            <View key={i} style={styles.dayGroupChip}>
                              <View style={[styles.miniDot, { backgroundColor: g!.color }]} />
                              <Text style={styles.dayGroupText}>{g!.name}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                    <View style={styles.dayRight}>
                      <Pressable
                        style={styles.saveDayBtn}
                        onPress={() => onSaveDay(day)}
                      >
                        <Check size={12} color="#FFFFFF" />
                      </Pressable>
                      {isExpanded ? (
                        <ChevronUp size={16} color={Config.theme.colors.textMuted} />
                      ) : (
                        <ChevronDown size={16} color={Config.theme.colors.textMuted} />
                      )}
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.exercisesList}>
                      {day.exercises.map((ex, idx) => {
                        const exGroup = getGroupInfo(ex.muscle_group);
                        return (
                          <View key={idx} style={styles.exerciseRow}>
                            <View style={[styles.exerciseDot, { backgroundColor: exGroup?.color || Config.theme.colors.primary }]} />
                            <Text style={styles.exerciseRowName}>{ex.name}</Text>
                            <Text style={styles.exerciseRowDetail}>
                              {ex.sets}×{ex.reps}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <Button
                title="Descartar"
                onPress={onClose}
                variant="outline"
                style={[styles.halfButton, { borderColor: Config.theme.colors.error }]}
                textStyle={{ color: '#FFFFFF' }}
                icon={<X size={16} color="#FFFFFF" />}
              />
              <Button
                title="Guardar Todas"
                onPress={onSaveAll}
                variant="primary"
                style={styles.halfButton}
                icon={<Check size={16} color="#FFFFFF" />}
              />
            </View>
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '92%',
    maxWidth: 400,
    maxHeight: '90%',
    padding: Config.theme.spacing.lg,
    borderRadius: Config.theme.borderRadius.xl,
    backgroundColor: Config.theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    elevation: 10,
  },
  scrollContent: {
    paddingBottom: Config.theme.spacing.md,
  },
  // Loading
  loadingContainer: {
    width: '80%',
    maxWidth: 320,
    padding: Config.theme.spacing.xl,
    borderRadius: Config.theme.borderRadius.xl,
    backgroundColor: Config.theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    elevation: 10,
    alignItems: 'center',
  },
  loadingIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    color: Config.theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  loadingSubtext: {
    color: Config.theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Config.theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiLabel: {
    color: Config.theme.colors.secondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routineName: {
    color: Config.theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Config.theme.spacing.md,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Config.theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
  },
  statChipText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 5,
  },
  // Justification
  justificationCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
    borderRadius: Config.theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.1)',
    padding: Config.theme.spacing.md,
    marginBottom: Config.theme.spacing.lg,
  },
  justificationText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  // Day
  dayContainer: {
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    borderRadius: Config.theme.borderRadius.md,
    marginBottom: 8,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Config.theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayNumberCircle: {
    width: 36,
    height: 28,
    borderRadius: 8,
    backgroundColor: Config.theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dayNumber: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    color: Config.theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  dayGroupDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  dayGroupChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 3,
  },
  dayGroupText: {
    color: Config.theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  dayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveDayBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Config.theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Exercises List
  exercisesList: {
    paddingHorizontal: Config.theme.spacing.md,
    paddingBottom: Config.theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  exerciseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  exerciseRowName: {
    color: Config.theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  exerciseRowDetail: {
    color: Config.theme.colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  // Buttons
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: Config.theme.spacing.lg,
  },
  halfButton: {
    flex: 0.48,
    marginVertical: 0,
    height: 48,
  },
});
