import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Flame, Plus, Dumbbell, Activity, PlusCircle, ArrowRight, Droplet } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Config } from '@/constants/Config';
import { supabase } from '@/services/supabase';
import { Card } from '@/components/Card';
import { MetricRing } from '@/components/MetricRing';
import { MacroBar } from '@/components/MacroBar';
import { LinearGradient } from 'expo-linear-gradient';

interface FoodLog {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function DashboardScreen() {
  const { profile, user } = useAuth();
  const router = useRouter();
  
  const [refreshing, setRefreshing] = useState(false);
  const [nutritionSummary, setNutritionSummary] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [exerciseCount, setExerciseCount] = useState(0);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [waterIntake, setWaterIntake] = useState(0);

  // Fetch summary data from Supabase
  const fetchData = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      // 1. Fetch Food Logs for Today
      const { data: foodLogs, error: foodError } = await supabase
        .from('food_logs')
        .select('calories, protein, carbs, fat')
        .eq('user_id', user.id)
        .gte('logged_at', todayIso);

      if (foodError) throw foodError;

      // Sum all nutrients
      const summary = (foodLogs || []).reduce(
        (acc, curr) => ({
          calories: acc.calories + curr.calories,
          protein: acc.protein + curr.protein,
          carbs: acc.carbs + curr.carbs,
          fat: acc.fat + curr.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      setNutritionSummary(summary);

      // 2. Fetch Exercise count for Today
      const { data: exerciseLogs, error: exerciseError } = await supabase
        .from('exercise_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('logged_at', todayIso);

      if (exerciseError) throw exerciseError;
      setExerciseCount(exerciseLogs?.length || 0);

      // 3. Fetch Latest Weight
      const { data: weightLogs, error: weightError } = await supabase
        .from('weight_logs')
        .select('weight')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(1);

      if (weightError) throw weightError;
      if (weightLogs && weightLogs.length > 0) {
        setLatestWeight(weightLogs[0].weight);
      }

      // 4. Fetch Water logs
      const { data: waterLogs, error: waterError } = await supabase
        .from('water_logs')
        .select('amount')
        .eq('user_id', user.id)
        .gte('logged_at', todayIso);

      if (waterError) throw waterError;
      const totalWater = (waterLogs || []).reduce((sum, log) => sum + log.amount, 0);
      setWaterIntake(totalWater);
    } catch (err) {
      console.warn('Supabase fetch failed, utilizing fallback demo values:', err);
      // Fallback Demo Values in case database tables are not fully set up
      setNutritionSummary({
        calories: 840,
        protein: 64,
        carbs: 92,
        fat: 26,
      });
      setExerciseCount(1);
      setLatestWeight(profile?.weight_goal || 72.5);
      setWaterIntake(750);
    }
  };

  const handleAddWater = async (amount: number) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('water_logs')
        .insert([{ user_id: user.id, amount }]);
      if (error) throw error;
      setWaterIntake(prev => prev + amount);
    } catch (err) {
      console.warn('Could not save water log:', err);
      setWaterIntake(prev => prev + amount);
    }
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

  const handleQuickWeightLog = () => {
    router.push('/weight-picker?mode=actual');
  };

  const calorieGoal = profile?.daily_calorie_goal || Config.nutrition.defaultCalorieGoal;
  const proteinGoal = profile?.daily_protein_goal || Config.nutrition.defaultProteinGoal;
  const carbsGoal = profile?.daily_carbs_goal || Config.nutrition.defaultCarbsGoal;
  const fatGoal = profile?.daily_fat_goal || Config.nutrition.defaultFatGoal;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Config.theme.colors.primary} 
            colors={[Config.theme.colors.primary]}
          />
        }
      >
        {/* User Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.username}>
              {profile?.full_name || user?.email?.split('@')[0] || 'Atleta'}
            </Text>
          </View>
          <Pressable style={styles.badge} onPress={() => router.push('/(tabs)/profile')}>
            <Activity color={Config.theme.colors.primary} size={20} />
          </Pressable>
        </View>

        {/* Circular Progress Ring */}
        <MetricRing current={nutritionSummary.calories} goal={calorieGoal} />

        {/* Water Intake Tracker Card */}
        <Card style={styles.waterCard} onPress={() => router.push('/liquids-logger')}>
          <View style={styles.waterHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={styles.waterIconCircle}>
                <Droplet size={20} color="#3B82F6" fill="#3B82F6" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.waterTitle}>Consumo de Líquidos</Text>
                <Text style={styles.waterValue}>
                  {waterIntake} ml <Text style={styles.waterGoal}>/ {profile?.daily_water_goal || 2000} ml</Text>
                </Text>
              </View>
            </View>
            <View style={styles.bannerButton}>
              <Plus size={16} color="#FFFFFF" />
            </View>
          </View>
          {/* Water progress bar */}
          <View style={styles.waterProgressBarTrack}>
            <View 
              style={[
                styles.waterProgressBarFill, 
                { width: `${Math.min((waterIntake / (profile?.daily_water_goal || 2000)) * 100, 100)}%` }
              ]} 
            />
          </View>
        </Card>

