import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export interface Meal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string | null;
  ingredients: {
    ingredient: string;
    measure: string;
  }[];
}

interface MealsState {
  meals: Meal[];
  loading: boolean;
  error: string | null;
}

const initialState: MealsState = {
  meals: [],
  loading: false,
  error: null,
};

// Fetch meals by ingredient from TheMealDB API
export const searchMealsByIngredients = createAsyncThunk(
  'meals/searchByIngredients',
  async (ingredients: string[]) => {
    if (ingredients.length === 0) {
      return [];
    }

    // Search for meals using the first ingredient (MealDB API limitation)
    // Then filter results to include only meals that have at least one of the selected ingredients
    const mainIngredient = ingredients[0];
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(mainIngredient)}`
    );
    const data = await response.json();

    if (!data.meals) {
      return [];
    }

    // Fetch full details for each meal to get ingredient lists
    const mealsWithDetails = await Promise.all(
      data.meals.slice(0, 20).map(async (meal: { idMeal: string }) => {
        const detailResponse = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
        );
        const detailData = await detailResponse.json();
        
        if (!detailData.meals || !detailData.meals[0]) {
          return null;
        }

        const mealDetail = detailData.meals[0];
        
        // Extract ingredients and measures from the meal object
        const mealIngredients: { ingredient: string; measure: string }[] = [];
        for (let i = 1; i <= 20; i++) {
          const ingredient = mealDetail[`strIngredient${i}`];
          const measure = mealDetail[`strMeasure${i}`];
          if (ingredient && ingredient.trim()) {
            mealIngredients.push({
              ingredient: ingredient.trim(),
              measure: measure?.trim() || '',
            });
          }
        }

        return {
          idMeal: mealDetail.idMeal,
          strMeal: mealDetail.strMeal,
          strCategory: mealDetail.strCategory,
          strArea: mealDetail.strArea,
          strInstructions: mealDetail.strInstructions,
          strMealThumb: mealDetail.strMealThumb,
          strTags: mealDetail.strTags,
          strYoutube: mealDetail.strYoutube,
          ingredients: mealIngredients,
        };
      })
    );

    // Filter out null values and return
    return mealsWithDetails.filter((meal): meal is Meal => meal !== null);
  }
);

const mealsSlice = createSlice({
  name: 'meals',
  initialState,
  reducers: {
    clearMeals: (state) => {
      state.meals = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchMealsByIngredients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchMealsByIngredients.fulfilled, (state, action) => {
        state.loading = false;
        state.meals = action.payload;
      })
      .addCase(searchMealsByIngredients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch meals';
      });
  },
});

export const { clearMeals } = mealsSlice.actions;
export default mealsSlice.reducer;
