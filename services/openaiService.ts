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
};