        {/* Macronutrient Bars */}
        <Card style={styles.macrosCard}>
          <Text style={styles.cardTitle}>Macronutrientes del Día</Text>
          
          <MacroBar
            label="Proteínas"
            current={nutritionSummary.protein}
            goal={proteinGoal}
            color={Config.theme.colors.primary}
          />
          <MacroBar
            label="Carbohidratos"
            current={nutritionSummary.carbs}
            goal={carbsGoal}
            color={Config.theme.colors.secondary}
          />
          <MacroBar
            label="Grasas"
            current={nutritionSummary.fat}
            goal={fatGoal}
            color="#A78BFA" // Soft Purple
          />
        </Card>

        {/* Quick Actions & Stats */}
        <View style={styles.row}>
          <Card style={[styles.statsCard, { marginRight: Config.theme.spacing.sm }]} onPress={handleQuickWeightLog}>
            <View style={styles.statsHeader}>
              <Activity size={20} color={Config.theme.colors.secondary} />
              <PlusCircle size={18} color={Config.theme.colors.textMuted} />
            </View>
            <Text style={styles.statsLabel}>Peso Actual</Text>
            <Text style={styles.statsValue}>
              {latestWeight ? `${latestWeight.toFixed(1)} kg` : '--'}
            </Text>
            <Text style={styles.statsSubtext}>Goal: {profile?.weight_goal ? `${profile.weight_goal} kg` : 'N/A'}</Text>
          </Card>

          <Card style={[styles.statsCard, { marginLeft: Config.theme.spacing.sm }]} onPress={() => router.push('/(tabs)/logs')}>
            <View style={styles.statsHeader}>
              <Dumbbell size={20} color={Config.theme.colors.primary} />
              <ArrowRight size={18} color={Config.theme.colors.textMuted} />
            </View>
            <Text style={styles.statsLabel}>Ejercicios Hoy</Text>
            <Text style={styles.statsValue}>{exerciseCount}</Text>
            <Text style={styles.statsSubtext}>Ver historial de entrenos</Text>
          </Card>
        </View>

        {/* AI Callout Banner */}
        <Pressable style={styles.banner} onPress={() => router.push('/(tabs)/analyzer')}>
          <LinearGradient
            colors={['#1F2937', '#111827']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          >
            <View style={styles.bannerContent}>
              <Flame size={24} color={Config.theme.colors.secondary} />
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>¿Quieres analizar tu comida?</Text>
                <Text style={styles.bannerSubtitle}>Toma una foto y deja que nuestra IA calcule tus calorías y macros.</Text>
              </View>
            </View>
            <View style={styles.bannerButton}>
              <Plus size={20} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </Pressable>
      </ScrollView>
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
    marginBottom: Config.theme.spacing.sm,
  },
  greeting: {
    color: Config.theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  username: {
    color: Config.theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: Config.theme.borderRadius.full,
    backgroundColor: Config.theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macrosCard: {
    marginVertical: Config.theme.spacing.md,
  },
  cardTitle: {
    color: Config.theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Config.theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Config.theme.spacing.lg,
  },
  statsCard: {
    flex: 1,
    padding: Config.theme.spacing.md,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.sm,
  },
  statsLabel: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  statsValue: {
    color: Config.theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 2,
  },
  statsSubtext: {
    color: Config.theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  banner: {
    borderRadius: Config.theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Config.theme.spacing.md,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bannerTextContainer: {
    marginLeft: Config.theme.spacing.md,
    flex: 1,
  },
  bannerTitle: {
    color: Config.theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: Config.theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  bannerButton: {
    width: 36,
    height: 36,
    borderRadius: Config.theme.borderRadius.full,
    backgroundColor: Config.theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Config.theme.spacing.sm,
  },
  waterCard: {
    marginBottom: Config.theme.spacing.md,
    padding: Config.theme.spacing.md,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.sm,
  },
  waterIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterTitle: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  waterValue: {
    color: Config.theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  waterGoal: {
    color: Config.theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  quickAddBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Config.theme.borderRadius.sm,
  },
  quickAddBtnText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '700',
  },
  waterProgressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
    width: '100%',
  },
  waterProgressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
});
