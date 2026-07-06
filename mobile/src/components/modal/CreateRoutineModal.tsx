import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, Pressable, ScrollView, TextInput } from 'react-native';
import { BookOpen, X, Check, Plus } from 'lucide-react-native';
import { Config } from '@/constants/Config';
import { MUSCLE_GROUPS, EXERCISES_BY_GROUP } from '@/constants/GymData';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface CreateRoutineModalProps {
  visible: boolean;
  onSave: (routine: {
    name: string;
    muscleGroups: string[];
    exercises: { name: string; muscleGroup: string }[];
    estimatedMinutes: number;
  }) => void;
  onClose: () => void;
}

export const CreateRoutineModal: React.FC<CreateRoutineModalProps> = ({
  visible,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<{ name: string; muscleGroup: string }[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState('45');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [pickerGroup, setPickerGroup] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(g => g !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleExercise = (exerciseName: string, muscleGroup: string) => {
    setSelectedExercises(prev => {
      const exists = prev.find(e => e.name === exerciseName);
      if (exists) {
        return prev.filter(e => e.name !== exerciseName);
      }
      return [...prev, { name: exerciseName, muscleGroup }];
    });
  };

  const isExerciseSelected = (exerciseName: string) => {
    return selectedExercises.some(e => e.name === exerciseName);
  };

  const handleSave = () => {
    const tempErrors: Record<string, string> = {};
    if (!name.trim()) tempErrors.name = 'El nombre es obligatorio';
    if (selectedGroups.length === 0) tempErrors.groups = 'Selecciona al menos un grupo muscular';
    if (selectedExercises.length === 0) tempErrors.exercises = 'Agrega al menos un ejercicio';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    onSave({
      name: name.trim(),
      muscleGroups: selectedGroups,
      exercises: selectedExercises,
      estimatedMinutes: parseInt(estimatedMinutes) || 45,
    });

    resetForm();
  };

  const resetForm = () => {
    setName('');
    setSelectedGroups([]);
    setSelectedExercises([]);
    setEstimatedMinutes('45');
    setErrors({});
    setShowExercisePicker(false);
    setPickerGroup(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const groupsForExercises = selectedGroups.length > 0 ? selectedGroups : MUSCLE_GROUPS.map(g => g.id);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <Card style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <BookOpen size={24} color={Config.theme.colors.secondary} />
                </View>
                <Text style={styles.title}>Crear Rutina</Text>
              </View>
              <Pressable onPress={handleClose} style={styles.closeBtn}>
                <X size={20} color={Config.theme.colors.textSecondary} />
              </Pressable>
            </View>

            {/* Name Input */}
            <Input
              label="Nombre de la Rutina"
              placeholder="Ej. Push Day, Leg Day..."
              value={name}
              onChangeText={setName}
              error={errors.name}
            />

            {/* Estimated Duration */}
            <Input
              label="Duración Estimada (min)"
              placeholder="45"
              value={estimatedMinutes}
              onChangeText={setEstimatedMinutes}
              keyboardType="numeric"
            />

            {/* Muscle Group Selection */}
            <Text style={styles.sectionLabel}>Grupos Musculares</Text>
            {errors.groups && <Text style={styles.errorText}>{errors.groups}</Text>}
            <View style={styles.groupsGrid}>
              {MUSCLE_GROUPS.map(group => {
                const isSelected = selectedGroups.includes(group.id);
                return (
                  <Pressable
                    key={group.id}
                    style={[
                      styles.groupChip,
                      isSelected && { backgroundColor: group.color, borderColor: group.color },
                    ]}
                    onPress={() => toggleGroup(group.id)}
                  >
                    <Text style={styles.groupEmoji}>{group.emoji}</Text>
                    <Text style={[styles.groupChipText, isSelected && styles.groupChipTextActive]}>
                      {group.name}
                    </Text>
                    {isSelected && <Check size={12} color="#FFFFFF" style={{ marginLeft: 2 }} />}
                  </Pressable>
                );
              })}
            </View>

            {/* Exercise Selection */}
            <View style={styles.exercisesHeader}>
              <Text style={styles.sectionLabel}>Ejercicios ({selectedExercises.length})</Text>
              {errors.exercises && <Text style={styles.errorText}>{errors.exercises}</Text>}
            </View>

            {/* Show exercises from selected groups */}
            {groupsForExercises
              .filter(gId => EXERCISES_BY_GROUP[gId])
              .map(groupId => {
                const groupInfo = MUSCLE_GROUPS.find(g => g.id === groupId);
                const exercises = EXERCISES_BY_GROUP[groupId] || [];
                return (
                  <View key={groupId} style={styles.exerciseGroupSection}>
                    <Text style={[styles.exerciseGroupHeader, { color: groupInfo?.color }]}>
                      {groupInfo?.emoji} {groupInfo?.name}
                    </Text>
                    <View style={styles.exerciseChips}>
                      {exercises.slice(0, 6).map(ex => {
                        const selected = isExerciseSelected(ex.name);
                        return (
                          <Pressable
                            key={ex.name}
                            style={[
                              styles.exerciseChip,
                              selected && { backgroundColor: `${groupInfo?.color}30`, borderColor: groupInfo?.color },
                            ]}
                            onPress={() => toggleExercise(ex.name, groupId)}
                          >
                            <Text style={[
                              styles.exerciseChipText,
                              selected && { color: groupInfo?.color },
                            ]}>
                              {ex.name}
                            </Text>
                            {selected && <Check size={10} color={groupInfo?.color} style={{ marginLeft: 4 }} />}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

            {/* Save Button */}
            <View style={styles.buttonRow}>
              <Button
                title="Cancelar"
                onPress={handleClose}
                variant="outline"
                style={[styles.halfButton, { borderColor: Config.theme.colors.error }]}
                textStyle={{ color: '#FFFFFF' }}
                icon={<X size={16} color="#FFFFFF" />}
              />
              <Button
                title="Guardar"
                onPress={handleSave}
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
    maxHeight: '88%',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    color: Config.theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    color: Config.theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Config.theme.spacing.sm,
    marginTop: Config.theme.spacing.sm,
  },
  errorText: {
    color: Config.theme.colors.error,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: Config.theme.spacing.xs,
  },
  groupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Config.theme.spacing.md,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Config.theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  groupEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  groupChipText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  groupChipTextActive: {
    color: '#FFFFFF',
  },
  exercisesHeader: {
    marginTop: Config.theme.spacing.sm,
  },
  exerciseGroupSection: {
    marginBottom: Config.theme.spacing.md,
  },
  exerciseGroupHeader: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  exerciseChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  exerciseChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Config.theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseChipText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
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
