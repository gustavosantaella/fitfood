import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Config } from '@/constants/Config';

interface MetricRingProps {
  current: number;
  goal: number;
  label?: string;
}

export const MetricRing: React.FC<MetricRingProps> = ({
  current,
  goal,
  label = 'kcal restantes',
}) => {
  const remaining = Math.max(goal - current, 0);
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isOverGoal = current > goal;
  const overAmount = current - goal;

  return (
    <View style={styles.container}>
      {/* Outer Glow Circle */}
      <View
        style={[
          styles.outerRing,
          {
            borderColor: isOverGoal
              ? Config.theme.colors.error
              : Config.theme.colors.primary,
          },
        ]}
      >
        {/* Inner Content Area */}
        <View style={styles.innerRing}>
          <Text style={styles.caloriesNumber}>
            {isOverGoal ? `+${Math.round(overAmount)}` : Math.round(remaining)}
          </Text>
          <Text style={styles.caloriesLabel}>
            {isOverGoal ? 'kcal excedidas' : label}
          </Text>
          
          {/* Progress Indicator Dots */}
          <View style={styles.progressRow}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isOverGoal
                    ? Config.theme.colors.error
                    : percentage >= 100
                    ? Config.theme.colors.primary
                    : Config.theme.colors.secondary,
                },
              ]}
            />
            <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Config.theme.spacing.lg,
  },
  outerRing: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 4,
    borderStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    shadowColor: Config.theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  innerRing: {
    width: 174,
    height: 174,
    borderRadius: 87,
    backgroundColor: '#0F1626', // slightly lighter for contrast
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  caloriesNumber: {
    color: Config.theme.colors.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  caloriesLabel: {
    color: Config.theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: Config.theme.spacing.sm,
    paddingVertical: Config.theme.spacing.xs,
    borderRadius: Config.theme.borderRadius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  percentageText: {
    color: Config.theme.colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
});
