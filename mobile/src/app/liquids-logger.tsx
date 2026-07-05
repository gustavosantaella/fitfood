import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Droplet, Coffee, Wine, GlassWater, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Config } from '@/constants/Config';
import { supabase } from '@/services/supabase';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { SuccessModal, ErrorModal } from '@/components/modal';

interface WaterLog {
  id: string;
  amount: number;
  logged_at: string;
}

export default function LiquidsLoggerScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const todayGoal = profile?.daily_water_goal || 2000;
  const totalLogged = logs.reduce((sum, log) => sum + log.amount, 0);
  const progressPercentage = Math.min((totalLogged / todayGoal) * 100, 100);

  const fetchTodayLogs = async () => {
    if (!user) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('water_logs')
        .select('id, amount, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', today.toISOString())
        .order('logged_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching water logs:', err);
    }
  };

  useEffect(() => {
    fetchTodayLogs();
  }, [user]);

  const handleAddLiquids = async (amount: number) => {
    if (!user) return;
    if (amount <= 0 || isNaN(amount)) {
      setModalTitle('Cantidad Inválida');
      setModalMessage('Por favor ingresa un volumen de líquido válido en mililitros.');
      setShowError(true);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('water_logs')
        .insert([{ user_id: user.id, amount }]);

      if (error) throw error;
      
      await fetchTodayLogs();
      setCustomAmount('');
      setModalTitle('Bebida Registrada');
      setModalMessage(`Se agregaron ${amount} ml a tu consumo diario.`);
      setShowSuccess(true);
    } catch (err: any) {
      setModalTitle('Error al registrar');
      setModalMessage(err.message || 'No se pudo registrar la bebida.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      const { error } = await supabase
        .from('water_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchTodayLogs();
    } catch (err: any) {
      setModalTitle('Error al eliminar');
      setModalMessage(err.message || 'No se pudo eliminar el registro.');
      setShowError(true);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registro de Líquidos</Text>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <X size={24} color={Config.theme.colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress Visual */}
        <Card style={styles.progressCard}>
          <View style={styles.dropletContainer}>
            <View style={styles.dropletBackground}>
              <View style={[styles.dropletFill, { height: `${progressPercentage}%` }]} />
              <View style={styles.dropletInfo}>
                <Droplet size={32} color={progressPercentage > 0 ? '#FFFFFF' : '#3B82F6'} />
                <Text style={styles.progressPercentageText}>{Math.round(progressPercentage)}%</Text>
              </View>
            </View>
          </View>

          <Text style={styles.statsLabel}>Total Consumido Hoy</Text>
          <Text style={styles.statsValue}>{totalLogged} ml <Text style={styles.statsGoal}>/ {todayGoal} ml</Text></Text>
        </Card>

        {/* Presets */}
        <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        <View style={styles.presetsGrid}>
          <Pressable style={styles.presetItem} onPress={() => handleAddLiquids(200)}>
            <Coffee size={24} color="#3B82F6" />
            <Text style={styles.presetLabel}>Taza</Text>
            <Text style={styles.presetAmount}>200 ml</Text>
          </Pressable>

          <Pressable style={styles.presetItem} onPress={() => handleAddLiquids(250)}>
            <GlassWater size={24} color="#3B82F6" />
            <Text style={styles.presetLabel}>Vaso</Text>
            <Text style={styles.presetAmount}>250 ml</Text>
          </Pressable>

          <Pressable style={styles.presetItem} onPress={() => handleAddLiquids(330)}>
            <Wine size={24} color="#3B82F6" />
            <Text style={styles.presetLabel}>Lata/Copa</Text>
            <Text style={styles.presetAmount}>330 ml</Text>
          </Pressable>

          <Pressable style={styles.presetItem} onPress={() => handleAddLiquids(500)}>
            <GlassWater size={24} color="#3B82F6" />
            <Text style={styles.presetLabel}>Botella</Text>
            <Text style={styles.presetAmount}>500 ml</Text>
          </Pressable>
        </View>

        {/* Custom Input */}
        <Card style={styles.customCard}>
          <Text style={styles.customCardTitle}>Cantidad Personalizada</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ej. 350"
              placeholderTextColor={Config.theme.colors.textMuted}
              value={customAmount}
              onChangeText={setCustomAmount}
              keyboardType="numeric"
            />
            <Text style={styles.unitText}>ml</Text>
            <Button
              title="Añadir"
              onPress={() => handleAddLiquids(parseFloat(customAmount))}
              loading={loading}
              variant="primary"
              style={styles.addButton}
            />
          </View>
        </Card>

        {/* History */}
        <Text style={styles.sectionTitle}>Historial de Hoy</Text>
        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No has registrado bebidas hoy.</Text>
          </View>
        ) : (
          logs.map(log => (
            <Card key={log.id} style={styles.historyCard}>
              <View style={styles.historyInfo}>
                <Droplet size={18} color="#3B82F6" fill="#3B82F6" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.historyAmount}>{log.amount} ml</Text>
                  <Text style={styles.historyTime}>{formatTime(log.logged_at)}</Text>
                </View>
              </View>
              <Pressable onPress={() => handleDeleteLog(log.id)} style={styles.deleteBtn}>
                <Trash2 size={16} color={Config.theme.colors.error} />
              </Pressable>
            </Card>
          ))
        )}
      </ScrollView>

      <SuccessModal visible={showSuccess} title={modalTitle} message={modalMessage} onClose={() => setShowSuccess(false)} />
      <ErrorModal visible={showError} title={modalTitle} message={modalMessage} onClose={() => setShowError(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Config.theme.spacing.lg,
    paddingTop: 24,
    paddingBottom: Config.theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Config.theme.colors.cardBorder,
  },
  headerTitle: {
    color: Config.theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: Config.theme.spacing.lg,
    paddingTop: Config.theme.spacing.md,
    paddingBottom: 40,
  },
  progressCard: {
    alignItems: 'center',
    paddingVertical: Config.theme.spacing.lg,
    marginBottom: Config.theme.spacing.md,
  },
  dropletContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  dropletBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dropletFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    opacity: 0.85,
  },
  dropletInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  progressPercentageText: {
    color: Config.theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  statsLabel: {
    color: Config.theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  statsValue: {
    color: Config.theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  statsGoal: {
    color: Config.theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
  sectionTitle: {
    color: Config.theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: Config.theme.spacing.md,
    marginBottom: Config.theme.spacing.sm,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Config.theme.spacing.md,
  },
  presetItem: {
    width: '48%',
    backgroundColor: Config.theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    borderRadius: Config.theme.borderRadius.lg,
    padding: Config.theme.spacing.md,
    alignItems: 'center',
    marginBottom: Config.theme.spacing.sm,
  },
  presetLabel: {
    color: Config.theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  presetAmount: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  customCard: {
    padding: Config.theme.spacing.md,
    marginBottom: Config.theme.spacing.md,
  },
  customCardTitle: {
    color: Config.theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: Config.theme.spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Config.theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    color: Config.theme.colors.text,
    paddingHorizontal: Config.theme.spacing.md,
    fontSize: 16,
  },
  unitText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: Config.theme.spacing.sm,
  },
  addButton: {
    width: 90,
    height: 48,
    marginVertical: 0,
  },
  emptyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: Config.theme.borderRadius.lg,
    padding: Config.theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Config.theme.colors.cardBorder,
    width: '100%',
  },
  emptyText: {
    color: Config.theme.colors.textMuted,
    fontSize: 13,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Config.theme.spacing.sm + 4,
    marginBottom: Config.theme.spacing.xs,
  },
  historyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyAmount: {
    color: Config.theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  historyTime: {
    color: Config.theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
});
