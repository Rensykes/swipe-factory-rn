import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MealIdea } from '@/services/openaiService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    clearError,
    clearGeneratedIdeas,
    deleteSavedMeal,
    generateMealIdeas,
    loadSavedMeals,
    saveMealIdea,
} from '@/store/mealPlannerSlice';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MealPlannerScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { selectedIngredients, ingredients } = useAppSelector((state) => state.ingredients);
  const { profile } = useAppSelector((state) => state.profile);
  const { generatedIdeas, savedMeals, isGenerating, isLoading, error } = useAppSelector(
    (state) => state.mealPlanner
  );

  const [selectedMealDetail, setSelectedMealDetail] = useState<MealIdea | null>(null);
  const [showSavedMeals, setShowSavedMeals] = useState(false);

  useEffect(() => {
    dispatch(loadSavedMeals());
  }, [dispatch]);

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

  const renderMealCard = (meal: MealIdea, isSaved: boolean = false) => (
    <ThemedView key={meal.id || meal.name} style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <ThemedText type="subtitle" style={styles.mealName}>
          {meal.name}
        </ThemedText>
        {meal.tags && meal.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {meal.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <ThemedText style={styles.tagText}>{tag}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>

      <ThemedText style={styles.mealDescription}>{meal.description}</ThemedText>

      <ThemedView style={styles.mealInfo}>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>⏱️ Prep:</ThemedText>
          <ThemedText style={styles.infoValue}>{meal.prepTime} min</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>🍳 Cook:</ThemedText>
          <ThemedText style={styles.infoValue}>{meal.cookTime} min</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>🍽️ Servings:</ThemedText>
          <ThemedText style={styles.infoValue}>{meal.servings}</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.nutritionGrid}>
        <View style={styles.nutritionItem}>
          <ThemedText style={styles.nutritionLabel}>Calories</ThemedText>
          <ThemedText style={styles.nutritionValue}>{meal.nutrition.calories}</ThemedText>
        </View>
        <View style={styles.nutritionItem}>
          <ThemedText style={styles.nutritionLabel}>Protein</ThemedText>
          <ThemedText style={styles.nutritionValue}>{meal.nutrition.protein}g</ThemedText>
        </View>
        <View style={styles.nutritionItem}>
          <ThemedText style={styles.nutritionLabel}>Carbs</ThemedText>
          <ThemedText style={styles.nutritionValue}>{meal.nutrition.carbs}g</ThemedText>
        </View>
        <View style={styles.nutritionItem}>
          <ThemedText style={styles.nutritionLabel}>Fat</ThemedText>
          <ThemedText style={styles.nutritionValue}>{meal.nutrition.fat}g</ThemedText>
        </View>
      </ThemedView>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [styles.detailButton, pressed && styles.buttonPressed]}
          onPress={() => showMealDetail(meal)}>
          <ThemedText style={styles.detailButtonText}>View Details</ThemedText>
        </Pressable>
        {!isSaved ? (
          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed]}
            onPress={() => handleSaveMeal(meal)}>
            <ThemedText style={styles.saveButtonText}>💾 Save</ThemedText>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
            onPress={() => meal.id && handleDeleteMeal(meal.id)}>
            <ThemedText style={styles.deleteButtonText}>🗑️ Delete</ThemedText>
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
          AI-powered meal ideas based on your ingredients and goals
        </ThemedText>
      </ThemedView>

      <View style={styles.topButtons}>
        <Pressable
          style={({ pressed }) => [
            styles.generateButton,
            pressed && styles.buttonPressed,
            isGenerating && styles.disabledButton,
          ]}
          onPress={handleGenerateMeals}
          disabled={isGenerating}>
          {isGenerating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.generateButtonText}>
              ✨ Generate Meal Ideas ({selectedIngredients.length} ingredients)
            </ThemedText>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.toggleButton,
            pressed && styles.buttonPressed,
            showSavedMeals && styles.activeToggleButton,
          ]}
          onPress={() => setShowSavedMeals(!showSavedMeals)}>
          <ThemedText
            style={[
              styles.toggleButtonText,
              showSavedMeals && styles.activeToggleButtonText,
            ]}>
            {showSavedMeals ? '📋 View Generated' : '💾 View Saved'}
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {!showSavedMeals ? (
          <>
            {generatedIdeas.length === 0 && !isGenerating && (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyIcon}>🍽️</ThemedText>
                <ThemedText style={styles.emptyTitle}>No Meal Ideas Yet</ThemedText>
                <ThemedText style={styles.emptyText}>
                  Select ingredients and tap &quot;Generate Meal Ideas&quot; to get personalized meal
                  suggestions based on your profile and available ingredients.
                </ThemedText>
              </View>
            )}

            {generatedIdeas.map((meal) => renderMealCard(meal, false))}

            {generatedIdeas.length > 0 && (
              <Pressable
                style={({ pressed }) => [
                  styles.clearButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => dispatch(clearGeneratedIdeas())}>
                <ThemedText style={styles.clearButtonText}>Clear Ideas</ThemedText>
              </Pressable>
            )}
          </>
        ) : (
          <>
            {savedMeals.length === 0 && !isLoading && (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyIcon}>💾</ThemedText>
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
          </>
        )}
      </ScrollView>

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
                      <View style={styles.nutritionItem}>
                        <ThemedText style={styles.nutritionLabel}>Calories</ThemedText>
                        <ThemedText style={styles.nutritionValue}>
                          {selectedMealDetail.nutrition.calories}
                        </ThemedText>
                      </View>
                      <View style={styles.nutritionItem}>
                        <ThemedText style={styles.nutritionLabel}>Protein</ThemedText>
                        <ThemedText style={styles.nutritionValue}>
                          {selectedMealDetail.nutrition.protein}g
                        </ThemedText>
                      </View>
                      <View style={styles.nutritionItem}>
                        <ThemedText style={styles.nutritionLabel}>Carbs</ThemedText>
                        <ThemedText style={styles.nutritionValue}>
                          {selectedMealDetail.nutrition.carbs}g
                        </ThemedText>
                      </View>
                      <View style={styles.nutritionItem}>
                        <ThemedText style={styles.nutritionLabel}>Fat</ThemedText>
                        <ThemedText style={styles.nutritionValue}>
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
  topButtons: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  generateButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 140,
  },
  activeToggleButton: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  activeToggleButtonText: {
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
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
    backgroundColor: '#e8f4ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#007AFF',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  detailButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
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
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
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
    backgroundColor: '#f0f0f0',
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
});
