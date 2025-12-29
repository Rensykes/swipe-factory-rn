import { useThemeColor } from '@/hooks/use-theme-color';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';

interface QuickAction {
  title: string;
  icon: string;
  color: string;
  route?: string;
  onPress?: () => void;
}

const quickActions: QuickAction[] = [
  {
    title: 'Ingredients',
    icon: '🥬',
    color: '#34C759',
    route: '/ingredients',
  },
  {
    title: 'Find Meals',
    icon: '🍽️',
    color: '#FF9500',
    route: '/meals',
  },
  {
    title: 'Profile',
    icon: '👤',
    color: '#007AFF',
    route: '/profile',
  },
];

export function QuickActions() {
  const backgroundColor = useThemeColor({ light: '#F5F5F5', dark: '#2C2C2C' }, 'background');

  const handlePress = (action: QuickAction) => {
    if (action.onPress) {
      action.onPress();
    } else if (action.route) {
      router.push(action.route as any);
    }
  };

  return (
    <View style={styles.container}>
      {quickActions.map((action, index) => (
        <Pressable
          key={index}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor },
            pressed && styles.pressed,
          ]}
          onPress={() => handlePress(action)}>
          <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
            <ThemedText style={styles.icon}>{action.icon}</ThemedText>
          </View>
          <ThemedText style={styles.actionTitle} numberOfLines={1}>
            {action.title}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
