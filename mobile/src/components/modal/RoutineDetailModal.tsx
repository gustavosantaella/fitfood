import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { X, Play, Clock, Dumbbell } from 'lucide-react-native';
import { Config } from '@/constants/Config';
import { GymRoutine, MUSCLE_GROUPS } from '@/constants/GymData';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

interface RoutineDetailModalProps {
  visible: boolean;
  routine: GymRoutine | null;
  onStart: (routine: GymRoutine) => void;
  onClose: () => void;
}

export const RoutineDetailModal: React.FC<RoutineDetailModalProps> = ({
  visible,
  routine,
  onStart,
  onClose,
}) => {
  if (!routine) return null;

  const getGroupInfo = (groupId: string) => {
    return MUSCLE_GROUPS.find(g => g.id === groupId);
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Card style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.routineTitle}>{routine.name}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Clock size={12} color="#3B82F6" />
                    <Text style={styles.metaChipText}>~{routine.estimatedMinutes} min</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Dumbbell size={12} color={Config.theme.colors.primary} />
                    <Text style={styles.metaChipText}>{routine.exercises.length} ejercicios</Text>
                  </View>
                </View>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={Config.theme.colors.textSecondary} />
              </Pressable>
            </View>

            {/* Muscle Groups */}
            <View style={styles.groupsContainer}>
              {routine.muscleGroups.map(gId => {
                const group = getGroupInfo(gId);
                if (!group) return null;
                return (
                  <View key={gId} style={[styles.groupChip, { backgroundColor: `${group.color}15`, borderColor: `${group.color}30` }]}>
                    <View style={[styles.miniDot, { backgroundColor: group.color }]} />
                    <Text style={[styles.groupText, { color: group.color }]}>{group.name}</Text>
                  </View>
                );
              })}
            </View>

            {/* Exercises List */}
            <Text style={styles.sectionTitle}>Ejercicios incluidos</Text>
            <View style={styles.exerciseList}>
              {routine.exercises.map((ex, idx) => {
                const group = getGroupInfo(ex.muscleGroup);
                return (
                  <View key={idx} style={styles.exerciseRow}>
                    <View style={styles.exerciseNumber}>
                      <Text style={styles.exerciseNumberText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                      {group && <Text style={styles.exerciseGroup}>{group.name}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Start Button */}
            <Button
              title="Iniciar Entrenamiento"
              onPress={() => onStart(routine)}
              variant="primary"
              style={styles.startBtn}
              icon={<Play size={16} color="#FFFFFF" fill="#FFFFFF" />}
            />
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
    maxHeight: '80%',
    padding: Config.theme.spacing.lg,
    borderRadius: Config.theme.borderRadius.xl,
    backgroundColor: Config.theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    elevation: 10,
  },
  scrollContent: {
    paddingBottom: Config.theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Config.theme.spacing.md,
  },
  routineTitle: {
    color: Config.theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Config.theme.borderRadius.sm,
  },
  metaChipText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Config.theme.spacing.lg,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Config.theme.borderRadius.full,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  groupText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: Config.theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: Config.theme.spacing.sm,
  },
  exerciseList: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: Config.theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    overflow: 'hidden',
    marginBottom: Config.theme.spacing.lg,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Config.theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  exerciseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: Config.theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  exerciseGroup: {
    color: Config.theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  startBtn: {
    marginTop: Config.theme.spacing.sm,
  },
});
