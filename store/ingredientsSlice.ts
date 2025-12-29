import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

// USDA FoodData Central API configuration
const USDA_API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY || 'DEMO_KEY';
const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';

export interface IngredientNutrition {
  calories?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
}

export interface Ingredient {
  idIngredient: string;
  strIngredient: string;
  strDescription: string | null;
  strType: string | null;
}

export interface IngredientWithNutrition extends Ingredient {
  nutrition?: IngredientNutrition;
}

interface IngredientsState {
  ingredients: IngredientWithNutrition[];
  selectedIngredients: string[];
  filteredIngredients: IngredientWithNutrition[];
  searchQuery: string;
  loading: boolean;
  error: string | null;
}

const initialState: IngredientsState = {
  ingredients: [],
  selectedIngredients: [],
  filteredIngredients: [],
  searchQuery: '',
  loading: false,
  error: null,
};

// Fetch nutrition data from USDA FoodData Central API
const fetchUSDANutrition = async (ingredientName: string): Promise<IngredientNutrition> => {
  try {
    // Clean and simplify ingredient name for better matching
    const cleanName = ingredientName
      .toLowerCase()
      .replace(/\(.*?\)/g, '') // Remove parentheses content
      .replace(/\b(fresh|dried|frozen|raw|cooked|unsalted|salted|ground|chopped|sliced|minced|powder|powdered)\b/gi, '') // Remove descriptive words
      .trim();

    // Search for the ingredient in USDA database
    const searchUrl = `${USDA_API_BASE}/foods/search?query=${encodeURIComponent(cleanName)}&dataType=Foundation,SR Legacy&pageSize=5&api_key=${USDA_API_KEY}`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      throw new Error(`USDA API error: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();

    if (!searchData.foods || searchData.foods.length === 0) {
      return generateMockNutrition(ingredientName);
    }

    // Find best match - prefer Foundation or SR Legacy data types
    const food = searchData.foods.find((f: any) => 
      f.dataType === 'Foundation' || f.dataType === 'SR Legacy'
    ) || searchData.foods[0];
    
    const nutrients = food.foodNutrients || [];

    // Extract nutrition values (nutrient IDs from USDA database)
    // 1008: Energy (kcal), 1003: Protein, 1005: Carbs, 1004: Total Fat
    const getNutrient = (nutrientId: number) => {
      const nutrient = nutrients.find((n: any) => n.nutrientId === nutrientId || n.nutrientNumber === nutrientId.toString());
      return nutrient ? Math.round(nutrient.value) : 0;
    };

    const calories = getNutrient(1008);
    const protein = getNutrient(1003);
    const carbs = getNutrient(1005);
    const fat = getNutrient(1004);

    // If all values are 0, use mock data
    if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
      return generateMockNutrition(ingredientName);
    }

    return {
      calories: calories.toString(),
      protein: `${protein}g`,
      carbs: `${carbs}g`,
      fat: `${fat}g`,
    };
  } catch (error) {
    console.error(`Error fetching USDA data for ${ingredientName}:`, error);
    return generateMockNutrition(ingredientName);
  }
};

// Generate realistic mock nutrition data based on ingredient type (fallback)
const generateMockNutrition = (ingredientName: string): IngredientNutrition => {
  const name = ingredientName.toLowerCase();
  
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
      name.includes('turkey') || name.includes('fish') || name.includes('salmon')) {
    return { calories: '165', protein: '31g', carbs: '0g', fat: '3.6g' };
  }
  if (name.includes('cheese') || name.includes('milk') || name.includes('cream')) {
    return { calories: '120', protein: '8g', carbs: '9g', fat: '6g' };
  }
  if (name.includes('lettuce') || name.includes('spinach') || name.includes('cucumber') ||
      name.includes('tomato') || name.includes('pepper') || name.includes('onion')) {
    return { calories: '25', protein: '1.5g', carbs: '5g', fat: '0.2g' };
  }
  if (name.includes('rice') || name.includes('pasta') || name.includes('bread') || 
      name.includes('flour') || name.includes('oat')) {
    return { calories: '130', protein: '3g', carbs: '28g', fat: '0.5g' };
  }
  if (name.includes('apple') || name.includes('banana') || name.includes('orange') ||
      name.includes('berry') || name.includes('lemon')) {
    return { calories: '60', protein: '0.5g', carbs: '15g', fat: '0.2g' };
  }
  if (name.includes('oil') || name.includes('butter')) {
    return { calories: '120', protein: '0g', carbs: '0g', fat: '14g' };
  }
  return { calories: '50', protein: '2g', carbs: '10g', fat: '1g' };
};

// Async thunk for fetching ingredients
export const fetchIngredients = createAsyncThunk(
  'ingredients/fetchIngredients',
  async () => {
    const response = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?i=list');
    const data = await response.json();
    
    if (!data.meals) {
      throw new Error('No ingredients found');
    }
    
    // Use mock nutrition data for all ingredients
    const ingredientsWithNutrition = data.meals.map((ingredient: Ingredient) => ({
      ...ingredient,
      nutrition: generateMockNutrition(ingredient.strIngredient),
    }));
    
    return ingredientsWithNutrition;
  }
);

const ingredientsSlice = createSlice({
  name: 'ingredients',
  initialState,
  reducers: {
    toggleIngredient: (state, action: PayloadAction<string>) => {
      const index = state.selectedIngredients.indexOf(action.payload);
      if (index > -1) {
        state.selectedIngredients.splice(index, 1);
      } else {
        state.selectedIngredients.push(action.payload);
      }
    },
    removeIngredient: (state, action: PayloadAction<string>) => {
      state.selectedIngredients = state.selectedIngredients.filter(
        name => name !== action.payload
      );
    },
    clearSelection: (state) => {
      state.selectedIngredients = [];
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      if (action.payload.trim() === '') {
        state.filteredIngredients = [];
      } else {
        state.filteredIngredients = state.ingredients.filter((ingredient) =>
          ingredient.strIngredient.toLowerCase().includes(action.payload.toLowerCase())
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIngredients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIngredients.fulfilled, (state, action) => {
        state.loading = false;
        state.ingredients = action.payload;
        state.filteredIngredients = [];
      })
      .addCase(fetchIngredients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch ingredients';
      });
  },
});

export const { toggleIngredient, removeIngredient, clearSelection, setSearchQuery } = ingredientsSlice.actions;
export default ingredientsSlice.reducer;
