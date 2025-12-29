import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
  const colorScheme = useColorScheme();
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
    <ThemedView key={recipe.id} style={[
      styles.recipeCard,
      { 
        backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#fff',
        borderColor: colorScheme === 'dark' ? '#2C2C2E' : 'rgba(128, 128, 128, 0.2)'
      }
    ]}>
      <View style={styles.recipeHeader}>
        <ThemedText style={styles.recipeName}>
          {recipe.name}
        </ThemedText>
        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {recipe.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colorScheme === 'dark' ? '#1C3A57' : '#e8f4ff' }]}>
                <ThemedText style={[styles.tagText, { color: '#007AFF' }]}>{tag}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>

      <ThemedText style={styles.recipeDescription}>
        {recipe.description}
      </ThemedText>

      <ThemedView style={[
        styles.mealInfo,
        { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#f8f8f8' }
      ]}>
        <View style={styles.infoRow}>
          <IconSymbol name="clock" size={16} color="#999" style={styles.infoIcon} />
          <ThemedText style={styles.infoLabel}>Prep:</ThemedText>
          <ThemedText style={styles.infoValue}>{recipe.prepTime} min</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <IconSymbol name="flame" size={16} color="#999" style={styles.infoIcon} />
          <ThemedText style={styles.infoLabel}>Cook:</ThemedText>
          <ThemedText style={styles.infoValue}>{recipe.cookTime} min</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <IconSymbol name="fork.knife" size={16} color="#999" style={styles.infoIcon} />
          <ThemedText style={styles.infoLabel}>Servings:</ThemedText>
          <ThemedText style={styles.infoValue}>{recipe.servings}</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.nutritionGrid}>
        <View style={styles.nutritionItemLarge}>
          <ThemedText style={styles.nutritionLabelLarge}>Calories</ThemedText>
          <ThemedText style={styles.nutritionValueLarge}>{recipe.nutrition.calories}</ThemedText>
        </View>
        <View style={styles.nutritionItemLarge}>
          <ThemedText style={styles.nutritionLabelLarge}>Protein</ThemedText>
          <ThemedText style={styles.nutritionValueLarge}>{recipe.nutrition.protein}g</ThemedText>
        </View>
        <View style={styles.nutritionItemLarge}>
          <ThemedText style={styles.nutritionLabelLarge}>Carbs</ThemedText>
          <ThemedText style={styles.nutritionValueLarge}>{recipe.nutrition.carbs}g</ThemedText>
        </View>
        <View style={styles.nutritionItemLarge}>
          <ThemedText style={styles.nutritionLabelLarge}>Fat</ThemedText>
          <ThemedText style={styles.nutritionValueLarge}>{recipe.nutrition.fat}g</ThemedText>
        </View>
      </ThemedView>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [
            styles.detailButton,
            { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0' },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => setSelectedRecipe(recipe)}>
          <ThemedText style={styles.detailButtonText}>View Details</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
          onPress={() => recipe.id && handleDeleteAIRecipe(recipe.id)}>
          <IconSymbol name="trash" size={16} color="#fff" style={styles.buttonIcon} />
          <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );

  const renderMealDBRecipeCard = (recipe: any) => (
    <ThemedView key={recipe.id} style={[
      styles.recipeCard,
      { 
        backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#fff',
        borderColor: colorScheme === 'dark' ? '#2C2C2E' : 'rgba(128, 128, 128, 0.2)'
      }
    ]}>
      <View style={styles.recipeHeader}>
        {recipe.mealThumb && (
          <Image source={{ uri: recipe.mealThumb }} style={styles.recipeImage} />
        )}
        <View style={styles.recipeHeaderLeft}>
          <ThemedText style={styles.recipeName}>
            {recipe.mealName}
          </ThemedText>
          <View style={styles.mealDBInfo}>
            {recipe.category && (
              <View style={[styles.infoPill, { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0' }]}>
                <ThemedText style={styles.infoPillText}>{recipe.category}</ThemedText>
              </View>
            )}
            {recipe.area && (
              <View style={[styles.infoPill, { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0' }]}>
                <ThemedText style={styles.infoPillText}>{recipe.area}</ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [
            styles.detailButton,
            { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0' },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push(`/meal-detail?id=${recipe.mealId}`)}>
          <ThemedText style={styles.detailButtonText}>View Details</ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
          onPress={() => handleDeleteMealDBRecipe(recipe.id)}>
          <IconSymbol name="trash" size={16} color="#fff" style={styles.buttonIcon} />
          <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
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
            <IconSymbol 
              name="sparkles" 
              size={14} 
              color={sourceFilter === 'ai' ? '#fff' : '#666'} 
              style={styles.filterIcon} 
            />
            <ThemedText
              style={[
                styles.filterButtonText,
                sourceFilter === 'ai' && styles.filterButtonTextActive,
              ]}>
              AI Recipes
            </ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.filterButton,
              sourceFilter === 'mealdb' && styles.filterButtonActive,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setSourceFilter('mealdb')}>
            <IconSymbol 
              name="book.fill" 
              size={14} 
              color={sourceFilter === 'mealdb' ? '#fff' : '#666'} 
              style={styles.filterIcon} 
            />
            <ThemedText
              style={[
                styles.filterButtonText,
                sourceFilter === 'mealdb' && styles.filterButtonTextActive,
              ]}>
              MealDB Recipes
            </ThemedText>
          </Pressable>
        </ScrollView>
      </View>

      <ThemedView style={styles.searchSection}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(120, 120, 128, 0.12)',
              color: colorScheme === 'dark' ? '#fff' : '#000',
            },
          ]}
          placeholder="Search recipes..."
          placeholderTextColor={colorScheme === 'dark' ? '#666' : '#999'}
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
              <IconSymbol name="book.fill" size={64} color="#999" />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
  filterButtonTextActive: {
    color: '#fff',
    opacity: 1,
  },
  filterIcon: {
    marginRight: 4,
  },
  searchSection: {
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  searchInput: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    fontSize: 16,
    borderRadius: 12,
    borderWidth: 0,
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  recipeHeader: {
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
    marginBottom: 8,
  },
  recipeName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 15,
    opacity: 0.75,
    marginBottom: 16,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mealInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    padding: 12,
    borderRadius: 12,
    opacity: 0.9,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoIcon: {
    marginRight: 2,
  },
  infoLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    opacity: 0.95,
  },
  nutritionItemLarge: {
    alignItems: 'center',
  },
  nutritionLabelLarge: {
    fontSize: 11,
    opacity: 0.6,
    marginBottom: 2,
  },
  nutritionValueLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  mealDBInfo: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  infoPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  infoPillText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  detailButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 6,
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
