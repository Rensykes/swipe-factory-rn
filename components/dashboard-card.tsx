import { useThemeColor } from '@/hooks/use-theme-color';
import { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { ThemedView } from './themed-view';

interface DashboardCardProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function DashboardCard({ children, style }: DashboardCardProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#E5E5E5', dark: '#333' }, 'text');

  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
        },
        style,
      ]}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
