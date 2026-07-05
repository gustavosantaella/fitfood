import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Dimensions } from 'react-native';
import { Config } from '@/constants/Config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 80; // 8px per tick (10 ticks per item block = 80px wide)
const TICK_WIDTH = ITEM_WIDTH / 10;

interface RulerItem {
  key: string;
  val: number;
}

interface RulerPickerProps {
  minVal: number;
  maxVal: number;
  initialVal: number;
  unit: string;
  onValueChange: (value: number) => void;
  containerWidth?: number;
}

export function RulerPicker({
  minVal,
  maxVal,
  initialVal,
  unit,
  onValueChange,
  containerWidth = SCREEN_WIDTH - 96, // default fits inside a standard card
}: RulerPickerProps) {
  const itemStep = 1;
  const numItems = Math.floor((maxVal - minVal) / itemStep);
  const flatListRef = useRef<FlatList<any>>(null);
  
  const [selectedValue, setSelectedValue] = useState(initialVal);
  const spacerWidth = containerWidth / 2;

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
    const diff = Math.abs(selectedValue - initialVal);
    // Only scroll if value is significantly different (e.g. from async profile load)
    if (diff > 0.15) {
      setSelectedValue(initialVal);
      const timer = setTimeout(() => {
        const scrollOffset = ((initialVal - minVal) / itemStep) * ITEM_WIDTH;
        flatListRef.current?.scrollToOffset({
          offset: scrollOffset,
          animated: false,
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [initialVal, minVal]);

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const value = minVal + (x / ITEM_WIDTH) * itemStep;
    
    // Round to 1 decimal place
    const roundedVal = Math.round(Math.max(minVal, Math.min(maxVal, value)) * 10) / 10;
    if (roundedVal !== selectedValue) {
      setSelectedValue(roundedVal);
      onValueChange(roundedVal);
    }
  };

  const renderItem = ({ item }: { item: string | RulerItem }) => {
    if (item === 'left-spacer' || item === 'right-spacer') {
      return <View style={{ width: spacerWidth }} />;
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

  return (
    <View style={[styles.pickerContainer, { width: containerWidth }]}>
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
          length: index === 0 || index === data.length - 1 ? spacerWidth : ITEM_WIDTH,
          offset: index === 0 ? 0 : spacerWidth + (index - 1) * ITEM_WIDTH,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    height: 100,
    position: 'relative',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  needle: {
    position: 'absolute',
    left: '50%',
    top: 0,
    marginLeft: -1.5,
    width: 3,
    height: 48,
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
    height: 70,
    justifyContent: 'flex-start',
    position: 'relative',
  },
  ticksContainer: {
    height: 40,
    width: '100%',
    position: 'relative',
  },
  tickLine: {
    position: 'absolute',
    top: 0,
    width: 1.5,
    height: 12,
    backgroundColor: Config.theme.colors.cardBorder,
  },
  tickMedium: {
    height: 20,
    backgroundColor: Config.theme.colors.textSecondary,
  },
  tickMajor: {
    height: 32,
    width: 2,
    backgroundColor: Config.theme.colors.text,
  },
  tickLabel: {
    position: 'absolute',
    top: 36,
    left: -16,
    width: 32,
    color: Config.theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});
