import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MealIdea } from '@/services/openaiService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteSavedMeal, loadSavedMeals } from '@/store/mealPlannerSlice';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
type RecipeSource = 'ai' | 'mealdb' | 'all';

export default function RecipeBookScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { savedMeals: aiMeals, isLoading: loadingAI } = useAppSelector(
    (state) => state.mealPlanner
  );
  const { user } = useAppSelector((state) => state.auth);

  const [sourceFilter, setSourceFilter] = useState<RecipeSource>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<MealIdea | null>(null);
  const [mealDBRecipes, setMealDBRecipes] = useState<any[]>([]);
  const [loadingMealDB, setLoadingMealDB] = useState(true);

  const loadMealDBRecipes = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoadingMealDB(true);
      // Load saved MealDB recipes from Firestore
      const { firestoreService } = await import('@/services/firestoreService');
      const savedMeals = await firestoreService.getUserMeals(user.uid);
      setMealDBRecipes(savedMeals);
    } catch (error) {
      console.error('Error loading MealDB recipes:', error);
    } finally {
      setLoadingMealDB(false);
    }
  }, [user]);

  useEffect(() => {
    dispatch(loadSavedMeals());
    loadMealDBRecipes();
  }, [dispatch, loadMealDBRecipes]);

  const handleDeleteAIRecipe = async (mealId: string) => {
    Alert.alert('Delete Recipe', 'Are you sure you want to delete this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(deleteSavedMeal(mealId)).unwrap();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete recipe');
          }
        },
      },
    ]);
  };

  const handleDeleteMealDBRecipe = async (mealId: string) => {
    Alert.alert('Delete Recipe', 'Are you sure you want to delete this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { firestoreService } = await import('@/services/firestoreService');
            await firestoreService.deleteMeal(mealId);
            setMealDBRecipes((prev) => prev.filter((meal) => meal.id !== mealId));
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete recipe');
          }
        },
      },
    ]);
  };

  const filteredAIRecipes = aiMeals.filter((meal) => {
    const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const filteredMealDBRecipes = mealDBRecipes.filter((meal) => {
    const matchesSearch = meal.mealName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meal.area?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const showRecipes = {
    ai: sourceFilter === 'all' || sourceFilter === 'ai',
    mealdb: sourceFilter === 'all' || sourceFilter === 'mealdb',
  };

  const totalRecipes = 
    (showRecipes.ai ? filteredAIRecipes.length : 0) + 
    (showRecipes.mealdb ? filteredMealDBRecipes.length : 0);

  const isLoading = loadingAI || loadingMealDB;

  const renderAIRecipeCard = (recipe: MealIdea) => (
    <ThemedView key={recipe.id} style={styles.recipeCard}>
      <View style={styles.recipeHeader}>
        <View style={styles.recipeHeaderLeft}>
          <ThemedText type="subtitle" style={styles.recipeName}>
            {recipe.name}
          </ThemedText>
          <View style={styles.sourceBadge}>
            <ThemedText style={styles.sourceBadgeText}>✨ AI Generated</ThemedText>
          </View>
        </View>
      </View>

      <ThemedText style={styles.recipeDescription} numberOfLines={2}>
        {recipe.description}
      </ThemedText>

      {recipe.tags && recipe.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {recipe.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <ThemedText style={styles.tagText}>{tag}</ThemedText>
            </View>
          ))}
        </View>
      )}

      <View style={styles.recipeStats}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statLabel}>⏱️</ThemedText>
          <ThemedText style={styles.statValue}>
            {recipe.prepTime} + {recipe.cookTime}
          </ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statLabel}>🍽️</ThemedText>
          <ThemedText style={styles.statValue}>{recipe.servings} servings</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statLabel}>🔥</ThemedText>
          <ThemedText style={styles.statValue}>{recipe.nutrition.calories} cal</ThemedText>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.viewButton, pressed && styles.buttonPressed]}
          onPress={() => setSelectedRecipe(recipe)}>
          <ThemedText style={styles.viewButtonText}>View Recipe</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
          onPress={() => recipe.id && handleDeleteAIRecipe(recipe.id)}>
          <ThemedText style={styles.deleteButtonText}>🗑️</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );

  const renderMealDBRecipeCard = (recipe: any) => (
    <ThemedView key={recipe.id} style={styles.recipeCard}>
      <View style={styles.recipeHeader}>
        {recipe.mealThumb && (
          <Image source={{ uri: recipe.mealThumb }} style={styles.recipeImage} />
        )}
        <View style={styles.recipeHeaderLeft}>
          <ThemedText type="subtitle" style={styles.recipeName}>
            {recipe.mealName}
          </ThemedText>
          <View style={[styles.sourceBadge, styles.mealDBBadge]}>
            <ThemedText style={styles.sourceBadgeText}>📚 MealDB</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.mealDBInfo}>
        {recipe.category && (
          <View style={styles.infoPill}>
            <ThemedText style={styles.infoPillText}>{recipe.category}</ThemedText>
          </View>
        )}
        {recipe.area && (
          <View style={styles.infoPill}>
            <ThemedText style={styles.infoPillText}>{recipe.area}</ThemedText>
          </View>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.viewButton, pressed && styles.buttonPressed]}
          onPress={() => router.push(`/meal-detail?id=${recipe.mealId}`)}>
          <ThemedText style={styles.viewButtonText}>View Recipe</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
          onPress={() => handleDeleteMealDBRecipe(recipe.id)}>
          <ThemedText style={styles.deleteButtonText}>🗑️</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Recipe Book</ThemedText>
        <ThemedText style={styles.subtitle}>
          Your collection of saved recipes ({totalRecipes})
        </ThemedText>
      </ThemedView>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <Pressable
            style={({ pressed }) => [
              styles.filterButton,
              sourceFilter === 'all' && styles.filterButtonActive,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setSourceFilter('all')}>
            <ThemedText
              style={[
                styles.filterButtonText,
                sourceFilter === 'all' && styles.filterButtonTextActive,
              ]}>
              All Recipes
            </ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.filterButton,
              sourceFilter === 'ai' && styles.filterButtonActive,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setSourceFilter('ai')}>
            <ThemedText
              style={[
                styles.filterButtonText,
                sourceFilter === 'ai' && styles.filterButtonTextActive,
              ]}>
              ✨ AI Recipes
            </ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.filterButton,
              sourceFilter === 'mealdb' && styles.filterButtonActive,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setSourceFilter('mealdb')}>
            <ThemedText
              style={[
                styles.filterButtonText,
                sourceFilter === 'mealdb' && styles.filterButtonTextActive,
              ]}>
              📚 MealDB Recipes
            </ThemedText>
          </Pressable>
        </ScrollView>
      </View>

      <ThemedView style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </ThemedView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading recipes...</ThemedText>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {totalRecipes === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={styles.emptyIcon}>📖</ThemedText>
              <ThemedText style={styles.emptyTitle}>No Recipes Yet</ThemedText>
              <ThemedText style={styles.emptyText}>
                {searchQuery
                  ? 'No recipes match your search'
                  : 'Save recipes from the Meal Planner or Meals page to see them here'}
              </ThemedText>
            </View>
          ) : (
            <>
              {showRecipes.ai && filteredAIRecipes.length > 0 && (
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>
                    AI Generated Recipes ({filteredAIRecipes.length})
                  </ThemedText>
                  {filteredAIRecipes.map(renderAIRecipeCard)}
                </View>
              )}

              {showRecipes.mealdb && filteredMealDBRecipes.length > 0 && (
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>
                    MealDB Recipes ({filteredMealDBRecipes.length})
                  </ThemedText>
                  {filteredMealDBRecipes.map(renderMealDBRecipeCard)}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* AI Recipe Detail Modal */}
      <Modal
        visible={selectedRecipe !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRecipe(null)}>
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalCard}>
            {selectedRecipe && (
              <>
                <View style={styles.modalHeader}>
                  <ThemedText type="title" style={styles.modalTitle}>
                    {selectedRecipe.name}
                  </ThemedText>
                  <Pressable
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => setSelectedRecipe(null)}>
                    <ThemedText style={styles.closeButtonText}>×</ThemedText>
                  </Pressable>
                </View>

                <ScrollView style={styles.modalScroll}>
                  <ThemedText style={styles.modalDescription}>
                    {selectedRecipe.description}
                  </ThemedText>

                  <View style={styles.modalSection}>
                    <ThemedText type="subtitle" style={styles.modalSectionTitle}>
                      Ingredients
                    </ThemedText>
                    {selectedRecipe.ingredients.map((ing, index) => (
                      <View key={index} style={styles.ingredientRow}>
                        <ThemedText style={styles.ingredientBullet}>•</ThemedText>
                        <ThemedText style={styles.ingredientText}>
                          {ing.amount} {ing.name}
                        </ThemedText>
                      </View>
                    ))}
                  </View>

                  <View style={styles.modalSection}>
                    <ThemedText type="subtitle" style={styles.modalSectionTitle}>
                      Instructions
                    </ThemedText>
                    <ThemedText style={styles.instructionsText}>
                      {selectedRecipe.instructions}
                    </ThemedText>
                  </View>

                  <View style={styles.modalSection}>
                    <ThemedText type="subtitle" style={styles.modalSectionTitle}>
                      Nutrition (per serving)
                    </ThemedText>
                    <View style={styles.nutritionGrid}>
                      <View style={styles.nutritionItem}>
                        <ThemedText style={styles.nutritionLabel}>Calories</ThemedText>
                        <ThemedText style={styles.nutritionValue}>
                          {selectedRecipe.nutrition.calories}
                        </ThemedText>
                      </View>
                      <View style={styles.nutritionItem}>
                        <ThemedText style={styles.nutritionLabel}>Protein</ThemedText>
                        <ThemedText style={styles.nutritionValue}>
                          {selectedRecipe.nutrition.protein}g
                        </ThemedText>
                      </View>
                      <View style={styles.nutritionItem}>
                        <ThemedText style={styles.nutritionLabel}>Carbs</ThemedText>
                        <ThemedText style={styles.nutritionValue}>
                          {selectedRecipe.nutrition.carbs}g
                        </ThemedText>
                      </View>
                      <View style={styles.nutritionItem}>
                        <ThemedText style={styles.nutritionLabel}>Fat</ThemedText>
                        <ThemedText style={styles.nutritionValue}>
                          {selectedRecipe.nutrition.fat}g
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </ThemedView>
        </View>
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
    paddingBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  filterButtonTextActive: {
    color: '#fff',
    opacity: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    opacity: 0.8,
  },
  recipeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  recipeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recipeHeaderLeft: {
    flex: 1,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  mealDBBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
  },
  recipeDescription: {
    fontSize: 14,
    opacity: 0.75,
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  recipeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  mealDBInfo: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  infoPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
  },
  infoPillText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 50,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  closeButtonText: {
    fontSize: 28,
    fontWeight: '300',
    opacity: 0.6,
  },
  modalScroll: {
    flex: 1,
    paddingBottom: 20,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
    padding: 20,
    paddingBottom: 10,
    opacity: 0.8,
  },
  modalSection: {
    padding: 20,
    paddingTop: 10,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ingredientBullet: {
    fontSize: 16,
    marginRight: 8,
    opacity: 0.5,
  },
  ingredientText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  instructionsText: {
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.8,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 11,
    opacity: 0.6,
    marginBottom: 2,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
});
