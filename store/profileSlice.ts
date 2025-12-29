import { auth } from '@/config/firebase';
import { firestoreService } from '@/services/firestoreService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppDispatch } from './store';

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
export type Gender = 'male' | 'female' | 'other';
export type Goal = 'lose_weight' | 'maintain' | 'gain_muscle' | 'gain_weight';

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  height: number; // in cm
  weight: number; // in kg
  activityLevel: ActivityLevel;
  goal: Goal;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
}

interface ProfileState {
  profile: UserProfile | null;
  isLoaded: boolean;
}

const initialState: ProfileState = {
  profile: null,
  isLoaded: false,
};

const PROFILE_STORAGE_KEY = '@swipe_factory_profile';

// Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
const calculateBMR = (weight: number, height: number, age: number, gender: Gender): number => {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

// Activity level multipliers
const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

// Calculate TDEE (Total Daily Energy Expenditure) and macros
export const calculateNutritionTargets = (profile: Omit<UserProfile, 'targetCalories' | 'targetProtein' | 'targetCarbs' | 'targetFat'>): {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
} => {
  const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
  const tdee = bmr * activityMultipliers[profile.activityLevel];
  
  let targetCalories = tdee;
  
  // Adjust calories based on goal
  switch (profile.goal) {
    case 'lose_weight':
      targetCalories = tdee - 500; // 500 calorie deficit
      break;
    case 'gain_muscle':
    case 'gain_weight':
      targetCalories = tdee + 300; // 300 calorie surplus
      break;
    case 'maintain':
    default:
      targetCalories = tdee;
  }

  // Calculate macros (protein: 2g/kg, fat: 25% of calories, rest from carbs)
  const targetProtein = Math.round(profile.weight * 2);
  const targetFat = Math.round((targetCalories * 0.25) / 9); // 9 calories per gram of fat
  const remainingCalories = targetCalories - (targetProtein * 4) - (targetFat * 9);
  const targetCarbs = Math.round(remainingCalories / 4); // 4 calories per gram of carbs

  return {
    targetCalories: Math.round(targetCalories),
    targetProtein,
    targetCarbs,
    targetFat,
  };
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.isLoaded = true;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        const updatedProfile = { ...state.profile, ...action.payload };
        
        // Recalculate nutrition targets if relevant fields changed
        if (
          action.payload.weight !== undefined ||
          action.payload.height !== undefined ||
          action.payload.age !== undefined ||
          action.payload.gender !== undefined ||
          action.payload.activityLevel !== undefined ||
          action.payload.goal !== undefined
        ) {
          const targets = calculateNutritionTargets(updatedProfile);
          state.profile = { ...updatedProfile, ...targets };
        } else {
          state.profile = updatedProfile;
        }
      }
    },
    clearProfile: (state) => {
      state.profile = null;
      state.isLoaded = true;
    },
    setIsLoaded: (state, action: PayloadAction<boolean>) => {
      state.isLoaded = action.payload;
    },
  },
});

export const { setProfile, updateProfile, clearProfile, setIsLoaded } = profileSlice.actions;

// Async actions for persisting profile
export const loadProfile = () => async (dispatch: AppDispatch) => {
  try {
    const user = auth.currentUser;
    
    if (user) {
      // Try to load from Firestore first
      const firestoreProfile = await firestoreService.getUserProfile(user.uid);
      
      if (firestoreProfile) {
        // Convert Firestore profile to app profile format
        const profile: UserProfile = {
          name: firestoreProfile.displayName || '',
          age: firestoreProfile.age || 0,
          gender: firestoreProfile.gender || 'male',
          height: firestoreProfile.height || 0,
          weight: firestoreProfile.weight || 0,
          activityLevel: firestoreProfile.activityLevel || 'moderately_active',
          goal: firestoreProfile.goal === 'lose' ? 'lose_weight' : 
                firestoreProfile.goal === 'gain' ? 'gain_weight' : 'maintain',
        };
        
        // Calculate targets
        const targets = calculateNutritionTargets(profile);
        const profileWithTargets = { ...profile, ...targets };
        
        // Save to AsyncStorage for offline access
        await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileWithTargets));
        dispatch(setProfile(profileWithTargets));
        return;
      }
    }
    
    // Fallback to AsyncStorage if Firestore fails or user not logged in
    const profileJson = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
    if (profileJson) {
      const profile = JSON.parse(profileJson);
      dispatch(setProfile(profile));
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    // Try AsyncStorage as fallback
    try {
      const profileJson = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (profileJson) {
        const profile = JSON.parse(profileJson);
        dispatch(setProfile(profile));
      }
    } catch (fallbackError) {
      console.error('Error loading profile from AsyncStorage:', fallbackError);
    }
  } finally {
    dispatch(setIsLoaded(true));
  }
};

export const saveProfile = (profile: UserProfile) => async (dispatch: AppDispatch) => {
  try {
    // Calculate nutrition targets
    const targets = calculateNutritionTargets(profile);
    const profileWithTargets = { ...profile, ...targets };
    
    // Save to AsyncStorage for offline access
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileWithTargets));
    
    // Save to Firestore if user is logged in
    const user = auth.currentUser;
    if (user) {
      // Convert app profile to Firestore format
      const firestoreProfile: Partial<import('@/services/firestoreService').UserProfile> = {
        displayName: profile.name,
        email: user.email || '',
        age: profile.age,
        gender: profile.gender === 'other' ? 'male' : profile.gender as 'male' | 'female',
        height: profile.height,
        weight: profile.weight,
        activityLevel: profile.activityLevel === 'extremely_active' ? 'extra_active' : 
                       profile.activityLevel as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active',
        goal: profile.goal === 'lose_weight' ? 'lose' : 
              profile.goal === 'gain_weight' || profile.goal === 'gain_muscle' ? 'gain' : 'maintain',
      };
      
      // Check if profile exists
      const existingProfile = await firestoreService.getUserProfile(user.uid);
      
      if (existingProfile) {
        await firestoreService.updateUserProfile(user.uid, firestoreProfile);
      } else {
        await firestoreService.createUserProfile(user.uid, firestoreProfile);
      }
    }
    
    dispatch(setProfile(profileWithTargets));
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

export const deleteProfile = () => async (dispatch: AppDispatch) => {
  try {
    // Delete from AsyncStorage
    await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
    
    // Delete from Firestore if user is logged in
    const user = auth.currentUser;
    if (user) {
      await firestoreService.deleteUserProfile(user.uid);
    }
    
    dispatch(clearProfile());
  } catch (error) {
    console.error('Error deleting profile:', error);
  }
};

export default profileSlice.reducer;
