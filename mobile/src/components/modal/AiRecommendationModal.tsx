import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { Sparkles, X } from 'lucide-react-native';
import { Config } from '@/constants/Config';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

interface PlanRecommendation {
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
  daily_water_goal: number;
  daily_sugar_limit: number;
  justification: string;
}

interface AiRecommendationModalProps {
  visible: boolean;
  recommendation: PlanRecommendation | null;
  onApply: () => void;
  onClose: () => void;
}

export const AiRecommendationModal: React.FC<AiRecommendationModalProps> = ({
  visible,
  recommendation,
  onApply,
  onClose,
}) => {
  if (!recommendation) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Card style={styles.container}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <X size={20} color={Config.theme.colors.textMuted} />
          </Pressable>

          <View style={styles.iconCircle}>
            <Sparkles size={32} color={Config.theme.colors.secondary} />
          </View>

          <Text style={styles.title}>Recomendación de la IA</Text>
          
          <ScrollView 
            style={styles.scroll}
            contentContainerStyle={{ alignItems: 'center' }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.justification}>{recommendation.justification}</Text>

            <View style={styles.summaryBox}>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Calorías diarias</Text>
                <Text style={styles.metricValue}>{recommendation.daily_calorie_goal} kcal</Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.macroRow}>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Proteínas</Text>
                  <Text style={styles.macroVal}>{recommendation.daily_protein_goal}g</Text>
                </View>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroVal}>{recommendation.daily_carbs_goal}g</Text>
                </View>
                <View style={styles.macroCol}>
                  <Text style={styles.macroLabel}>Grasas</Text>
                  <Text style={styles.macroVal}>{recommendation.daily_fat_goal}g</Text>
                </View>
              </View>

              <View style={styles.divider} />
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Meta de Líquidos</Text>
                <Text style={styles.metricValue}>{(recommendation.daily_water_goal / 1000).toFixed(1)} L</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Límite de Azúcar</Text>
                <Text style={styles.metricValue}>{recommendation.daily_sugar_limit} g</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <Button 
                title="Descartar" 
                onPress={onClose} 
                variant="outline" 
                style={[styles.halfButton, { borderColor: Config.theme.colors.error }]} 
                textStyle={{ color: '#FFFFFF' }}
              />
              <Button title="Aplicar Metas" onPress={onApply} variant="primary" style={styles.halfButton} />
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
    width: '90%',
    maxWidth: 360,
    maxHeight: '80%',
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
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.sm,
  },
  title: {
    color: Config.theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Config.theme.spacing.sm,
    textAlign: 'center',
  },
  scroll: {
    width: '100%',
  },
  justification: {
    color: Config.theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: Config.theme.spacing.md,
    paddingHorizontal: 8,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Config.theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    padding: Config.theme.spacing.md,
    marginBottom: Config.theme.spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metricLabel: {
    color: Config.theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  metricValue: {
    color: Config.theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Config.theme.colors.cardBorder,
    marginVertical: Config.theme.spacing.sm,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCol: {
    alignItems: 'center',
    flex: 1,
  },
  macroLabel: {
    color: Config.theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  macroVal: {
    color: Config.theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: Config.theme.spacing.sm,
  },
  halfButton: {
    flex: 0.48,
    marginVertical: 0,
    height: 48,
  },
});
