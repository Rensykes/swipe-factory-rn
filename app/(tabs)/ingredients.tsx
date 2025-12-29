import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { IngredientWithNutrition } from '@/store/ingredientsSlice';
import {
    clearSelection,
    fetchIngredients,
    removeIngredient,
    setSearchQuery,
    toggleIngredient
} from '@/store/ingredientsSlice';
import { searchMealsByIngredients } from '@/store/mealsSlice';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Memoized ingredient card component for performance
const IngredientCard = memo(({ 
  ingredient, 
  isSelected, 
  onToggle, 
  onShowDetail 
}: { 
  ingredient: IngredientWithNutrition; 
  isSelected: boolean; 
  onToggle: (name: string) => void; 
  onShowDetail: (ingredient: IngredientWithNutrition) => void; 
}) => (
  <View style={styles.ingredientCardWrapper}>
    <Pressable
      style={({ pressed }) => [
        styles.ingredientCard,
        isSelected && styles.ingredientCardSelected,
        pressed && styles.ingredientCardPressed,
      ]}
      onPress={() => onToggle(ingredient.strIngredient)}>
      <View style={styles.cardHeader}>
        <View style={styles.ingredientContent}>
          <ThemedText style={[
            styles.ingredientName,
            isSelected && styles.ingredientNameSelected,
          ]}>
            {ingredient.strIngredient}
          </ThemedText>
          {isSelected && (
            <ThemedText style={styles.checkmark}>✓</ThemedText>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.infoButton,
            pressed && styles.infoButtonPressed,
          ]}
          onPress={() => onShowDetail(ingredient)}>
          <ThemedText style={styles.infoButtonText}>ℹ️</ThemedText>
        </Pressable>
      </View>
      {ingredient.nutrition && (
        <View style={styles.nutritionContainer}>
          <View style={styles.nutritionRow}>
            <View style={styles.nutritionItem}>
              <ThemedText style={styles.nutritionLabel}>Cal</ThemedText>
              <ThemedText style={styles.nutritionValue}>{ingredient.nutrition.calories}</ThemedText>
            </View>
            <View style={styles.nutritionItem}>
              <ThemedText style={styles.nutritionLabel}>Protein</ThemedText>
              <ThemedText style={styles.nutritionValue}>{ingredient.nutrition.protein}</ThemedText>
            </View>
            <View style={styles.nutritionItem}>
              <ThemedText style={styles.nutritionLabel}>Carbs</ThemedText>
              <ThemedText style={styles.nutritionValue}>{ingredient.nutrition.carbs}</ThemedText>
            </View>
            <View style={styles.nutritionItem}>
              <ThemedText style={styles.nutritionLabel}>Fat</ThemedText>
              <ThemedText style={styles.nutritionValue}>{ingredient.nutrition.fat}</ThemedText>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  </View>
));

IngredientCard.displayName = 'IngredientCard';

export default function IngredientsScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { selectedIngredients, filteredIngredients, searchQuery, loading, error } = useAppSelector((state) => state.ingredients);
  const [selectedIngredientDetail, setSelectedIngredientDetail] = useState<IngredientWithNutrition | null>(null);

  useEffect(() => {
    dispatch(fetchIngredients());
  }, [dispatch]);

  const handleToggleIngredient = useCallback((ingredientName: string) => {
    dispatch(toggleIngredient(ingredientName));
  }, [dispatch]);

  const handleRemoveIngredient = useCallback((ingredientName: string) => {
    dispatch(removeIngredient(ingredientName));
  }, [dispatch]);

  const handleClearSelection = useCallback(() => {
    dispatch(clearSelection());
  }, [dispatch]);

  const handleSearchChange = useCallback((text: string) => {
    dispatch(setSearchQuery(text));
  }, [dispatch]);

  const handleSearchMeals = useCallback(() => {
    if (selectedIngredients.length === 0) {
      alert('Please select at least one ingredient');
      return;
    }
    dispatch(searchMealsByIngredients(selectedIngredients));
    router.push('/meals');
  }, [dispatch, router, selectedIngredients]);

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const showIngredientDetail = useCallback((ingredient: IngredientWithNutrition) => {
    console.log('Selected ingredient:', ingredient);
    console.log('Nutrition data:', ingredient.nutrition);
    setSelectedIngredientDetail(ingredient);
    setIsDescriptionExpanded(false);
  }, []);

  const closeIngredientDetail = useCallback(() => {
    setSelectedIngredientDetail(null);
    setIsDescriptionExpanded(false);
  }, []);

  const toggleDescription = useCallback(() => {
    setIsDescriptionExpanded(prev => !prev);
  }, []);

  const selectedSet = useMemo(() => new Set(selectedIngredients), [selectedIngredients]);

  const retryFetch = useCallback(() => {
    dispatch(fetchIngredients());
  }, [dispatch]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <ThemedText type="title" style={styles.title}>
          Ingredients
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Select ingredients from TheMealDB
        </ThemedText>
        
        {selectedIngredients.length > 0 && (
          <View style={styles.pillsContainer}>
            <View style={styles.pillsHeader}>
              <ThemedText style={styles.pillsTitle}>Selected ({selectedIngredients.length})</ThemedText>
              <Pressable
                style={({ pressed }) => [
                  styles.clearAllButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleClearSelection}>
                <ThemedText style={styles.clearAllButtonText}>Clear All</ThemedText>
              </Pressable>
            </View>
            <FlatList<string>
              horizontal
              data={selectedIngredients}
              keyExtractor={(item: string) => item}
              renderItem={({ item }: { item: string }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.pill,
                    pressed && styles.pillPressed,
                  ]}
                  onPress={() => handleRemoveIngredient(item)}>
                  <ThemedText style={styles.pillText}>{item}</ThemedText>
                  <ThemedText style={styles.pillRemove}>×</ThemedText>
                </Pressable>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsContent}
              removeClippedSubviews={true}
            />
            <Pressable
              style={({ pressed }) => [
                styles.searchMealsButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSearchMeals}>
              <ThemedText style={styles.searchMealsButtonText}>Search Meals</ThemedText>
            </Pressable>
          </View>
        )}

        <TextInput
          style={styles.searchInput}
          placeholder="Search ingredients..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </ThemedView>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading ingredients...</ThemedText>
        </View>
      )}

      {error && (
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={retryFetch}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </Pressable>
        </ThemedView>
      )}

      {!loading && !error && (
        <FlatList<IngredientWithNutrition>
          data={filteredIngredients}
          keyExtractor={(item: IngredientWithNutrition) => item.idIngredient}
          renderItem={({ item }: { item: IngredientWithNutrition }) => (
            <IngredientCard
              ingredient={item}
              isSelected={selectedSet.has(item.strIngredient)}
              onToggle={handleToggleIngredient}
              onShowDetail={showIngredientDetail}
            />
          )}
          contentContainerStyle={styles.ingredientList}
          ListEmptyComponent={
            <ThemedView style={styles.emptyState}>
              <ThemedText style={styles.emptyText}>
                {searchQuery ? 'No ingredients found matching your search' : 'Start typing to search for ingredients'}
              </ThemedText>
            </ThemedView>
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={5}
        />
      )}

      {/* Ingredient Detail Modal - Now Scrollable */}
      <Modal
        visible={selectedIngredientDetail !== null}
        transparent
        animationType="fade"
        onRequestClose={closeIngredientDetail}>
        <Pressable style={styles.modalOverlay} onPress={closeIngredientDetail}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {selectedIngredientDetail && (
              <>
                <View style={styles.modalHeader}>
                  <ThemedText type="title" style={styles.modalTitle}>
                    {selectedIngredientDetail.strIngredient}
                  </ThemedText>
                  <Pressable
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={closeIngredientDetail}>
                    <ThemedText style={styles.closeButtonText}>×</ThemedText>
                  </Pressable>
                </View>

                <ScrollView 
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={true}
                  bounces={true}>
                  {selectedIngredientDetail.strDescription && (
                    <View style={styles.modalSection}>
                      <Pressable 
                        style={styles.accordionHeader}
                        onPress={toggleDescription}>
                        <ThemedText style={styles.accordionTitle}>Description</ThemedText>
                        <ThemedText style={styles.accordionIcon}>
                          {isDescriptionExpanded ? '▼' : '▶'}
                        </ThemedText>
                      </Pressable>
                      {isDescriptionExpanded && (
                        <View style={styles.accordionContent}>
                          <ThemedText style={styles.modalDescription}>
                            {selectedIngredientDetail.strDescription}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <ThemedText style={styles.modalSectionTitle}>Nutritional Information (per 100g)</ThemedText>
                    <View style={styles.modalNutritionGrid}>
                      <View style={styles.modalNutritionItem}>
                        <ThemedText style={styles.modalNutritionLabel}>Calories</ThemedText>
                        <ThemedText style={styles.modalNutritionValue}>
                          {selectedIngredientDetail.nutrition?.calories || 'N/A'}
                        </ThemedText>
                      </View>
                      <View style={styles.modalNutritionItem}>
                        <ThemedText style={styles.modalNutritionLabel}>Protein</ThemedText>
                        <ThemedText style={styles.modalNutritionValue}>
                          {selectedIngredientDetail.nutrition?.protein || 'N/A'}
                        </ThemedText>
                      </View>
                      <View style={styles.modalNutritionItem}>
                        <ThemedText style={styles.modalNutritionLabel}>Carbohydrates</ThemedText>
                        <ThemedText style={styles.modalNutritionValue}>
                          {selectedIngredientDetail.nutrition?.carbs || 'N/A'}
                        </ThemedText>
                      </View>
                      <View style={styles.modalNutritionItem}>
                        <ThemedText style={styles.modalNutritionLabel}>Fat</ThemedText>
                        <ThemedText style={styles.modalNutritionValue}>
                          {selectedIngredientDetail.nutrition?.fat || 'N/A'}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.6,
    marginTop: -4,
  },
  pillsContainer: {
    marginTop: 16,
    marginBottom: 4,
  },
  pillsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pillsTitle: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAllButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  clearAllButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pillsContent: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  pillPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pillRemove: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  searchMealsButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  searchMealsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchInput: {
    marginTop: 16,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    borderRadius: 12,
    borderWidth: 0,
    color: '#000',
    fontWeight: '400',
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
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  ingredientList: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  ingredientCardWrapper: {
    position: 'relative',
  },
  ingredientCard: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  ingredientCardSelected: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderColor: '#0A84FF',
    borderWidth: 2,
    shadowColor: '#0A84FF',
    shadowOpacity: 0.3,
  },
  ingredientCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  ingredientContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  ingredientName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    color: '#FFFFFF',
  },
  ingredientNameSelected: {
    color: '#0A84FF',
  },
  checkmark: {
    fontSize: 24,
    color: '#0A84FF',
    fontWeight: 'bold',
  },
  infoButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
  },
  infoButtonPressed: {
    opacity: 0.5,
    transform: [{ scale: 0.9 }],
  },
  infoButtonText: {
    fontSize: 20,
  },
  nutritionContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    padding: 10,
    borderRadius: 10,
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#A0A0A0',
    marginBottom: 5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A84FF',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700',
    flex: 1,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButtonText: {
    fontSize: 28,
    lineHeight: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  accordionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  accordionIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  accordionContent: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#E5E5E7',
    opacity: 0.9,
  },
  modalNutritionGrid: {
    gap: 12,
  },
  modalNutritionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  modalNutritionLabel: {
    fontSize: 15,
    color: '#A0A0A0',
    fontWeight: '500',
  },
  modalNutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A84FF',
  },
});
