import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import { Config } from '@/constants/Config';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';

interface AddExerciseModalProps {
  visible: boolean;
  onSave: (exercise: {
    exercise_type: string;
    duration_minutes: number;
    intensity: string;
  }) => void;
  onClose: () => void;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({ visible, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('Medium'); // Low, Medium, High
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const tempErrors: Record<string, string> = {};
    if (!name.trim()) tempErrors.name = 'El ejercicio es obligatorio';
    if (!duration.trim() || isNaN(Number(duration)) || Number(duration) <= 0) {
      tempErrors.duration = 'Ingresa una duración válida';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    onSave({
      exercise_type: name.trim(),
      duration_minutes: Math.round(Number(duration)),
      intensity: intensity,
    });

    setName('');
    setDuration('');
    setIntensity('Medium');
    setErrors({});
  };

  const handleClose = () => {
    setName('');
    setDuration('');
    setIntensity('Medium');
    setErrors({});
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <Card style={styles.container}>
          <ScrollView 
            contentContainerStyle={{ alignItems: 'center' }} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconCircle}>
              <Dumbbell size={32} color={Config.theme.colors.secondary} />
            </View>
            <Text style={styles.title}>Registrar Ejercicio</Text>

            <View style={styles.form}>
              <Input
                label="Nombre del Ejercicio"
                placeholder="Ej. Correr, Abdominales"
                value={name}
                onChangeText={setName}
                error={errors.name}
              />
              <Input
                label="Duración (minutos)"
                placeholder="Ej. 30"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                error={errors.duration}
              />

              <Text style={styles.intensityLabel}>Intensidad</Text>
              <View style={styles.segmentContainer}>
                <Pressable 
                  style={[styles.segmentBtn, intensity === 'Low' && styles.segmentBtnActive]} 
                  onPress={() => setIntensity('Low')}
                >
                  <Text style={[styles.segmentText, intensity === 'Low' && styles.segmentTextActive]}>Suave</Text>
                </Pressable>
                <Pressable 
                  style={[styles.segmentBtn, intensity === 'Medium' && styles.segmentBtnActive]} 
                  onPress={() => setIntensity('Medium')}
                >
                  <Text style={[styles.segmentText, intensity === 'Medium' && styles.segmentTextActive]}>Medio</Text>
                </Pressable>
                <Pressable 
                  style={[styles.segmentBtn, intensity === 'High' && styles.segmentBtnActive]} 
                  onPress={() => setIntensity('High')}
                >
                  <Text style={[styles.segmentText, intensity === 'High' && styles.segmentTextActive]}>Intenso</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <Button title="Cancelar" onPress={handleClose} variant="outline" style={styles.halfButton} />
              <Button title="Registrar" onPress={handleSave} variant="primary" style={styles.halfButton} />
            </View>
          </ScrollView>
        </Card>
      </KeyboardAvoidingView>
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
    marginBottom: Config.theme.spacing.md,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginBottom: Config.theme.spacing.md,
  },
  intensityLabel: {
    color: Config.theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Config.theme.spacing.sm,
  },
  segmentContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Config.theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    padding: 3,
    height: 48,
    alignItems: 'center',
    marginBottom: Config.theme.spacing.md,
  },
  segmentBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Config.theme.borderRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: Config.theme.colors.secondary,
  },
  segmentText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFFFFF',
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
