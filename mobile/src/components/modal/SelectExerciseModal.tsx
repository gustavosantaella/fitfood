import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, Modal, Pressable, FlatList, TextInput } from 'react-native';
import { Search, X, Dumbbell } from 'lucide-react-native';
import { Config } from '@/constants/Config';
import { MUSCLE_GROUPS, searchExercises, ExerciseItem } from '@/constants/GymData';
import { Card } from '@/components/Card';

interface SelectExerciseModalProps {
  visible: boolean;
  groupFilter?: string;
  onSelect: (exercise: ExerciseItem) => void;
  onClose: () => void;
}

export const SelectExerciseModal: React.FC<SelectExerciseModalProps> = ({
  visible,
  groupFilter,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(groupFilter);
  const [customName, setCustomName] = useState('');

  const filteredExercises = useMemo(() => {
    return searchExercises(searchQuery, selectedGroup);
  }, [searchQuery, selectedGroup]);

  const handleSelectExercise = (exercise: ExerciseItem) => {
    onSelect(exercise);
    setSearchQuery('');
    setCustomName('');
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    onSelect({
      name: customName.trim(),
      group: selectedGroup || 'fullbody',
      isCompound: false,
    });
    setCustomName('');
    setSearchQuery('');
  };

  const handleClose = () => {
    setSearchQuery('');
    setCustomName('');
    setSelectedGroup(groupFilter);
    onClose();
  };

  const getGroupInfo = (groupId: string) => {
    return MUSCLE_GROUPS.find(g => g.id === groupId);
  };

  const renderExerciseItem = ({ item }: { item: ExerciseItem }) => {
    const groupInfo = getGroupInfo(item.group);
    return (
      <Pressable
        style={({ pressed }) => [styles.exerciseItem, pressed && styles.exerciseItemPressed]}
        onPress={() => handleSelectExercise(item)}
      >
        <View style={[styles.exerciseDot, { backgroundColor: groupInfo?.color || Config.theme.colors.primary }]} />
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseGroup}>{groupInfo?.name || item.group}</Text>
        </View>
        {item.isCompound && (
          <View style={styles.compoundBadge}>
            <Text style={styles.compoundBadgeText}>Compuesto</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <Card style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Dumbbell size={24} color={Config.theme.colors.secondary} />
              <Text style={styles.title}>Seleccionar Ejercicio</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={Config.theme.colors.textSecondary} />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={18} color={Config.theme.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ejercicio..."
              placeholderTextColor={Config.theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={16} color={Config.theme.colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Group Filter Pills */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: undefined, name: 'Todos', emoji: '🔥', color: Config.theme.colors.primary }, ...MUSCLE_GROUPS]}
            keyExtractor={(item) => item.id || 'all'}
            contentContainerStyle={styles.pillsContainer}
            renderItem={({ item }: { item: any }) => (
              <Pressable
                style={[
                  styles.pill,
                  selectedGroup === item.id && { backgroundColor: item.color || Config.theme.colors.primary },
                ]}
                onPress={() => setSelectedGroup(item.id)}
              >
                <Text style={styles.pillEmoji}>{item.emoji}</Text>
                <Text style={[
                  styles.pillText,
                  selectedGroup === item.id && styles.pillTextActive,
                ]}>
                  {item.name}
                </Text>
              </Pressable>
            )}
          />

          {/* Exercise List */}
          <FlatList
            data={filteredExercises}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            renderItem={renderExerciseItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron ejercicios</Text>
              </View>
            }
          />

          {/* Custom Exercise Input */}
          <View style={styles.customContainer}>
            <Text style={styles.customLabel}>¿No encuentras tu ejercicio?</Text>
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder="Nombre personalizado..."
                placeholderTextColor={Config.theme.colors.textMuted}
                value={customName}
                onChangeText={setCustomName}
              />
              <Pressable
                style={[styles.customBtn, !customName.trim() && styles.customBtnDisabled]}
                onPress={handleAddCustom}
                disabled={!customName.trim()}
              >
                <Text style={styles.customBtnText}>Agregar</Text>
              </Pressable>
            </View>
          </View>
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
    maxHeight: '85%',
    padding: Config.theme.spacing.lg,
    borderRadius: Config.theme.borderRadius.xl,
    backgroundColor: Config.theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: Config.theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Config.theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    paddingHorizontal: Config.theme.spacing.md,
    height: 44,
    marginBottom: Config.theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    color: Config.theme.colors.text,
    fontSize: 14,
    marginLeft: 8,
  },
  pillsContainer: {
    paddingBottom: Config.theme.spacing.md,
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Config.theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  pillEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  pillText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  list: {
    maxHeight: 280,
  },
  listContent: {
    paddingBottom: Config.theme.spacing.sm,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Config.theme.borderRadius.sm,
    marginBottom: 2,
  },
  exerciseItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  exerciseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: Config.theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseGroup: {
    color: Config.theme.colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  compoundBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Config.theme.borderRadius.xs,
  },
  compoundBadgeText: {
    color: Config.theme.colors.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: Config.theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Config.theme.colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  customContainer: {
    borderTopWidth: 1,
    borderTopColor: Config.theme.colors.cardBorder,
    paddingTop: Config.theme.spacing.md,
    marginTop: Config.theme.spacing.sm,
  },
  customLabel: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Config.theme.spacing.sm,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Config.theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    paddingHorizontal: Config.theme.spacing.md,
    color: Config.theme.colors.text,
    fontSize: 13,
    marginRight: 8,
  },
  customBtn: {
    backgroundColor: Config.theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Config.theme.borderRadius.sm,
  },
  customBtnDisabled: {
    opacity: 0.4,
  },
  customBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
