import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Plus, Trash2, Salad, Dumbbell, Coffee, PlusCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Config } from '@/constants/Config';
import { supabase } from '@/services/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

interface FoodLog {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

interface ExerciseLog {
  id: string;
  exercise_type: string;
  duration_minutes: number;
  intensity: string;
  logged_at: string;
}

export default function LogsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'foods' | 'exercises'>('foods');
  const [refreshing, setRefreshing] = useState(false);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      if (activeTab === 'foods') {
        const { data, error } = await supabase
          .from('food_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('logged_at', todayIso)
          .order('logged_at', { ascending: false });

        if (error) throw error;
        setFoodLogs(data || []);
      } else {
        const { data, error } = await supabase
          .from('exercise_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('logged_at', todayIso)
          .order('logged_at', { ascending: false });

        if (error) throw error;
        setExerciseLogs(data || []);
      }
    } catch (err) {
      console.warn('Supabase logs fetch failed, utilizing fallbacks:', err);
      // Fallback local static data if DB not connected
      if (activeTab === 'foods') {
        setFoodLogs([
          {
            id: '1',
            food_name: 'Desayuno: Tortilla de claras y espinacas',
            calories: 220,
            protein: 24,
            carbs: 6,
            fat: 10,
            logged_at: new Date().toISOString(),
          },
          {
            id: '2',
            food_name: 'Almuerzo: Pechuga de pollo y arroz',
            calories: 620,
            protein: 40,
            carbs: 86,
            fat: 16,
            logged_at: new Date().toISOString(),
          },
        ]);
      } else {
        setExerciseLogs([
          {
            id: '1',
            exercise_type: 'Entrenamiento de Fuerza (Empuje)',
            duration_minutes: 60,
            intensity: 'Alta',
            logged_at: new Date().toISOString(),
          },
        ]);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user, activeTab])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleAddFood = () => {
    // We can prompt the user to quickly log a food manually.
    // In a production app, this would open a modal form.
    // For our clean UX, we can implement dynamic alerts.
    Alert.prompt(
      'Añadir Alimento',
      'Ingresa el nombre, calorías, prot, carb, grasas separados por comas:\nEj: Huevo frito, 150, 12, 1, 11',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: async (text) => {
            if (!text) return;
            const parts = text.split(',');
            if (parts.length < 2) {
              Alert.alert('Formato inválido', 'Debes ingresar al menos el nombre y las calorías.');
              return;
            }

            const name = parts[0].trim();
            const calories = parseInt(parts[1]?.trim() || '0');
            const protein = parseFloat(parts[2]?.trim() || '0');
            const carbs = parseFloat(parts[3]?.trim() || '0');
            const fat = parseFloat(parts[4]?.trim() || '0');

            if (!name || isNaN(calories)) {
              Alert.alert('Datos inválidos', 'El nombre y las calorías son campos obligatorios.');
              return;
            }

            const newLog = {
              user_id: user?.id,
              food_name: name,
              calories,
              protein,
              carbs,
              fat,
            };

            try {
              if (user) {
                const { error } = await supabase.from('food_logs').insert([newLog]);
                if (error) throw error;
                fetchData();
              }
            } catch (err) {
              // Fallback local update
              const mockLog = { id: Math.random().toString(), ...newLog, logged_at: new Date().toISOString() };
              setFoodLogs(prev => [mockLog, ...prev]);
            }
          },
        },
      ]
    );
  };

  const handleAddExercise = () => {
    Alert.prompt(
      'Añadir Ejercicio',
      'Ingresa el tipo de ejercicio, duración (min), intensidad separados por comas:\nEj: Correr, 30, Media',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: async (text) => {
            if (!text) return;
            const parts = text.split(',');
            if (parts.length < 2) {
              Alert.alert('Formato inválido', 'Debes ingresar el tipo de ejercicio y la duración.');
              return;
            }

            const type = parts[0].trim();
            const duration = parseInt(parts[1]?.trim() || '0');
            const intensity = parts[2]?.trim() || 'Media';

            if (!type || isNaN(duration) || duration <= 0) {
              Alert.alert('Datos inválidos', 'El ejercicio y la duración deben ser válidos.');
              return;
            }

            const newLog = {
              user_id: user?.id,
              exercise_type: type,
              duration_minutes: duration,
              intensity,
            };

            try {
              if (user) {
                const { error } = await supabase.from('exercise_logs').insert([newLog]);
                if (error) throw error;
                fetchData();
              }
            } catch (err) {
              const mockLog = { id: Math.random().toString(), ...newLog, logged_at: new Date().toISOString() };
              setExerciseLogs(prev => [mockLog, ...prev]);
            }
          },
        },
      ]
    );
  };

  const handleDeleteFood = async (id: string) => {
    try {
      if (user) {
        const { error } = await supabase.from('food_logs').delete().eq('id', id);
        if (error) throw error;
        fetchData();
      }
    } catch (err) {
      setFoodLogs(prev => prev.filter(log => log.id !== id));
      Alert.alert('Eliminado', 'Alimento eliminado localmente.');
    }
  };

  const handleDeleteExercise = async (id: string) => {
    try {
      if (user) {
        const { error } = await supabase.from('exercise_logs').delete().eq('id', id);
        if (error) throw error;
        fetchData();
      }
    } catch (err) {
      setExerciseLogs(prev => prev.filter(log => log.id !== id));
      Alert.alert('Eliminado', 'Ejercicio eliminado localmente.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Diario de Hoy</Text>
        <Text style={styles.subtitle}>Lleva el control de tus hábitos diarios</Text>
      </View>

      {/* Tabs Switcher */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'foods' && styles.activeTab]}
          onPress={() => setActiveTab('foods')}
        >
          <Salad size={18} color={activeTab === 'foods' ? '#FFFFFF' : Config.theme.colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'foods' && styles.activeTabText]}>Alimentos</Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'exercises' && styles.activeTab]}
          onPress={() => setActiveTab('exercises')}
        >
          <Dumbbell size={18} color={activeTab === 'exercises' ? '#FFFFFF' : Config.theme.colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'exercises' && styles.activeTabText]}>Ejercicios</Text>
        </Pressable>
      </View>

      {/* Actions Button */}
      <View style={styles.actionBtnRow}>
        {activeTab === 'foods' ? (
          <Button title="Registrar Alimento" onPress={handleAddFood} variant="outline" style={styles.actionButton} />
        ) : (
          <Button title="Registrar Ejercicio" onPress={handleAddExercise} variant="outline" style={styles.actionButton} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Config.theme.colors.primary} />
        }
      >
        {activeTab === 'foods' ? (
          foodLogs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Coffee size={40} color={Config.theme.colors.textMuted} />
              <Text style={styles.emptyText}>No has registrado comidas hoy.</Text>
            </View>
          ) : (
            foodLogs.map(log => (
              <Card key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={styles.logTitleContainer}>
                    <Text style={styles.logTitle} numberOfLines={1}>{log.food_name}</Text>
                    <Text style={styles.logCal}>{log.calories} kcal</Text>
                  </View>
                  <Pressable onPress={() => handleDeleteFood(log.id)} style={styles.deleteButton}>
                    <Trash2 size={16} color={Config.theme.colors.error} />
                  </Pressable>
                </View>
                <View style={styles.macrosRow}>
                  <View style={styles.macroTag}>
                    <Text style={styles.macroTagLabel}>P: <Text style={styles.macroTagValue}>{log.protein}g</Text></Text>
                  </View>
                  <View style={styles.macroTag}>
                    <Text style={styles.macroTagLabel}>C: <Text style={styles.macroTagValue}>{log.carbs}g</Text></Text>
                  </View>
                  <View style={styles.macroTag}>
                    <Text style={styles.macroTagLabel}>G: <Text style={styles.macroTagValue}>{log.fat}g</Text></Text>
                  </View>
                </View>
              </Card>
            ))
          )
        ) : (
          exerciseLogs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Dumbbell size={40} color={Config.theme.colors.textMuted} />
              <Text style={styles.emptyText}>No has registrado ejercicios hoy.</Text>
            </View>
          ) : (
            exerciseLogs.map(log => (
              <Card key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={styles.logTitleContainer}>
                    <Text style={styles.logTitle} numberOfLines={1}>{log.exercise_type}</Text>
                    <Text style={styles.logCal}>{log.duration_minutes} min • Intensidad {log.intensity}</Text>
                  </View>
                  <Pressable onPress={() => handleDeleteExercise(log.id)} style={styles.deleteButton}>
                    <Trash2 size={16} color={Config.theme.colors.error} />
                  </Pressable>
                </View>
              </Card>
            ))
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.theme.colors.background,
  },
  header: {
    paddingHorizontal: Config.theme.spacing.lg,
    paddingTop: Config.theme.spacing.md,
    marginBottom: Config.theme.spacing.md,
  },
  title: {
    color: Config.theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginHorizontal: Config.theme.spacing.lg,
    borderRadius: Config.theme.borderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Config.theme.borderRadius.sm,
  },
  activeTab: {
    backgroundColor: Config.theme.colors.primary,
  },
  tabText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  actionBtnRow: {
    paddingHorizontal: Config.theme.spacing.lg,
    marginVertical: Config.theme.spacing.sm,
  },
  actionButton: {
    marginVertical: 0,
    height: 44,
  },
  scrollContent: {
    paddingHorizontal: Config.theme.spacing.lg,
    paddingBottom: Config.theme.spacing.xl,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Config.theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginTop: Config.theme.spacing.sm,
  },
  logCard: {
    marginBottom: Config.theme.spacing.sm,
    padding: Config.theme.spacing.md,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logTitleContainer: {
    flex: 1,
    paddingRight: Config.theme.spacing.md,
  },
  logTitle: {
    color: Config.theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  logCal: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    borderRadius: Config.theme.borderRadius.full,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  macrosRow: {
    flexDirection: 'row',
    marginTop: Config.theme.spacing.sm,
  },
  macroTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Config.theme.borderRadius.xs,
    paddingHorizontal: Config.theme.spacing.sm,
    paddingVertical: 2,
    marginRight: Config.theme.spacing.sm,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
  },
  macroTagLabel: {
    color: Config.theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  macroTagValue: {
    color: Config.theme.colors.text,
    fontWeight: '700',
  },
});
