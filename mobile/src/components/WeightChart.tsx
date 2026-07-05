import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Config } from '@/constants/Config';

interface WeightLog {
  id: string;
  weight: number;
  logged_at: string;
}

interface WeightChartProps {
  logs: WeightLog[];
}

export const WeightChart: React.FC<WeightChartProps> = ({ logs }) => {
  // Sort logs by date ascending
  const sortedLogs = [...logs]
    .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
    .slice(-7); // Take last 7 entries

  if (sortedLogs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay datos de peso registrados todavía.</Text>
        <Text style={styles.emptySubtext}>Comienza a registrar tu peso para ver tu progreso.</Text>
      </View>
    );
  }

  const weights = sortedLogs.map(l => l.weight);
  const minWeight = Math.min(...weights) - 1; // subtract 1 for padding at bottom
  const maxWeight = Math.max(...weights) + 1; // add 1 for padding at top
  const weightRange = maxWeight - minWeight === 0 ? 1 : maxWeight - minWeight;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // returns like "05 Jul"
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${day} ${months[date.getMonth()]}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Tendencia de Peso (Últimos 7 registros)</Text>
        <Text style={styles.chartSubtitle}>
          Min: {Math.min(...weights).toFixed(1)} kg | Max: {Math.max(...weights).toFixed(1)} kg
        </Text>
      </View>

      <View style={styles.chartArea}>
        {sortedLogs.map((log, index) => {
          // Calculate height percentage based on weight value
          const heightPercentage = ((log.weight - minWeight) / weightRange) * 100;
          // clamp between 15% and 100% so bars are always visible
          const heightVal = `${Math.max(heightPercentage, 15)}%`;

          return (
            <View key={log.id || index} style={styles.barColumn}>
              {/* Weight Value */}
              <Text style={styles.barValue}>{log.weight.toFixed(1)}</Text>
              
              {/* Bar Track & Fill */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: heightVal },
                    index === sortedLogs.length - 1 && styles.activeBarFill, // highlight latest weight
                  ]}
                />
              </View>

              {/* Date Label */}
              <Text style={styles.barLabel}>{formatDate(log.logged_at)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Config.theme.spacing.md,
    width: '100%',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Config.theme.spacing.md,
  },
  chartTitle: {
    color: Config.theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  chartSubtitle: {
    color: Config.theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: Config.theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Config.theme.colors.cardBorder,
    borderStyle: 'dashed',
    padding: Config.theme.spacing.lg,
  },
  emptyText: {
    color: Config.theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Config.theme.spacing.xs,
  },
  emptySubtext: {
    color: Config.theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: Config.theme.spacing.md,
    paddingBottom: Config.theme.spacing.xs,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: {
    color: Config.theme.colors.text,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: Config.theme.spacing.xs,
  },
  barTrack: {
    width: 14,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Config.theme.borderRadius.full,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: Config.theme.spacing.xs,
  },
  barFill: {
    width: '100%',
    backgroundColor: Config.theme.colors.primaryLight,
    opacity: 0.6,
    borderRadius: Config.theme.borderRadius.full,
  },
  activeBarFill: {
    backgroundColor: Config.theme.colors.primary,
    opacity: 1,
    shadowColor: Config.theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  barLabel: {
    color: Config.theme.colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
});
