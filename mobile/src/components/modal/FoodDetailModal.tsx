import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable, Image } from 'react-native';
import { Clock, Salad, X } from 'lucide-react-native';
import { Config } from '@/constants/Config';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MacroBar } from '@/components/MacroBar';

interface FoodLog {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
  image_url?: string | null;
}

interface FoodDetailModalProps {
  visible: boolean;
  food: FoodLog | null;
  onClose: () => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ visible, food, onClose }) => {
  if (!food) return null;

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Card style={styles.container}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={20} color={Config.theme.colors.textMuted} />
          </Pressable>

          {food.image_url ? (
            <Image source={{ uri: food.image_url }} style={styles.foodImage} resizeMode="cover" />
          ) : (
            <View style={styles.iconCircle}>
              <Salad size={36} color={Config.theme.colors.primary} />
            </View>
          )}

          <Text style={styles.title}>{food.food_name}</Text>

          <View style={styles.timeRow}>
            <Clock size={14} color={Config.theme.colors.textSecondary} />
            <Text style={styles.timeText}>Registrado a las {formatTime(food.logged_at)}</Text>
          </View>

          <View style={styles.caloriesCard}>
            <Text style={styles.caloriesValue}>{food.calories}</Text>
            <Text style={styles.caloriesUnit}>kcal totales</Text>
          </View>

          <View style={styles.macrosSection}>
            <Text style={styles.sectionTitle}>Distribución de Macronutrientes</Text>
            
            <MacroBar
              label="Proteínas"
              current={food.protein}
              goal={150}
              color={Config.theme.colors.primary}
            />

            <MacroBar
              label="Carbohidratos"
              current={food.carbs}
              goal={300}
              color={Config.theme.colors.secondary}
            />

            <MacroBar
              label="Grasas"
              current={food.fat}
              goal={80}
              color="#A78BFA"
            />
          </View>

          <Button title="Cerrar" onPress={onClose} variant="primary" style={styles.closeActionBtn} />
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
    maxWidth: 360,
    padding: Config.theme.spacing.lg,
    borderRadius: Config.theme.borderRadius.xl,
    backgroundColor: Config.theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    elevation: 10,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  foodImage: {
    width: '100%',
    height: 160,
    borderRadius: Config.theme.borderRadius.lg,
    marginBottom: Config.theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.md,
  },
  title: {
    color: Config.theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.md,
  },
  timeText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  caloriesCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    borderRadius: Config.theme.borderRadius.lg,
    paddingVertical: Config.theme.spacing.md,
    alignItems: 'center',
    marginBottom: Config.theme.spacing.lg,
  },
  caloriesValue: {
    color: Config.theme.colors.primary,
    fontSize: 36,
    fontWeight: '900',
  },
  caloriesUnit: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  macrosSection: {
    width: '100%',
    marginBottom: Config.theme.spacing.lg,
  },
  sectionTitle: {
    color: Config.theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Config.theme.spacing.md,
  },
  macroItem: {
    marginBottom: Config.theme.spacing.sm,
  },
  macroInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  macroName: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  macroValue: {
    color: Config.theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  closeActionBtn: {
    width: '100%',
    marginVertical: 0,
    height: 48,
  },
});
