import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Config } from '@/constants/Config';

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  unit?: string;
  color?: string;
}

export const MacroBar: React.FC<MacroBarProps> = ({
  label,
  current,
  goal,
  unit = 'g',
  color = Config.theme.colors.primary,
}) => {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          {Math.round(current)}
          <Text style={styles.unit}>{unit}</Text>
          <Text style={styles.goal}> / {goal}{unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Config.theme.spacing.sm,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Config.theme.spacing.xs,
  },
  label: {
    color: Config.theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  values: {
    color: Config.theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  unit: {
    fontSize: 11,
    color: Config.theme.colors.textSecondary,
    fontWeight: 'normal',
  },
  goal: {
    color: Config.theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  track: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Config.theme.borderRadius.full,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: Config.theme.borderRadius.full,
  },
});
