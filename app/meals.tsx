import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSelector } from '@/store/hooks';
import type { Meal } from '@/store/mealsSlice';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

type FilterMode = 'all' | 'exact' | 'partial';

export default function MealsScreen() {
  const router = useRouter();
  const { meals, loading, error } = useAppSelector((state) => state.meals);
  const selectedIngredients = useAppSelector((state) => state.ingredients.selectedIngredients);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  // Filter meals based on selected mode
  const filteredMeals = useMemo(() => {
    if (filterMode === 'all') {
      return meals;
    }

    return meals.filter((meal) => {
      const matchingIngredients = meal.ingredients.filter((ing) =>
        selectedIngredients.some((selected) =>
          ing.ingredient.toLowerCase().includes(selected.toLowerCase()) ||
          selected.toLowerCase().includes(ing.ingredient.toLowerCase())
        )
      );

      if (filterMode === 'exact') {
        // Exact match: must have ALL selected ingredients
        return matchingIngredients.length === selectedIngredients.length;
      } else {
        // Partial match: must have at least half of selected ingredients
        return matchingIngredients.length >= Math.ceil(selectedIngredients.length / 2);
      }
    });
  }, [meals, filterMode, selectedIngredients]);

  const renderMealCard = ({ item }: { item: Meal }) => {
    // Calculate how many selected ingredients are in this meal
    const matchingIngredients = item.ingredients.filter((ing) =>
      selectedIngredients.some((selected) =>
        ing.ingredient.toLowerCase().includes(selected.toLowerCase()) ||
        selected.toLowerCase().includes(ing.ingredient.toLowerCase())
      )
    );

    return (
      <Pressable
        style={({ pressed }) => [
          styles.mealCard,
          pressed && styles.mealCardPressed,
        ]}
        onPress={() => router.push(`/meal-detail?id=${item.idMeal}`)}>
        <Image
          source={{ uri: item.strMealThumb }}
          style={styles.mealImage}
          resizeMode="cover"
        />
        <View style={styles.mealContent}>
          <View style={styles.mealHeader}>
            <ThemedText style={styles.mealName} numberOfLines={2}>
              {item.strMeal}
            </ThemedText>
            <View style={styles.mealBadges}>
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>{item.strCategory}</ThemedText>
              </View>
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>{item.strArea}</ThemedText>
              </View>
            </View>
          </View>

          {matchingIngredients.length > 0 && (
            <View style={styles.matchSection}>
              <ThemedText style={styles.matchTitle}>
                Matching Ingredients ({matchingIngredients.length}/{selectedIngredients.length})
              </ThemedText>
              <View style={styles.matchList}>
                {matchingIngredients.map((ing, index) => (
                  <View key={index} style={styles.matchPill}>
                    <ThemedText style={styles.matchPillText}>
                      {ing.ingredient} {ing.measure && `(${ing.measure})`}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          <ScrollView
            style={styles.ingredientsScroll}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}>
            <ThemedText style={styles.ingredientsTitle}>All Ingredients:</ThemedText>
            {item.ingredients.map((ing, index) => {
              const isMatching = matchingIngredients.some((m) => m.ingredient === ing.ingredient);
              return (
                <View key={index} style={styles.ingredientRow}>
                  <ThemedText style={[
                    styles.ingredientText,
                    isMatching && styles.ingredientTextMatching,
                  ]}>
                    {isMatching && '✓ '}
                    {ing.ingredient}
                  </ThemedText>
                  <ThemedText style={styles.measureText}>{ing.measure}</ThemedText>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </Pressable>
        <ThemedText type="title" style={styles.title}>
          Meal Suggestions
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Based on {selectedIngredients.length} selected ingredient{selectedIngredients.length !== 1 ? 's' : ''}
        </ThemedText>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <ThemedText style={styles.filterLabel}>Filter:</ThemedText>
          <View style={styles.filterButtons}>
            <Pressable
              style={[
                styles.filterButton,
                filterMode === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setFilterMode('all')}>
              <ThemedText style={[
                styles.filterButtonText,
                filterMode === 'all' && styles.filterButtonTextActive,
              ]}>
                All ({meals.length})
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.filterButton,
                filterMode === 'exact' && styles.filterButtonActive,
              ]}
              onPress={() => setFilterMode('exact')}>
              <ThemedText style={[
                styles.filterButtonText,
                filterMode === 'exact' && styles.filterButtonTextActive,
              ]}>
                Exact Match
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.filterButton,
                filterMode === 'partial' && styles.filterButtonActive,
              ]}
              onPress={() => setFilterMode('partial')}>
              <ThemedText style={[
                styles.filterButtonText,
                filterMode === 'partial' && styles.filterButtonTextActive,
              ]}>
                50%+ Match
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A84FF" />
          <ThemedText style={styles.loadingText}>Finding meals...</ThemedText>
        </View>
      )}

      {error && (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      )}

      {!loading && !error && filteredMeals.length === 0 && (
        <ThemedView style={styles.emptyState}>
          <ThemedText style={styles.emptyText}>
            {filterMode === 'all' 
              ? 'No meals found with the selected ingredients'
              : `No meals found matching the "${filterMode === 'exact' ? 'exact match' : '50%+ match'}" filter`
            }
          </ThemedText>
        </ThemedView>
      )}

      {!loading && !error && filteredMeals.length > 0 && (
        <FlatList<Meal>
          data={filteredMeals}
          keyExtractor={(item) => item.idMeal}
          renderItem={renderMealCard}
          contentContainerStyle={styles.mealsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    marginBottom: 16,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A84FF',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    color: '#A0A0A0',
  },
  filterSection: {
    marginTop: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E5E7',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderColor: '#0A84FF',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A0A0A0',
  },
  filterButtonTextActive: {
    color: '#0A84FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  mealsList: {
    padding: 20,
    gap: 20,
  },
  mealCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mealCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  mealImage: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  mealContent: {
    padding: 16,
  },
  mealHeader: {
    marginBottom: 12,
  },
  mealName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  mealBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0A84FF',
  },
  matchSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 8,
  },
  matchList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  matchPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    borderRadius: 6,
  },
  matchPillText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  ingredientsScroll: {
    maxHeight: 200,
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E5E7',
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  ingredientText: {
    fontSize: 14,
    color: '#A0A0A0',
    flex: 1,
  },
  ingredientTextMatching: {
    color: '#34C759',
    fontWeight: '600',
  },
  measureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});
