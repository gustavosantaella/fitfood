import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { Trophy, Clock, Dumbbell, TrendingUp, X } from 'lucide-react-native';
import { Config } from '@/constants/Config';
import { MUSCLE_GROUPS, GymExercise } from '@/constants/GymData';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

interface WorkoutSummaryModalProps {
  visible: boolean;
  muscleGroup: string;
  exercises: GymExercise[];
  durationMinutes: number;
  totalVolume: number;
  onSave: () => void;
  onClose: () => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  visible,
  muscleGroup,
  exercises,
  durationMinutes,
  totalVolume,
  onSave,
  onClose,
}) => {
  const groupInfo = MUSCLE_GROUPS.find(g => g.id === muscleGroup);
  const completedSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
    0
  );
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Card style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Trophy Icon */}
            <View style={[styles.trophyCircle, { backgroundColor: `${groupInfo?.color || Config.theme.colors.primary}20` }]}>
              <Trophy size={40} color={groupInfo?.color || Config.theme.colors.primary} />
            </View>

            <Text style={styles.title}>¡Entrenamiento Completado!</Text>
            <Text style={styles.subtitle}>
              {groupInfo?.emoji} {groupInfo?.name || muscleGroup}
            </Text>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <Clock size={18} color="#3B82F6" />
                </View>
                <Text style={styles.statValue}>{formatDuration(durationMinutes)}</Text>
                <Text style={styles.statLabel}>Duración</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Dumbbell size={18} color={Config.theme.colors.primary} />
                </View>
                <Text style={styles.statValue}>{exercises.length}</Text>
                <Text style={styles.statLabel}>Ejercicios</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                  <TrendingUp size={18} color={Config.theme.colors.secondary} />
                </View>
                <Text style={styles.statValue}>{completedSets}/{totalSets}</Text>
                <Text style={styles.statLabel}>Series</Text>
              </View>
            </View>

            {/* Volume */}
            <View style={styles.volumeCard}>
              <Text style={styles.volumeLabel}>Volumen Total</Text>
              <Text style={styles.volumeValue}>
                {totalVolume.toLocaleString()} <Text style={styles.volumeUnit}>kg</Text>
              </Text>
            </View>

            {/* Exercises Breakdown */}
            <View style={styles.breakdownContainer}>
              <Text style={styles.breakdownTitle}>Resumen de Ejercicios</Text>
              {exercises.map((ex, idx) => {
                const completedExSets = ex.sets.filter(s => s.completed);
                const maxWeight = completedExSets.length > 0
                  ? Math.max(...completedExSets.map(s => s.weight))
                  : 0;
                return (
                  <View key={ex.id || idx} style={styles.breakdownItem}>
                    <Text style={styles.breakdownName}>{ex.name}</Text>
                    <Text style={styles.breakdownDetail}>
                      {completedExSets.length} sets · Max {maxWeight} kg
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Action Buttons */}
            <Button
              title="Guardar y Salir"
              onPress={onSave}
              variant="primary"
              icon={<Trophy size={18} color="#FFFFFF" />}
            />
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Seguir Entrenando</Text>
            </Pressable>
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
    width: '90%',
    maxWidth: 380,
    maxHeight: '85%',
    padding: Config.theme.spacing.lg,
    borderRadius: Config.theme.borderRadius.xl,
    backgroundColor: Config.theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    elevation: 10,
  },
  scrollContent: {
    alignItems: 'center',
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.md,
  },
  title: {
    color: Config.theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: Config.theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Config.theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Config.theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    color: Config.theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: Config.theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  volumeCard: {
    width: '100%',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: Config.theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    padding: Config.theme.spacing.md,
    alignItems: 'center',
    marginBottom: Config.theme.spacing.lg,
  },
  volumeLabel: {
    color: Config.theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  volumeValue: {
    color: Config.theme.colors.primary,
    fontSize: 32,
    fontWeight: '900',
  },
  volumeUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: Config.theme.colors.textSecondary,
  },
  breakdownContainer: {
    width: '100%',
    marginBottom: Config.theme.spacing.lg,
  },
  breakdownTitle: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Config.theme.spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  breakdownName: {
    color: Config.theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  breakdownDetail: {
    color: Config.theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  cancelBtn: {
    paddingVertical: Config.theme.spacing.sm,
    marginTop: 4,
  },
  cancelText: {
    color: Config.theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
