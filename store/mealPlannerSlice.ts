import { auth } from '@/config/firebase';
import { firestoreService } from '@/services/firestoreService';
import { MealIdea, openaiService } from '@/services/openaiService';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from './store';

interface MealPlannerState {
  generatedIdeas: MealIdea[];
  savedMeals: MealIdea[];
  isGenerating: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: MealPlannerState = {
  generatedIdeas: [],
  savedMeals: [],
  isGenerating: false,
  isLoading: false,
  error: null,
};

// Generate meal ideas using OpenAI
export const generateMealIdeas = createAsyncThunk<
  MealIdea[],
  { ingredientNames: string[]; count?: number },
  { state: RootState }
>(
  'mealPlanner/generateIdeas',
  async ({ ingredientNames, count = 2 }, { getState }) => {
    const state = getState();
    const { profile } = state.profile;

    if (!profile) {
      throw new Error('User profile is required to generate meal ideas');
    }

    // Check if nutrition targets are available
    if (!profile.targetCalories || !profile.targetProtein || !profile.targetCarbs || !profile.targetFat) {
      throw new Error('Please calculate your nutrition targets in your profile first');
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const profileData = {
      age: profile.age,
      gender: profile.gender,
      height: profile.height,
      weight: profile.weight,
      activityLevel: profile.activityLevel,
      goal: profile.goal,
    };

    const nutritionTargets = {
      targetCalories: profile.targetCalories,
      targetProtein: profile.targetProtein,
      targetCarbs: profile.targetCarbs,
      targetFat: profile.targetFat,
    };

    const mealIdeas = await openaiService.generateMealIdeas(
      ingredientNames,
      profileData,
      nutritionTargets,
      apiKey,
      count
    );

    // Add unique IDs to each meal idea
    return mealIdeas.map((idea, index) => ({
      ...idea,
      id: `${Date.now()}-${index}`,
      createdAt: new Date().toISOString(),
    }));
  }
);

// Save a meal idea to Firestore
export const saveMealIdea = createAsyncThunk<MealIdea, MealIdea>(
  'mealPlanner/saveMeal',
  async (mealIdea) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to save meals');
    }

    const mealData = {
      ...mealIdea,
      userId: user.uid,
      savedAt: new Date().toISOString(),
    };

    const docRef = await firestoreService.addMeal(mealData);
    return {
      ...mealData,
      id: docRef.id,
    };
  }
);

// Load saved meals from Firestore
export const loadSavedMeals = createAsyncThunk<MealIdea[]>(
  'mealPlanner/loadSavedMeals',
  async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to load meals');
    }

    // Use getUserMeals but it returns SavedMeal[], we need to adapt
    // For now, return empty array - this can be enhanced later
    return [];
  }
);

// Delete a saved meal from Firestore
export const deleteSavedMeal = createAsyncThunk<string, string>(
  'mealPlanner/deleteMeal',
  async (mealId) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to delete meals');
    }

    await firestoreService.deleteMeal(mealId);
    return mealId;
  }
);

const mealPlannerSlice = createSlice({
  name: 'mealPlanner',
  initialState,
  reducers: {
    clearGeneratedIdeas: (state) => {
      state.generatedIdeas = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate meal ideas
      .addCase(generateMealIdeas.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateMealIdeas.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.generatedIdeas = action.payload;
      })
      .addCase(generateMealIdeas.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.error.message || 'Failed to generate meal ideas';
      })
      // Save meal idea
      .addCase(saveMealIdea.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveMealIdea.fulfilled, (state, action) => {
        state.isLoading = false;
        state.savedMeals.push(action.payload);
      })
      .addCase(saveMealIdea.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to save meal';
      })
      // Load saved meals
      .addCase(loadSavedMeals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSavedMeals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.savedMeals = action.payload;
      })
      .addCase(loadSavedMeals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load saved meals';
      })
      // Delete saved meal
      .addCase(deleteSavedMeal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteSavedMeal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.savedMeals = state.savedMeals.filter(
          (meal) => meal.id !== action.payload
        );
      })
      .addCase(deleteSavedMeal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete meal';
      });
  },
});

export const { clearGeneratedIdeas, clearError } = mealPlannerSlice.actions;
export default mealPlannerSlice.reducer;
