import { DashboardCard } from '@/components/dashboard-card';
import { QuickActions } from '@/components/quick-actions';
import { StatCard } from '@/components/stat-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAppSelector } from '@/store/hooks';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const profile = useAppSelector((state) => state.profile.profile);
  const meals = useAppSelector((state) => state.meals.meals);
  const selectedIngredients = useAppSelector((state) => state.ingredients.selectedIngredients);
  
  const [greeting, setGreeting] = useState('Hello');
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const todayCalories = profile?.targetCalories || 0;
  const targetProtein = profile?.targetProtein || 0;
  const mealsCount = meals.length;
  const ingredientsCount = selectedIngredients.length;

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* Header Section with Gradient */}
        <LinearGradient
          colors={[tintColor + 'CC', tintColor + '66']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}>
          <View style={styles.header}>
            <View>
              <ThemedText type="title" style={styles.greeting}>
                {greeting}
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.userName}>
                {profile?.name || 'Welcome to Swipe Factory'}
              </ThemedText>
            </View>
            <View style={styles.profileIcon}>
              <IconSymbol name="person.fill" size={32} color="#fff" />
            </View>
          </View>
        </LinearGradient>

        {/* Stats Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Today's Overview
          </ThemedText>
          <View style={styles.statsGrid}>
            <StatCard
              title="Target Calories"
              value={todayCalories > 0 ? todayCalories : '--'}
              subtitle={todayCalories > 0 ? 'kcal/day' : 'Set up profile'}
              icon="flame"
              color="#FF6B6B"
            />
            <StatCard
              title="Protein Goal"
              value={targetProtein > 0 ? `${targetProtein}g` : '--'}
              subtitle={targetProtein > 0 ? 'per day' : 'Complete profile'}
              icon="dumbbell"
              color="#4ECDC4"
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              title="Ingredients"
              value={ingredientsCount}
              subtitle={ingredientsCount > 0 ? 'selected' : 'Add some'}
              icon="leaf"
              color="#95E1D3"
            />
            <StatCard
              title="Meals Found"
              value={mealsCount}
              subtitle={mealsCount > 0 ? 'available' : 'Search now'}
              icon="restaurant"
              color="#F38181"
            />
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Quick Actions
          </ThemedText>
          <QuickActions />
        </View>

        {/* Recent Meals Section */}
        {meals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Recent Meals
              </ThemedText>
              <Pressable onPress={() => router.push('/meals')}>
                <ThemedText style={[styles.seeAll, { color: tintColor }]}>
                  See All
                </ThemedText>
              </Pressable>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mealsScroll}>
              {meals.slice(0, 5).map((meal) => (
                <Pressable
                  key={meal.idMeal}
                  style={styles.mealCard}
                  onPress={() => router.push(`/meal-detail?id=${meal.idMeal}`)}>
                  <DashboardCard style={styles.mealCardInner}>
                    <View style={styles.mealImageContainer}>
                      <IconSymbol name="restaurant" size={48} color="#999" />
                    </View>
                    <ThemedText 
                      type="defaultSemiBold" 
                      numberOfLines={2}
                      style={styles.mealTitle}>
                      {meal.strMeal}
                    </ThemedText>
                    <ThemedText style={styles.mealCategory} numberOfLines={1}>
                      {meal.strCategory} • {meal.strArea}
                    </ThemedText>
                  </DashboardCard>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.section}>
          <DashboardCard>
            <View style={styles.tipContainer}>
              <ThemedText style={styles.tipIcon}>💡</ThemedText>
              <View style={styles.tipContent}>
                <ThemedText type="defaultSemiBold" style={styles.tipTitle}>
                  Tip of the Day
                </ThemedText>
                <ThemedText style={styles.tipText}>
                  {profile?.targetCalories 
                    ? "Track your ingredients to find perfect meal matches!"
                    : "Complete your profile to get personalized nutrition goals!"}
                </ThemedText>
              </View>
            </View>
          </DashboardCard>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  profileIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileEmoji: {
    fontSize: 28,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  mealsScroll: {
    paddingRight: 20,
    gap: 12,
  },
  mealCard: {
    width: 160,
  },
  mealCardInner: {
    padding: 12,
  },
  mealImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mealPlaceholder: {
    fontSize: 48,
  },
  mealTitle: {
    fontSize: 14,
    marginBottom: 4,
    minHeight: 36,
  },
  mealCategory: {
    fontSize: 12,
    opacity: 0.6,
  },
  tipContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tipIcon: {
    fontSize: 32,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
});
