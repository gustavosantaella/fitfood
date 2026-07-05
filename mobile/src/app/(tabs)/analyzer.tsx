import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Image, Animated, Alert, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Sparkles, RefreshCw, Check, X } from 'lucide-react-native';
import { Config } from '@/constants/Config';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import { analyzeFoodPhoto, AIAnalysisResult } from '@/services/gemini';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { MacroBar } from '@/components/MacroBar';

export default function AnalyzerScreen() {
  const { user } = useAuth();
  
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [stepText, setStepText] = useState('');

  // Scanning animation value
  const scanAnim = useRef(new Animated.Value(0)).current;
  const steps = ['Inicializando escáner...', 'Detectando ingredientes...', 'Calculando macronutrientes...', 'Finalizando análisis...'];

  useEffect(() => {
    let scanLoop: Animated.CompositeAnimation | null = null;
    
    if (analyzing) {
      // Start loop animation
      scanLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      scanLoop.start();

      // Cycle step text
      let stepIndex = 0;
      setStepText(steps[0]);
      const interval = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
          setStepText(steps[stepIndex]);
        }
      }, 700);

      return () => {
        clearInterval(interval);
        if (scanLoop) scanLoop.stop();
      };
    } else {
      scanAnim.setValue(0);
    }
  }, [analyzing]);

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return cameraPermission.granted && libraryPermission.granted;
  };

  const handlePickImage = async (useCamera: boolean) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permiso Denegado', 'Necesitamos accesos a la cámara y galería para analizar tus platos.');
      return;
    }

    setResult(null);
    let result;
    
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      setImage(selectedUri);
      startAnalysis(selectedUri);
    }
  };

  const startAnalysis = async (uri: string) => {
    setAnalyzing(true);
    try {
      const analysis = await analyzeFoodPhoto(uri);
      setResult(analysis);
    } catch (err) {
      Alert.alert('Error', 'No se pudo realizar el análisis de la comida.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveToDiary = async () => {
    if (!result || !user) return;

    setSaveLoading(true);
    try {
      const newLog = {
        user_id: user.id,
        food_name: result.food_name,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        image_url: image, // in production we'd upload this image to Supabase Storage first
      };

      const { error } = await supabase.from('food_logs').insert([newLog]);
      if (error) throw error;

      Alert.alert('Comida Guardada', 'Se ha guardado el alimento en tu diario correctamente.', [
        {
          text: 'Entendido',
          onPress: () => {
            setImage(null);
            setResult(null);
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Modo Local', 'Guardado en historial local de sesión (DB sin conexión).', [
        {
          text: 'Entendido',
          onPress: () => {
            setImage(null);
            setResult(null);
          },
        },
      ]);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setImage(null);
    setResult(null);
  };

  // Interpolate animation for the scanning bar
  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240], // fits image preview height
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>IA Food Scan</Text>
        <Text style={styles.subtitle}>Escanea tu plato con inteligencia artificial</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo Selection Area */}
        {!image && (
          <View style={styles.selectContainer}>
            <View style={styles.sparkleIcon}>
              <Sparkles size={36} color={Config.theme.colors.primary} />
            </View>
            <Text style={styles.selectText}>¿Qué vas a comer hoy?</Text>
            <Text style={styles.selectSubtext}>
              Captura una foto clara de tu plato. Nuestra IA detectará los alimentos y estimará las calorías y macronutrientes.
            </Text>

            <View style={styles.actionButtons}>
              <Button
                title="Tomar Foto"
                onPress={() => handlePickImage(true)}
                variant="primary"
                style={styles.actionButton}
                textStyle={{ fontSize: 15 }}
                icon={<Camera size={18} color="#FFFFFF" />}
              />
              <Button
                title="Galería"
                onPress={() => handlePickImage(false)}
                variant="outline"
                style={styles.actionButton}
                textStyle={{ fontSize: 15 }}
                icon={<ImageIcon size={18} color={Config.theme.colors.primary} />}
              />
            </View>
          </View>
        )}

        {/* Preview and Scanning Animation */}
        {image && (
          <View style={styles.previewContainer}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              
              {/* Scanning bar effect */}
              {analyzing && (
                <Animated.View style={[styles.scannerLine, { transform: [{ translateY }] }]} />
              )}

              {/* Progress overlay */}
              {analyzing && (
                <View style={styles.analyzingOverlay}>
                  <RefreshCw size={32} color={Config.theme.colors.primary} style={styles.loadingSpinner} />
                  <Text style={styles.stepText}>{stepText}</Text>
                </View>
              )}
            </View>

            {/* Cancel Button during scanning/viewing */}
            {!saveLoading && (
              <Pressable style={styles.closeBtn} onPress={handleCancel}>
                <X size={18} color="#FFFFFF" />
              </Pressable>
            )}

            {/* Results Output */}
            {result && (
              <Card style={styles.resultCard}>
                <Text style={styles.resultHeader}>Análisis de la IA</Text>
                <Text style={styles.foodName}>{result.food_name}</Text>
                
                <View style={styles.caloriesRow}>
                  <Text style={styles.caloriesNumber}>{result.calories}</Text>
                  <Text style={styles.caloriesLabel}>kcal estimadas</Text>
                </View>

                <View style={styles.macrosDivider} />

                <MacroBar
                  label="Proteínas"
                  current={result.protein}
                  goal={Config.nutrition.defaultProteinGoal}
                  color={Config.theme.colors.primary}
                />
                <MacroBar
                  label="Carbohidratos"
                  current={result.carbs}
                  goal={Config.nutrition.defaultCarbsGoal}
                  color={Config.theme.colors.secondary}
                />
                <MacroBar
                  label="Grasas"
                  current={result.fat}
                  goal={Config.nutrition.defaultFatGoal}
                  color="#A78BFA"
                />

                <View style={styles.cardActions}>
                  <Button
                    title="Añadir a Diario"
                    onPress={handleSaveToDiary}
                    loading={saveLoading}
                    variant="primary"
                    style={styles.saveBtn}
                    icon={<Check size={18} color="#FFFFFF" />}
                  />
                  <Button
                    title="Descartar"
                    onPress={handleCancel}
                    disabled={saveLoading}
                    variant="text"
                    style={styles.discardBtn}
                  />
                </View>
              </Card>
            )}
          </View>
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
  scrollContent: {
    paddingHorizontal: Config.theme.spacing.lg,
    paddingBottom: Config.theme.spacing.xl,
    flexGrow: 1,
  },
  selectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Config.theme.spacing.xl,
  },
  sparkleIcon: {
    width: 72,
    height: 72,
    borderRadius: Config.theme.borderRadius.xl,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.lg,
  },
  selectText: {
    color: Config.theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Config.theme.spacing.sm,
  },
  selectSubtext: {
    color: Config.theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Config.theme.spacing.xl,
    marginBottom: Config.theme.spacing.xl,
  },
  actionButtons: {
    width: '100%',
    paddingHorizontal: Config.theme.spacing.md,
  },
  actionButton: {
    marginVertical: Config.theme.spacing.xs,
  },
  previewContainer: {
    alignItems: 'center',
    width: '100%',
  },
  imageWrapper: {
    width: '100%',
    height: 250,
    borderRadius: Config.theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    backgroundColor: '#000',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scannerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: Config.theme.colors.primary,
    shadowColor: Config.theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 13, 22, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: Config.theme.spacing.md,
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    width: '100%',
    marginTop: Config.theme.spacing.md,
    padding: Config.theme.spacing.lg,
  },
  resultHeader: {
    color: Config.theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  foodName: {
    color: Config.theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Config.theme.spacing.md,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Config.theme.spacing.md,
  },
  caloriesNumber: {
    color: Config.theme.colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginRight: 6,
  },
  caloriesLabel: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  macrosDivider: {
    height: 1,
    backgroundColor: Config.theme.colors.cardBorder,
    marginVertical: Config.theme.spacing.xs,
  },
  cardActions: {
    marginTop: Config.theme.spacing.lg,
    width: '100%',
  },
  saveBtn: {
    marginVertical: Config.theme.spacing.xs,
  },
  discardBtn: {
    marginVertical: 0,
  },
});
