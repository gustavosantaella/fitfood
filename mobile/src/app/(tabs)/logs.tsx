import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, RefreshControl, Platform, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, Trash2, Salad, Dumbbell, Coffee, PlusCircle, Camera, ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Config } from '@/constants/Config';
import { supabase } from '@/services/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { SuccessModal, ErrorModal, AddFoodModal, AddExerciseModal, FoodDetailModal } from '@/components/modal';
import DateTimePicker from '@react-native-community/datetimepicker';

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

interface ExerciseLog {
  id: string;
  exercise_type: string;
  duration_minutes: number;
  intensity: string;
  logged_at: string;
}

export default function LogsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'foods' | 'exercises'>('foods');
  const [refreshing, setRefreshing] = useState(false);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);

  // Date and filter states
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Modal and form states
  const [showAddFood, setShowAddFood] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Date helpers
  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  const isYesterday = (d: Date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();
  };

  const getDateLabel = () => {
    if (isToday(selectedDate)) return 'Hoy';
    if (isYesterday(selectedDate)) return 'Ayer';
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${selectedDate.getDate()} de ${months[selectedDate.getMonth()]}, ${selectedDate.getFullYear()}`;
  };

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
    fetchData(newDate);
  };

  const handleNextDay = () => {
    if (isToday(selectedDate)) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
    fetchData(newDate);
  };

  // DatePicker Change Handlers
  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'dismissed') return;
    if (date) {
      setSelectedDate(date);
      fetchData(date);
    }
  };

  const onDateChangeIOS = (event: any, date?: Date) => {
    if (date) {
      setTempDate(date);
    }
  };

  const confirmDateIOS = () => {
    setSelectedDate(tempDate);
    fetchData(tempDate);
    setShowDatePicker(false);
  };

  const fetchData = async (dateToFetch: Date = selectedDate) => {
    if (!user) return;

    try {
      const startOfDay = new Date(dateToFetch);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateToFetch);
      endOfDay.setHours(23, 59, 59, 999);

      const startIso = startOfDay.toISOString();
      const endIso = endOfDay.toISOString();

      if (activeTab === 'foods') {
        const { data, error } = await supabase
          .from('food_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('logged_at', startIso)
          .lte('logged_at', endIso)
          .order('logged_at', { ascending: false });

        if (error) throw error;
        setFoodLogs(data || []);
      } else {
        const { data, error } = await supabase
          .from('exercise_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('logged_at', startIso)
          .lte('logged_at', endIso)
          .order('logged_at', { ascending: false });

        if (error) throw error;
        setExerciseLogs(data || []);
      }
    } catch (err) {
      console.warn('Supabase logs fetch failed, utilizing fallbacks:', err);
      // Fallback local static data if DB not connected
      const dateIso = dateToFetch.toISOString();
      if (activeTab === 'foods') {
        setFoodLogs([
          {
            id: '1',
            food_name: 'Desayuno: Tortilla de claras y espinacas',
            calories: 220,
            protein: 24,
            carbs: 6,
            fat: 10,
            logged_at: dateIso,
          },
          {
            id: '2',
            food_name: 'Almuerzo: Pechuga de pollo y arroz',
            calories: 620,
            protein: 40,
            carbs: 86,
            fat: 16,
            logged_at: dateIso,
          },
        ]);
      } else {
        setExerciseLogs([
          {
            id: '1',
            exercise_type: 'Entrenamiento de Fuerza (Empuje)',
            duration_minutes: 60,
            intensity: 'Alta',
            logged_at: dateIso,
          },
        ]);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData(selectedDate);
    }, [user, activeTab, selectedDate])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(selectedDate);
    setRefreshing(false);
  };

  const handleAddFood = () => {
    setShowAddFood(true);
  };

  const onSaveFood = async (food: {
    food_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    const logDate = new Date(selectedDate);
    const now = new Date();
    logDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

    const newLog = {
      user_id: user?.id,
      ...food,
      logged_at: logDate.toISOString(),
    };

    try {
      if (user) {
        const { error } = await supabase.from('food_logs').insert([newLog]);
        if (error) throw error;
        fetchData(selectedDate);
      }
    } catch (err) {
      // Fallback local update
      const mockLog = { id: Math.random().toString(), ...newLog };
      setFoodLogs(prev => [mockLog, ...prev]);
    }

    setModalTitle('Comida Registrada');
    setModalMessage(`Se ha guardado "${food.food_name}" en tu diario.`);
    setShowSuccess(true);
  };

  const handleAddExercise = () => {
    setShowAddExercise(true);
  };

  const onSaveExercise = async (exercise: {
    exercise_type: string;
    duration_minutes: number;
    intensity: string;
  }) => {
    const logDate = new Date(selectedDate);
    const now = new Date();
    logDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

    const newLog = {
      user_id: user?.id,
      ...exercise,
      logged_at: logDate.toISOString(),
    };

    try {
      if (user) {
        const { error } = await supabase.from('exercise_logs').insert([newLog]);
        if (error) throw error;
        fetchData(selectedDate);
      }
    } catch (err) {
      const mockLog = { id: Math.random().toString(), ...newLog };
      setExerciseLogs(prev => [mockLog, ...prev]);
    }

    setModalTitle('Ejercicio Registrado');
    let intensityLabel = 'Media';
    if (exercise.intensity === 'Low') intensityLabel = 'Suave';
    if (exercise.intensity === 'High') intensityLabel = 'Intensa';
    
    setModalMessage(`Se ha guardado "${exercise.exercise_type}" (${intensityLabel}) en tu diario.`);
    setShowSuccess(true);
  };

  const handleDeleteFood = async (id: string) => {
    try {
      if (user) {
        const { error } = await supabase.from('food_logs').delete().eq('id', id);
        if (error) throw error;
        fetchData(selectedDate);
      }
    } catch (err) {
      setFoodLogs(prev => prev.filter(log => log.id !== id));
    }
    setModalTitle('Eliminado');
    setModalMessage('Alimento eliminado correctamente de tu diario.');
    setShowSuccess(true);
  };

  const handleDeleteExercise = async (id: string) => {
    try {
      if (user) {
        const { error } = await supabase.from('exercise_logs').delete().eq('id', id);
        if (error) throw error;
        fetchData(selectedDate);
      }
    } catch (err) {
      setExerciseLogs(prev => prev.filter(log => log.id !== id));
    }
    setModalTitle('Eliminado');
    setModalMessage('Ejercicio eliminado correctamente de tu diario.');
    setShowSuccess(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isToday(selectedDate) ? 'Diario de Hoy' : 'Historial de Actividad'}
        </Text>
        <Text style={styles.subtitle}>Lleva el control de tus hábitos diarios</Text>
      </View>

      {/* Date Selector Bar */}
      <View style={styles.dateSelector}>
        <Pressable style={styles.dateArrow} onPress={handlePrevDay}>
          <ChevronLeft size={20} color={Config.theme.colors.text} />
        </Pressable>

        <Pressable style={styles.dateTextContainer} onPress={() => {
          if (Platform.OS === 'ios') {
            setTempDate(selectedDate);
          }
          setShowDatePicker(true);
        }}>
          <Calendar size={16} color={Config.theme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.dateText}>{getDateLabel()}</Text>
        </Pressable>

        <Pressable 
          style={[styles.dateArrow, isToday(selectedDate) && styles.disabledArrow]} 
          onPress={handleNextDay}
          disabled={isToday(selectedDate)}
        >
          <ChevronRight size={20} color={isToday(selectedDate) ? Config.theme.colors.textMuted : Config.theme.colors.text} />
        </Pressable>
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <Button 
              title="Manual" 
              onPress={handleAddFood} 
              variant="outline" 
              style={[styles.actionButton, { flex: 0.48 }]} 
            />
            <Button 
              title="Escanear IA" 
              onPress={() => router.push('/(tabs)/analyzer')} 
              variant="primary" 
              style={[styles.actionButton, { flex: 0.48 }]} 
              icon={<Camera size={16} color="#FFFFFF" />}
            />
          </View>
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
              <Card 
                key={log.id} 
                style={styles.logCard}
                onPress={() => {
                  setSelectedFood(log);
                  setShowDetailModal(true);
                }}
              >
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

      <AddFoodModal
        visible={showAddFood}
        onSave={onSaveFood}
        onClose={() => setShowAddFood(false)}
      />

      <AddExerciseModal
        visible={showAddExercise}
        onSave={onSaveExercise}
        onClose={() => setShowAddExercise(false)}
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

      <FoodDetailModal
        visible={showDetailModal}
        food={selectedFood}
        onClose={() => setShowDetailModal(false)}
      />
      {/* iOS DateTimePicker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
            <View style={styles.pickerModalContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerHeaderTitle}>Filtrar por fecha</Text>
                <TouchableOpacity onPress={confirmDateIOS} style={styles.confirmBtn}>
                  <Text style={styles.confirmBtnText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  textColor="#FFFFFF"
                  onChange={onDateChangeIOS}
                  maximumDate={new Date()}
                />
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* Android DateTimePicker dialog */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
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
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginHorizontal: Config.theme.spacing.lg,
    borderRadius: Config.theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    paddingVertical: Config.theme.spacing.sm,
    paddingHorizontal: Config.theme.spacing.md,
    marginBottom: Config.theme.spacing.md,
  },
  dateArrow: {
    padding: Config.theme.spacing.xs,
    borderRadius: Config.theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  disabledArrow: {
    opacity: 0.4,
  },
  dateTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: Config.theme.spacing.sm,
  },
  dateText: {
    color: Config.theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.75)',
    justifyContent: 'flex-end',
  },
  pickerModalContainer: {
    backgroundColor: Config.theme.colors.cardBackground,
    borderTopLeftRadius: Config.theme.borderRadius.xl,
    borderTopRightRadius: Config.theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    borderBottomWidth: 0,
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Config.theme.spacing.lg,
    paddingVertical: Config.theme.spacing.md,
    borderBottomWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
  },
  pickerHeaderTitle: {
    color: Config.theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: Config.theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Config.theme.borderRadius.md,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  pickerWrapper: {
    justifyContent: 'center',
    paddingVertical: Config.theme.spacing.md,
  },
});
