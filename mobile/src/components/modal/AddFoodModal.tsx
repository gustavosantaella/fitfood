import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Utensils } from 'lucide-react-native';
import { Config } from '@/constants/Config';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';

interface AddFoodModalProps {
  visible: boolean;
  onSave: (food: {
    food_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
  onClose: () => void;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({ visible, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const tempErrors: Record<string, string> = {};
    if (!name.trim()) tempErrors.name = 'El nombre es obligatorio';
    if (!calories.trim() || isNaN(Number(calories)) || Number(calories) < 0) {
      tempErrors.calories = 'Ingresa calorías válidas';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    onSave({
      food_name: name.trim(),
      calories: Math.round(Number(calories)),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    });

    // Reset fields
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setErrors({});
  };

  const handleClose = () => {
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
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
              <Utensils size={32} color={Config.theme.colors.primary} />
            </View>
            <Text style={styles.title}>Registrar Comida</Text>

            <View style={styles.form}>
              <Input
                label="Nombre del Alimento"
                placeholder="Ej. Pechuga de pollo"
                value={name}
                onChangeText={setName}
                error={errors.name}
              />
              <Input
                label="Calorías (kcal)"
                placeholder="Ej. 250"
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                error={errors.calories}
              />
              <View style={styles.row}>
                <View style={styles.col}>
                  <Input
                    label="Prot. (g)"
                    placeholder="0"
                    value={protein}
                    onChangeText={setProtein}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.col}>
                  <Input
                    label="Carb. (g)"
                    placeholder="0"
                    value={carbs}
                    onChangeText={setCarbs}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.col}>
                  <Input
                    label="Gras. (g)"
                    placeholder="0"
                    value={fat}
                    onChangeText={setFat}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <Button 
                title="Cancelar" 
                onPress={handleClose} 
                variant="outline" 
                style={[styles.halfButton, { borderColor: Config.theme.colors.error }]} 
                textStyle={{ color: '#FFFFFF' }}
              />
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  col: {
    flex: 0.31,
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
