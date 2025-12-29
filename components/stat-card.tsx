import { useThemeColor } from '@/hooks/use-theme-color';
import { StyleSheet, View } from 'react-native';
import { DashboardCard } from './dashboard-card';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
}

export function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = color || tintColor;

  return (
    <DashboardCard style={styles.container}>
      <View style={styles.header}>
        {icon && <IconSymbol name={icon} size={24} color={iconColor} />}
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {title}
        </ThemedText>
      </View>
      <ThemedText type="title" style={[styles.value, { color: iconColor }]}>
        {value}
      </ThemedText>
      {subtitle && (
        <ThemedText style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      )}
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 14,
    opacity: 0.7,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
});
