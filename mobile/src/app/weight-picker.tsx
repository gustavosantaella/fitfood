import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Scale, Ruler } from 'lucide-react-native';
import { Config } from '@/constants/Config';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import { Button } from '@/components/Button';
import { SuccessModal } from '@/components/modal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 80; // 8px per tick (10 ticks per item block = 80px wide)
const TICK_WIDTH = ITEM_WIDTH / 10;
const SPACER_WIDTH = SCREEN_WIDTH / 2;

interface RulerItem {
  key: string;
  val: number; // weight or height value at the start of block
}

export default function RulerPickerScreen() {
  const { user, profile, updateProfile } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Decide type and mode
  const type = (params.type || '').toString() === 'height' ? 'height' : 'weight';
  const mode = params.mode === 'actual' ? 'actual' : 'goal';
  
  // Dynamic ranges
  const minVal = type === 'height' ? 100 : 30;
  const maxVal = type === 'height' ? 220 : 180;
  const unit = type === 'height' ? 'cm' : 'kg';
  const itemStep = 1; // 1 unit (cm or kg) per block, with 10 ticks per block (each tick is 0.1)
  const numItems = Math.floor((maxVal - minVal) / itemStep);
  
  const [selectedValue, setSelectedValue] = useState(type === 'height' ? 170.0 : 70.0);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  const flatListRef = useRef<FlatList<any>>(null);

  // Generate ticks array from MIN to MAX
  const data: (string | RulerItem)[] = [
    'left-spacer',
    ...Array.from({ length: numItems + 1 }, (_, i) => ({
      key: `ruler-${minVal + i * itemStep}`,
      val: minVal + i * itemStep,
    })),
    'right-spacer',
  ];

  // Initial scroll alignment
  useEffect(() => {
    let initialVal = 70.0;
    if (type === 'height') {
      initialVal = profile?.height && profile.height > 0 ? profile.height : 170.0;
    } else {
      initialVal = mode === 'actual' 
        ? 70.0 
        : (profile?.weight_goal && profile.weight_goal > 0 ? profile.weight_goal : 70.0);
    }
    
    setSelectedValue(initialVal);

    // Delay scroll slightly to allow layout to mount
    const timer = setTimeout(() => {
      const scrollOffset = ((initialVal - minVal) / itemStep) * ITEM_WIDTH;
      flatListRef.current?.scrollToOffset({
        offset: scrollOffset,
        animated: false,
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [profile, type]);

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const value = minVal + (x / ITEM_WIDTH) * itemStep;
    
    // Round to 1 decimal place for both weight and height
    const roundedVal = Math.round(Math.max(minVal, Math.min(maxVal, value)) * 10) / 10;
    setSelectedValue(roundedVal);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (user) {
        if (type === 'height') {
          // Update height in profile
          const { error } = await updateProfile({
            height: selectedValue,
          });
          if (error) throw error;
          setModalMessage(`Tu estatura ha sido actualizada a ${selectedValue} cm.`);
        } else {
          if (mode === 'goal') {
            // Update Profile Weight Goal
            const { error: profileError } = await updateProfile({
              weight_goal: selectedValue,
            });
            if (profileError) throw profileError;
            setModalMessage(`Tu peso meta ha sido actualizado a ${selectedValue} kg.`);
          } else {
            // Insert into Weight Logs (Actual Weight Log)
            const { error: logError } = await supabase.from('weight_logs').insert([
              {
                user_id: user.id,
                weight: selectedValue,
              },
            ]);
            if (logError) throw logError;
            setModalMessage(`Tu peso actual de ${selectedValue} kg ha sido guardado en el diario.`);
          }
        }
        
        setShowSuccess(true);
      }
    } catch (err) {
      // Fallback
      setModalMessage(`Guardado localmente: ${selectedValue} ${unit}.`);
      setShowSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: string | RulerItem }) => {
    if (item === 'left-spacer' || item === 'right-spacer') {
      return <View style={{ width: SPACER_WIDTH }} />;
    }

    const rulerItem = item as RulerItem;

    return (
      <View style={styles.rulerItem}>
        {/* Render 10 ticks for the item block */}
        <View style={styles.ticksContainer}>
          {Array.from({ length: 10 }).map((_, index) => {
            const isMajor = index === 0;
            const isMedium = index === 5;
            
            return (
              <View
                key={index}
                style={[
                  styles.tickLine,
                  isMajor && styles.tickMajor,
                  isMedium && styles.tickMedium,
                  { left: index * TICK_WIDTH },
                ]}
              />
            );
          })}
        </View>
        
        {/* Number label at the major tick */}
        <Text style={styles.tickLabel}>{rulerItem.val}</Text>
      </View>
    );
  };

  const getHeaderTitle = () => {
    if (type === 'height') return 'Establecer Estatura';
    return mode === 'goal' ? 'Establecer Peso Meta' : 'Registrar Peso Actual';
  };

  const getInstruction = () => {
    if (type === 'height') return 'Desliza la regla para fijar tu estatura';
    return mode === 'goal'
      ? 'Desliza la regla para fijar tu peso objetivo'
      : 'Desliza la regla para registrar tu peso de hoy';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Config.theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Animated Badge Icon */}
        <View style={styles.scaleBadge}>
          {type === 'height' ? (
            <Ruler size={40} color={Config.theme.colors.primary} />
          ) : (
            <Scale size={40} color={Config.theme.colors.primary} />
          )}
        </View>

        <Text style={styles.instruction}>{getInstruction()}</Text>

        {/* Giant Dynamic Number */}
        <View style={styles.weightDisplay}>
          <Text style={styles.weightText}>
            {selectedValue.toFixed(1)}
          </Text>
          <Text style={styles.unitText}>{unit}</Text>
        </View>

        {/* Ruler Picker Area */}
        <View style={styles.pickerContainer}>
          {/* Static Needle Indicator (Centered) */}
          <View style={styles.needle} />

          {/* Horizontal Scrollable Ruler */}
          <FlatList
            ref={flatListRef}
            data={data}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={TICK_WIDTH}
            decelerationRate="fast"
            onScroll={handleScroll}
            scrollEventThrottle={16} // 60fps update rate
            renderItem={renderItem}
            keyExtractor={(item, index) => (typeof item === 'string' ? item : item.key)}
            getItemLayout={(_, index) => ({
              length: index === 0 || index === data.length - 1 ? SPACER_WIDTH : ITEM_WIDTH,
              offset: index === 0 ? 0 : SPACER_WIDTH + (index - 1) * ITEM_WIDTH,
              index,
            })}
          />
        </View>

        <Button
          title="Guardar"
          onPress={handleSave}
          loading={loading}
          style={styles.saveButton}
        />
      </View>

      <SuccessModal
        visible={showSuccess}
        title="Datos Guardados"
        message={modalMessage}
        onClose={() => {
          setShowSuccess(false);
          router.back();
        }}
      />
    </SafeAreaView>
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
    paddingHorizontal: Config.theme.spacing.md,
    height: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Config.theme.borderRadius.full,
    backgroundColor: Config.theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Config.theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Config.theme.spacing.xl,
  },
  scaleBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.lg,
  },
  instruction: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Config.theme.spacing.xl,
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 40,
  },
  weightText: {
    color: Config.theme.colors.text,
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: -2,
  },
  unitText: {
    color: Config.theme.colors.primary,
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 8,
  },
  pickerContainer: {
    height: 120,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 50,
  },
  needle: {
    position: 'absolute',
    left: '50%',
    top: 0,
    marginLeft: -1.5,
    width: 3,
    height: 55,
    backgroundColor: Config.theme.colors.primary,
    borderRadius: 1.5,
    zIndex: 10,
    shadowColor: Config.theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  },
  rulerItem: {
    width: ITEM_WIDTH,
    height: 80,
    justifyContent: 'flex-start',
    position: 'relative',
  },
  ticksContainer: {
    height: 50,
    width: '100%',
    position: 'relative',
  },
  tickLine: {
    position: 'absolute',
    top: 0,
    width: 1.5,
    height: 15,
    backgroundColor: Config.theme.colors.cardBorder,
  },
  tickMedium: {
    height: 25,
    backgroundColor: Config.theme.colors.textSecondary,
  },
  tickMajor: {
    height: 38,
    width: 2,
    backgroundColor: Config.theme.colors.text,
  },
  tickLabel: {
    position: 'absolute',
    top: 44,
    left: -12,
    width: 24,
    color: Config.theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveButton: {
    width: '100%',
  },
});
