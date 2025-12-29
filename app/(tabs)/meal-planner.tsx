import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MealIdea } from '@/services/openaiService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { IngredientWithNutrition } from '@/store/ingredientsSlice';
import {
    clearSelection,
    fetchIngredients,
    removeIngredient,
    setSearchQuery,
    toggleIngredient,
} from '@/store/ingredientsSlice';
import {
    clearError,
    clearGeneratedIdeas,
    deleteSavedMeal,
    generateMealIdeas,
    loadSavedMeals,
    saveMealIdea,
} from '@/store/mealPlannerSlice';
import { searchMealsByIngredients } from '@/store/mealsSlice';
import { useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Memoized ingredient card component for performance
const IngredientCard = memo(({ 
  ingredient, 
  isSelected, 
  onToggle,
  onShowDetail,
  colorScheme,
}: { 
  ingredient: IngredientWithNutrition; 
  isSelected: boolean; 
  onToggle: (name: string) => void;
  onShowDetail: (ingredient: IngredientWithNutrition) => void;
  colorScheme: 'light' | 'dark' | null | undefined;
}) => (
  <Pressable
    style={({ pressed }) => [
      {
        padding: 16,
        borderRadius: 12,
        backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#f8f8f8',
        borderWidth: isSelected ? 2 : 1.5,
        borderColor: isSelected ? '#007AFF' : (colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
      },
      pressed && { opacity: 0.8 },
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
        <IconSymbol name="info.circle" size={20} color="#007AFF" />
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
));

IngredientCard.displayName = 'IngredientCard';

type TabType = 'ingredients' | 'ai' | 'saved';

export default function MealPlannerScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { selectedIngredients, filteredIngredients, searchQuery, ingredients, loading: ingredientsLoading, error: ingredientsError } = useAppSelector((state) => state.ingredients);
  const { profile } = useAppSelector((state) => state.profile);
  const { generatedIdeas, savedMeals, isGenerating, isLoading, error } = useAppSelector(
    (state) => state.mealPlanner
  );

  const [activeTab, setActiveTab] = useState<TabType>('ingredients');
  const [selectedMealDetail, setSelectedMealDetail] = useState<MealIdea | null>(null);
  const [selectedIngredientDetail, setSelectedIngredientDetail] = useState<IngredientWithNutrition | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    dispatch(fetchIngredients());
    dispatch(loadSavedMeals());
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

  const handleSearchMealDBRecipes = useCallback(() => {
    if (selectedIngredients.length === 0) {
      Alert.alert('No Ingredients', 'Please select at least one ingredient first.');
      return;
    }
    dispatch(searchMealsByIngredients(selectedIngredients));
    router.push('/meals');
  }, [dispatch, router, selectedIngredients]);

  const handleGenerateMeals = async () => {
    if (selectedIngredients.length === 0) {
      Alert.alert('No Ingredients', 'Please select at least one ingredient first.');
      return;
    }

    if (!profile) {
      Alert.alert('Profile Required', 'Please set up your profile first.');
      return;
    }

    if (!profile.targetCalories) {
      Alert.alert(
        'Nutrition Targets Required',
        'Please calculate your nutrition targets in your profile first.'
      );
      return;
    }

    // Get ingredient names from selected IDs
    const selectedIngredientNames = ingredients
      .filter((ing) => selectedIngredients.includes(ing.strIngredient))
      .map((ing) => ing.strIngredient);

    try {
      await dispatch(
        generateMealIdeas({
          ingredientNames: selectedIngredientNames,
          count: 3, // Generate 3 meal ideas
        })
      ).unwrap();
      setActiveTab('ai'); // Switch to AI tab after generation
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to generate meal ideas');
    }
  };

  const handleSaveMeal = async (mealIdea: MealIdea) => {
    try {
      await dispatch(saveMealIdea(mealIdea)).unwrap();
      Alert.alert('Success', 'Meal saved successfully!');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save meal');
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    Alert.alert('Delete Meal', 'Are you sure you want to delete this meal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(deleteSavedMeal(mealId)).unwrap();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete meal');
          }
        },
      },
    ]);
  };

  const showMealDetail = (meal: MealIdea) => {
    setSelectedMealDetail(meal);
  };

  const closeMealDetail = () => {
    setSelectedMealDetail(null);
  };

  const showIngredientDetail = useCallback((ingredient: IngredientWithNutrition) => {
    setSelectedIngredientDetail(ingredient);
  }, []);

  const closeIngredientDetail = useCallback(() => {
    setSelectedIngredientDetail(null);
  }, []);

  const selectedSet = useMemo(() => new Set(selectedIngredients), [selectedIngredients]);

  const retryFetch = useCallback(() => {
    dispatch(fetchIngredients());
  }, [dispatch]);

  const renderMealCard = (meal: MealIdea, isSaved: boolean = false) => (
    <ThemedView key={meal.id || meal.name} style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <ThemedText type="subtitle" style={styles.mealName}>
          {meal.name}
        </ThemedText>
        {meal.tags && meal.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {meal.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colorScheme === 'dark' ? '#1C3A57' : '#e8f4ff' }]}>
                <ThemedText style={[styles.tagText, { color: '#007AFF' }]}>{tag}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>

      <ThemedText style={styles.mealDescription}>{meal.description}</ThemedText>

      <ThemedView style={styles.mealInfo}>
        <View style={styles.infoRow}>
          <IconSymbol name="clock" size={16} color="#999" style={styles.infoIcon} />
          <ThemedText style={styles.infoLabel}>Prep:</ThemedText>
          <ThemedText style={styles.infoValue}>{meal.prepTime} min</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <IconSymbol name="flame" size={16} color="#999" style={styles.infoIcon} />
          <ThemedText style={styles.infoLabel}>Cook:</ThemedText>
          <ThemedText style={styles.infoValue}>{meal.cookTime} min</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <IconSymbol name="fork.knife" size={16} color="#999" style={styles.infoIcon} />
          <ThemedText style={styles.infoLabel}>Servings:</ThemedText>
          <ThemedText style={styles.infoValue}>{meal.servings}</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.nutritionGrid}>
        <View style={styles.nutritionItemLarge}>
          <ThemedText style={styles.nutritionLabelLarge}>Calories</ThemedText>
          <ThemedText style={styles.nutritionValueLarge}>{meal.nutrition.calories}</ThemedText>
        </View>
        <View style={styles.nutritionItemLarge}>
          <ThemedText style={styles.nutritionLabelLarge}>Protein</ThemedText>
          <ThemedText style={styles.nutritionValueLarge}>{meal.nutrition.protein}g</ThemedText>
        </View>
        <View style={styles.nutritionItemLarge}>
          <ThemedText style={styles.nutritionLabelLarge}>Carbs</ThemedText>
          <ThemedText style={styles.nutritionValueLarge}>{meal.nutrition.carbs}g</ThemedText>
        </View>
        <View style={styles.nutritionItemLarge}>
          <ThemedText style={styles.nutritionLabelLarge}>Fat</ThemedText>
          <ThemedText style={styles.nutritionValueLarge}>{meal.nutrition.fat}g</ThemedText>
        </View>
      </ThemedView>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [
            styles.detailButton,
            { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0' },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => showMealDetail(meal)}>
          <ThemedText style={styles.detailButtonText}>View Details</ThemedText>
        </Pressable>
        {!isSaved ? (
          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed]}
            onPress={() => handleSaveMeal(meal)}>
            <IconSymbol name="bookmark" size={16} color="#fff" style={styles.buttonIcon} />
            <ThemedText style={styles.saveButtonText}>Save</ThemedText>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
            onPress={() => meal.id && handleDeleteMeal(meal.id)}>
            <IconSymbol name="trash" size={16} color="#fff" style={styles.buttonIcon} />
            <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Meal Planner</ThemedText>
        <ThemedText style={styles.subtitle}>
          Select ingredients and find or generate recipes
        </ThemedText>
      </ThemedView>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.tab,
            { backgroundColor: activeTab === 'ingredients' ? '#007AFF' : (colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0') },
            pressed && styles.tabPressed,
          ]}
          onPress={() => setActiveTab('ingredients')}>
          <IconSymbol name="carrot.fill" size={20} color={activeTab === 'ingredients' ? '#fff' : (colorScheme === 'dark' ? '#999' : '#666')} />
          <ThemedText style={[
            styles.tabText,
            { color: activeTab === 'ingredients' ? '#fff' : (colorScheme === 'dark' ? '#999' : '#666') },
          ]}>
            Ingredients
          </ThemedText>
          {selectedIngredients.length > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{selectedIngredients.length}</ThemedText>
            </View>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.tab,
            { backgroundColor: activeTab === 'ai' ? '#007AFF' : (colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0') },
            pressed && styles.tabPressed,
          ]}
          onPress={() => setActiveTab('ai')}>
          <IconSymbol name="sparkles" size={20} color={activeTab === 'ai' ? '#fff' : (colorScheme === 'dark' ? '#999' : '#666')} />
          <ThemedText style={[
            styles.tabText,
            { color: activeTab === 'ai' ? '#fff' : (colorScheme === 'dark' ? '#999' : '#666') },
          ]}>
            AI Recipes
          </ThemedText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.tab,
            { backgroundColor: activeTab === 'saved' ? '#007AFF' : (colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0') },
            pressed && styles.tabPressed,
          ]}
          onPress={() => setActiveTab('saved')}>
          <IconSymbol name="bookmark.fill" size={20} color={activeTab === 'saved' ? '#fff' : (colorScheme === 'dark' ? '#999' : '#666')} />
          <ThemedText style={[
            styles.tabText,
            { color: activeTab === 'saved' ? '#fff' : (colorScheme === 'dark' ? '#999' : '#666') },
          ]}>
            Saved
          </ThemedText>
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable
            style={({ pressed }) => [styles.closeErrorButton, pressed && styles.buttonPressed]}
            onPress={() => dispatch(clearError())}>
            <ThemedText style={styles.closeErrorText}>✕</ThemedText>
          </Pressable>
        </View>
      )}

      {/* Ingredients Tab Content */}
      {activeTab === 'ingredients' && (
        <ThemedView style={styles.tabContent}>
          {selectedIngredients.length > 0 && (
            <View style={styles.selectedSection}>
              <View style={styles.selectedHeader}>
                <ThemedText style={styles.selectedTitle}>Selected ({selectedIngredients.length})</ThemedText>
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
              />
              <View style={styles.actionButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.searchButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleSearchMealDBRecipes}>
                  <IconSymbol name="magnifyingglass" size={20} color="#fff" style={styles.buttonIcon} />
                  <ThemedText style={styles.actionButtonText}>Search Recipes</ThemedText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.generateButton,
                    pressed && styles.buttonPressed,
                    isGenerating && styles.disabledButton,
                  ]}
                  onPress={handleGenerateMeals}
                  disabled={isGenerating}>
                  {isGenerating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <IconSymbol name="sparkles" size={20} color="#fff" style={styles.buttonIcon} />
                      <ThemedText style={styles.actionButtonText}>Generate with AI</ThemedText>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(120, 120, 128, 0.12)',
                color: colorScheme === 'dark' ? '#fff' : '#000',
              },
            ]}
            placeholder="Search ingredients..."
            placeholderTextColor={colorScheme === 'dark' ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {ingredientsLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <ThemedText style={styles.loadingText}>Loading ingredients...</ThemedText>
            </View>
          )}

          {ingredientsError && (
            <ThemedView style={styles.errorState}>
              <ThemedText style={styles.errorStateText}>{ingredientsError}</ThemedText>
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

          {!ingredientsLoading && !ingredientsError && (
            <FlatList<IngredientWithNutrition>
              data={filteredIngredients}
              keyExtractor={(item: IngredientWithNutrition) => item.idIngredient}
              renderItem={({ item }: { item: IngredientWithNutrition }) => (
                <IngredientCard
                  ingredient={item}
                  isSelected={selectedSet.has(item.strIngredient)}
                  onToggle={handleToggleIngredient}
                  onShowDetail={showIngredientDetail}
                  colorScheme={colorScheme}
                />
              )}
              contentContainerStyle={styles.ingredientList}
              ListEmptyComponent={
                <ThemedView style={styles.emptyState}>
                  <IconSymbol name="magnifyingglass" size={64} color="#999" />
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
        </ThemedView>
      )}

      {/* AI Recipes Tab Content */}
      {activeTab === 'ai' && (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
          {generatedIdeas.length === 0 && !isGenerating && (
            <View style={styles.emptyState}>
              <IconSymbol name="sparkles" size={64} color="#999" />
              <ThemedText style={styles.emptyTitle}>No AI Recipes Yet</ThemedText>
              <ThemedText style={styles.emptyText}>
                Select ingredients and tap &quot;Generate with AI&quot; to get personalized meal
                suggestions based on your profile and available ingredients.
              </ThemedText>
            </View>
          )}

          {generatedIdeas.map((meal) => renderMealCard(meal, false))}

          {generatedIdeas.length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.clearButton,
                { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0' },
                pressed && styles.buttonPressed,
              ]}
              onPress={() => dispatch(clearGeneratedIdeas())}>
              <ThemedText style={styles.clearButtonText}>Clear Ideas</ThemedText>
            </Pressable>
          )}
        </ScrollView>
      )}

      {/* Saved Meals Tab Content */}
      {activeTab === 'saved' && (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollContent}>
          {savedMeals.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <IconSymbol name="bookmark" size={64} color="#999" />
              <ThemedText style={styles.emptyTitle}>No Saved Meals</ThemedText>
              <ThemedText style={styles.emptyText}>
                Save your favorite meal ideas to access them later.
              </ThemedText>
            </View>
          )}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}

          {savedMeals.map((meal) => renderMealCard(meal, true))}
        </ScrollView>
      )}

      {/* Meal Detail Modal */}
      <Modal
        visible={selectedMealDetail !== null}
        transparent
        animationType="slide"
        onRequestClose={closeMealDetail}>
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalCard}>
            {selectedMealDetail && (
              <>
                <View style={styles.modalHeader}>
                  <ThemedText type="title" style={styles.modalTitle}>
                    {selectedMealDetail.name}
                  </ThemedText>
                  <Pressable
                    style={({ pressed }) => [
                      styles.closeButton,
                      { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0' },
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={closeMealDetail}>
                    <ThemedText style={styles.closeButtonText}>×</ThemedText>
                  </Pressable>
                </View>

                <ScrollView style={styles.modalScroll}>
                  <ThemedText style={styles.modalDescription}>
                    {selectedMealDetail.description}
                  </ThemedText>

                  <View style={styles.modalSection}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                      Ingredients
                    </ThemedText>
                    {selectedMealDetail.ingredients.map((ing, index) => (
                      <View key={index} style={styles.ingredientRow}>
                        <ThemedText style={styles.ingredientBullet}>•</ThemedText>
                        <ThemedText style={styles.ingredientText}>
                          {ing.amount} {ing.name}
                        </ThemedText>
                      </View>
                    ))}
                  </View>

                  <View style={styles.modalSection}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                      Instructions
                    </ThemedText>
                    <ThemedText style={styles.instructionsText}>
                      {selectedMealDetail.instructions}
                    </ThemedText>
                  </View>

                  <View style={styles.modalSection}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                      Nutrition (per serving)
                    </ThemedText>
                    <View style={styles.nutritionGrid}>
                      <View style={styles.nutritionItemLarge}>
                        <ThemedText style={styles.nutritionLabelLarge}>Calories</ThemedText>
                        <ThemedText style={styles.nutritionValueLarge}>
                          {selectedMealDetail.nutrition.calories}
                        </ThemedText>
                      </View>
                      <View style={styles.nutritionItemLarge}>
                        <ThemedText style={styles.nutritionLabelLarge}>Protein</ThemedText>
                        <ThemedText style={styles.nutritionValueLarge}>
                          {selectedMealDetail.nutrition.protein}g
                        </ThemedText>
                      </View>
                      <View style={styles.nutritionItemLarge}>
                        <ThemedText style={styles.nutritionLabelLarge}>Carbs</ThemedText>
                        <ThemedText style={styles.nutritionValueLarge}>
                          {selectedMealDetail.nutrition.carbs}g
                        </ThemedText>
                      </View>
                      <View style={styles.nutritionItemLarge}>
                        <ThemedText style={styles.nutritionLabelLarge}>Fat</ThemedText>
                        <ThemedText style={styles.nutritionValueLarge}>
                          {selectedMealDetail.nutrition.fat}g
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

      {/* Ingredient Detail Modal */}
      <Modal
        visible={selectedIngredientDetail !== null}
        transparent
        animationType="fade"
        onRequestClose={closeIngredientDetail}>
        <View style={styles.ingredientModalOverlay}>
          <Pressable 
            style={StyleSheet.absoluteFill}
            onPress={closeIngredientDetail}
          />
          <View 
            style={[
              styles.ingredientModalCard,
              { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#fff' }
            ]}>
            {selectedIngredientDetail && (
              <>
                <View style={styles.modalHeader}>
                  <ThemedText type="title" style={styles.modalTitle}>
                    {selectedIngredientDetail.strIngredient}
                  </ThemedText>
                  <Pressable
                    style={({ pressed }) => [
                      styles.closeButton,
                      { backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0' },
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={closeIngredientDetail}>
                    <ThemedText style={styles.closeButtonText}>×</ThemedText>
                  </Pressable>
                </View>

                <ScrollView 
                  style={styles.modalScroll}
                  showsVerticalScrollIndicator={true}
                  bounces={true}>
                  {selectedIngredientDetail.strDescription && (
                    <View style={styles.modalSection}>
                      <Pressable 
                        onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        style={styles.collapsibleHeader}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                          Description
                        </ThemedText>
                        <ThemedText style={styles.chevron}>
                          {isDescriptionExpanded ? '▼' : '▶'}
                        </ThemedText>
                      </Pressable>
                      {isDescriptionExpanded && (
                        <ThemedText style={styles.modalDescription}>
                          {selectedIngredientDetail.strDescription}
                        </ThemedText>
                      )}
                    </View>
                  )}

                  {/* Macro Distribution Chart */}
                  {selectedIngredientDetail.nutrition && (
                    <View style={styles.modalSection}>
                      <ThemedText type="subtitle" style={styles.sectionTitle}>
                        Macro Distribution
                      </ThemedText>
                      <View style={styles.macroChartContainer}>
                        {(() => {
                          const protein = parseFloat(selectedIngredientDetail.nutrition?.protein?.replace('g', '') || '0');
                          const carbs = parseFloat(selectedIngredientDetail.nutrition?.carbs?.replace('g', '') || '0');
                          const fat = parseFloat(selectedIngredientDetail.nutrition?.fat?.replace('g', '') || '0');
                          const total = protein + carbs + fat;
                          
                          if (total === 0) return (
                            <ThemedText style={styles.noDataText}>No macro data available</ThemedText>
                          );
                          
                          const proteinPercent = (protein / total) * 100;
                          const carbsPercent = (carbs / total) * 100;
                          const fatPercent = (fat / total) * 100;
                          
                          return (
                            <>
                              <View style={styles.macroBar}>
                                {proteinPercent > 0 && (
                                  <View 
                                    style={[
                                      styles.macroBarSegment,
                                      styles.proteinSegment,
                                      { width: `${proteinPercent}%` }
                                    ]} 
                                  />
                                )}
                                {carbsPercent > 0 && (
                                  <View 
                                    style={[
                                      styles.macroBarSegment,
                                      styles.carbsSegment,
                                      { width: `${carbsPercent}%` }
                                    ]} 
                                  />
                                )}
                                {fatPercent > 0 && (
                                  <View 
                                    style={[
                                      styles.macroBarSegment,
                                      styles.fatSegment,
                                      { width: `${fatPercent}%` }
                                    ]} 
                                  />
                                )}
                              </View>
                              <View style={styles.macroLegend}>
                                <View style={styles.legendItem}>
                                  <View style={[styles.legendColor, styles.proteinSegment]} />
                                  <ThemedText style={styles.legendText}>
                                    Protein {proteinPercent.toFixed(1)}%
                                  </ThemedText>
                                </View>
                                <View style={styles.legendItem}>
                                  <View style={[styles.legendColor, styles.carbsSegment]} />
                                  <ThemedText style={styles.legendText}>
                                    Carbs {carbsPercent.toFixed(1)}%
                                  </ThemedText>
                                </View>
                                <View style={styles.legendItem}>
                                  <View style={[styles.legendColor, styles.fatSegment]} />
                                  <ThemedText style={styles.legendText}>
                                    Fat {fatPercent.toFixed(1)}%
                                  </ThemedText>
                                </View>
                              </View>
                            </>
                          );
                        })()}
                      </View>
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                      Nutritional Information (per 100g)
                    </ThemedText>
                    <View style={styles.ingredientModalNutrition}>
                      <View style={[
                        styles.ingredientModalNutritionItem,
                        { 
                          backgroundColor: colorScheme === 'dark' ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.15)',
                          borderColor: colorScheme === 'dark' ? 'rgba(0, 122, 255, 0.4)' : 'rgba(0, 122, 255, 0.3)',
                        }
                      ]}>
                        <ThemedText style={styles.ingredientModalNutritionLabel}>Calories</ThemedText>
                        <ThemedText style={styles.ingredientModalNutritionValue}>
                          {selectedIngredientDetail.nutrition?.calories || 'N/A'}
                        </ThemedText>
                      </View>
                      <View style={[
                        styles.ingredientModalNutritionItem,
                        { 
                          backgroundColor: colorScheme === 'dark' ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.15)',
                          borderColor: colorScheme === 'dark' ? 'rgba(0, 122, 255, 0.4)' : 'rgba(0, 122, 255, 0.3)',
                        }
                      ]}>
                        <ThemedText style={styles.ingredientModalNutritionLabel}>Protein</ThemedText>
                        <ThemedText style={styles.ingredientModalNutritionValue}>
                          {selectedIngredientDetail.nutrition?.protein || 'N/A'}
                        </ThemedText>
                      </View>
                      <View style={[
                        styles.ingredientModalNutritionItem,
                        { 
                          backgroundColor: colorScheme === 'dark' ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.15)',
                          borderColor: colorScheme === 'dark' ? 'rgba(0, 122, 255, 0.4)' : 'rgba(0, 122, 255, 0.3)',
                        }
                      ]}>
                        <ThemedText style={styles.ingredientModalNutritionLabel}>Carbohydrates</ThemedText>
                        <ThemedText style={styles.ingredientModalNutritionValue}>
                          {selectedIngredientDetail.nutrition?.carbs || 'N/A'}
                        </ThemedText>
                      </View>
                      <View style={[
                        styles.ingredientModalNutritionItem,
                        { 
                          backgroundColor: colorScheme === 'dark' ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 122, 255, 0.15)',
                          borderColor: colorScheme === 'dark' ? 'rgba(0, 122, 255, 0.4)' : 'rgba(0, 122, 255, 0.3)',
                        }
                      ]}>
                        <ThemedText style={styles.ingredientModalNutritionLabel}>Fat</ThemedText>
                        <ThemedText style={styles.ingredientModalNutritionValue}>
                          {selectedIngredientDetail.nutrition?.fat || 'N/A'}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
  },
  tabContent: {
    flex: 1,
  },
  selectedSection: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedTitle: {
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
  },
  clearAllButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pillsContent: {
    gap: 8,
    paddingVertical: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  pillPressed: {
    opacity: 0.6,
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
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  searchButton: {
    backgroundColor: '#34C759',
  },
  generateButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchInput: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    fontSize: 16,
    borderRadius: 12,
    borderWidth: 0,
  },
  ingredientList: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  ingredientContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  ingredientNameSelected: {
    color: '#007AFF',
  },
  checkmark: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  nutritionContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  nutritionLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  nutritionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
  },
  scrollContent: {
    padding: 20,
  },
  mealCard: {
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
  mealHeader: {
    marginBottom: 12,
  },
  mealName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
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
  mealDescription: {
    fontSize: 15,
    opacity: 0.75,
    marginBottom: 16,
    lineHeight: 22,
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
  saveButton: {
    flex: 1,
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
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
  disabledButton: {
    opacity: 0.5,
  },
  clearButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  errorContainer: {
    backgroundColor: '#FF3B30',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  closeErrorButton: {
    padding: 4,
  },
  closeErrorText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorStateText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    borderBottomColor: '#f0f0f0',
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
  },
  closeButtonText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#666',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chevron: {
    fontSize: 14,
    opacity: 0.6,
  },
  macroChartContainer: {
    marginTop: 8,
  },
  macroBar: {
    flexDirection: 'row',
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  macroBarSegment: {
    height: '100%',
  },
  proteinSegment: {
    backgroundColor: '#FF6B6B',
  },
  carbsSegment: {
    backgroundColor: '#4ECDC4',
  },
  fatSegment: {
    backgroundColor: '#FFE66D',
  },
  macroLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
  },
  noDataText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 12,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  infoButtonPressed: {
    opacity: 0.5,
    transform: [{ scale: 0.9 }],
  },
  ingredientModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  ingredientModalCard: {
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    height: '90%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  ingredientModalNutrition: {
    gap: 12,
  },
  ingredientModalNutritionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  ingredientModalNutritionLabel: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.8,
  },
  ingredientModalNutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
});
