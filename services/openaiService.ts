import { ActivityLevel, Gender, Goal } from '@/store/profileSlice';

export interface NutritionTargets {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export interface ProfileData {
  age: number;
  gender: Gender;
  height: number; // in cm
  weight: number; // in kg
  activityLevel: ActivityLevel;
  goal: Goal;
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Helper to get activity level description
const getActivityLevelDescription = (level: ActivityLevel): string => {
  const descriptions: Record<ActivityLevel, string> = {
    sedentary: 'little to no exercise',
    lightly_active: 'exercise 1-3 days per week',
    moderately_active: 'exercise 3-5 days per week',
    very_active: 'exercise 6-7 days per week',
    extremely_active: 'physical job and exercise daily',
  };
  return descriptions[level];
};

// Helper to get goal description
const getGoalDescription = (goal: Goal): string => {
  const descriptions: Record<Goal, string> = {
    lose_weight: 'lose weight',
    maintain: 'maintain current weight',
    gain_muscle: 'gain muscle mass',
    gain_weight: 'gain weight',
  };
  return descriptions[goal];
};

export const openaiService = {
  /**
   * Calculate daily nutrition targets using OpenAI GPT-4o-mini model
   * This is a lightweight request that only gets called when needed
   */
  async calculateNutritionTargets(
    profileData: ProfileData,
    apiKey: string
  ): Promise<NutritionTargets> {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const prompt = `You are a nutrition expert. Calculate daily nutrition targets for a person with the following profile:
- Age: ${profileData.age} years
- Gender: ${profileData.gender}
- Height: ${profileData.height} cm
- Weight: ${profileData.weight} kg
- Activity Level: ${getActivityLevelDescription(profileData.activityLevel)}
- Goal: ${getGoalDescription(profileData.goal)}

Calculate their Total Daily Energy Expenditure (TDEE) and provide optimal macronutrient targets.

Return ONLY a JSON object with the following structure (no markdown, no explanation):
{
  "targetCalories": <number>,
  "targetProtein": <number in grams>,
  "targetCarbs": <number in grams>,
  "targetFat": <number in grams>
}`;

    try {
      const requestBody = {
        model: 'gpt-4o-mini', // Lowest tier, most cost-effective model
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition calculator. Return only valid JSON without any markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Low temperature for consistent results
        max_tokens: 150, // Minimal tokens for a simple JSON response
      };

      console.log('=== OpenAI Request ===');
      console.log('URL:', OPENAI_API_URL);
      console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('=====================');

      // Use fetch API which works in React Native
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API Error:', errorData);
        throw new Error(
          errorData.error?.message || `OpenAI API request failed: ${response.status}`
        );
      }

      const data = await response.json();

      // Log the full OpenAI response for debugging
      console.log('OpenAI Response:', JSON.stringify(data, null, 2));

      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Log the content before parsing
      console.log('OpenAI Content:', content);

      // Parse the JSON response, removing any markdown formatting if present
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      const nutritionTargets = JSON.parse(jsonString);

      // Log the parsed targets
      console.log('Parsed Nutrition Targets:', nutritionTargets);

      // Validate the response structure
      if (
        typeof nutritionTargets.targetCalories !== 'number' ||
        typeof nutritionTargets.targetProtein !== 'number' ||
        typeof nutritionTargets.targetCarbs !== 'number' ||
        typeof nutritionTargets.targetFat !== 'number'
      ) {
        throw new Error('Invalid response format from OpenAI');
      }

      return {
        targetCalories: Math.round(nutritionTargets.targetCalories),
        targetProtein: Math.round(nutritionTargets.targetProtein),
        targetCarbs: Math.round(nutritionTargets.targetCarbs),
        targetFat: Math.round(nutritionTargets.targetFat),
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  },

  /**
   * Generate meal ideas using OpenAI GPT-4o-mini model based on available ingredients and user profile
   */
  async generateMealIdeas(
    ingredients: string[],
    profileData: ProfileData,
    nutritionTargets: NutritionTargets,
    apiKey: string,
    count: number = 2
  ): Promise<MealIdea[]> {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    if (ingredients.length === 0) {
      throw new Error('At least one ingredient is required');
    }

    const prompt = `You are a professional chef and nutritionist. Create ${count} different meal ideas using the following constraints:

Available Ingredients: ${ingredients.join(', ')}

User Profile:
- Age: ${profileData.age} years
- Gender: ${profileData.gender}
- Goal: ${getGoalDescription(profileData.goal)}
- Activity Level: ${getActivityLevelDescription(profileData.activityLevel)}

Daily Nutrition Targets:
- Calories: ${nutritionTargets.targetCalories} kcal
- Protein: ${nutritionTargets.targetProtein}g
- Carbs: ${nutritionTargets.targetCarbs}g
- Fat: ${nutritionTargets.targetFat}g

Requirements:
1. Use as many of the available ingredients as possible
2. Align with the user's dietary goals
3. Provide realistic portion sizes
4. Include estimated nutrition information per serving
5. Make the meals practical and delicious

Return ONLY a JSON array with the following structure (no markdown, no explanation):
[
  {
    "name": "Meal name",
    "description": "Brief description of the meal",
    "ingredients": [
      {
        "name": "ingredient name",
        "amount": "quantity with unit"
      }
    ],
    "instructions": "Step-by-step cooking instructions",
    "prepTime": "preparation time in minutes",
    "cookTime": "cooking time in minutes",
    "servings": number of servings,
    "nutrition": {
      "calories": estimated calories per serving,
      "protein": estimated protein in grams,
      "carbs": estimated carbs in grams,
      "fat": estimated fat in grams
    },
    "tags": ["tag1", "tag2"]
  }
]`;

    try {
      const requestBody = {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a chef and nutritionist. Return only valid JSON without any markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7, // Higher temperature for creative meal ideas
        max_tokens: 2000, // Enough tokens for multiple meal ideas
      };

      console.log('\n=== OpenAI Meal Ideas Request ===');
      console.log('Model: gpt-4o-mini');
      console.log('Requesting:', count, 'meal ideas');
      console.log('Ingredients:', ingredients);
      console.log('User Profile:', {
        age: profileData.age,
        gender: profileData.gender,
        goal: getGoalDescription(profileData.goal),
        activityLevel: getActivityLevelDescription(profileData.activityLevel),
      });
      console.log('Nutrition Targets:', nutritionTargets);
      console.log('Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('==================================\n');

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API Error:', errorData);
        throw new Error(
          errorData.error?.message || `OpenAI API request failed: ${response.status}`
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      console.log('OpenAI Meal Ideas Response:', content.substring(0, 200) + '...');

      // Parse the JSON response, removing any markdown formatting if present
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      const mealIdeas = JSON.parse(jsonString);

      // Validate the response structure
      if (!Array.isArray(mealIdeas)) {
        throw new Error('Invalid response format from OpenAI - expected array');
      }

      return mealIdeas;
    } catch (error) {
      console.error('Error generating meal ideas:', error);
      throw error;
    }
  },
};

export interface MealIdea {
  id?: string;
  name: string;
  description: string;
  ingredients: {
    name: string;
    amount: string;
  }[];
  instructions: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  tags: string[];
  createdAt?: string;
}
