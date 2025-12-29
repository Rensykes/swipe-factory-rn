import { db } from '@/config/firebase';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

// User profile data structure
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: 'male' | 'female';
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  goal?: 'lose' | 'maintain' | 'gain';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Saved ingredients
export interface SavedIngredient {
  id?: string;
  userId: string;
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  createdAt?: Timestamp;
}

// Saved meals
export interface SavedMeal {
  id?: string;
  userId: string;
  mealId: string;
  mealName: string;
  mealThumb?: string;
  category?: string;
  area?: string;
  isFavorite: boolean;
  createdAt?: Timestamp;
}

export const firestoreService = {
  // User Profile Operations
  async createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...data,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteUserProfile(uid: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
  },

  // Saved Ingredients Operations
  async saveIngredient(userId: string, ingredient: Omit<SavedIngredient, 'id' | 'userId' | 'createdAt'>): Promise<string> {
    const ingredientsRef = collection(db, 'ingredients');
    const docRef = await addDoc(ingredientsRef, {
      ...ingredient,
      userId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getUserIngredients(userId: string): Promise<SavedIngredient[]> {
    const ingredientsRef = collection(db, 'ingredients');
    const q = query(ingredientsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SavedIngredient[];
  },

  async deleteIngredient(ingredientId: string): Promise<void> {
    const ingredientRef = doc(db, 'ingredients', ingredientId);
    await deleteDoc(ingredientRef);
  },

  // Saved Meals Operations
  async saveMeal(userId: string, meal: Omit<SavedMeal, 'id' | 'userId' | 'createdAt'>): Promise<string> {
    const mealsRef = collection(db, 'meals');
    const docRef = await addDoc(mealsRef, {
      ...meal,
      userId,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getUserMeals(userId: string): Promise<SavedMeal[]> {
    const mealsRef = collection(db, 'meals');
    const q = query(mealsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SavedMeal[];
  },

  async getFavoriteMeals(userId: string): Promise<SavedMeal[]> {
    const mealsRef = collection(db, 'meals');
    const q = query(
      mealsRef,
      where('userId', '==', userId),
      where('isFavorite', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SavedMeal[];
  },

  async toggleMealFavorite(mealId: string, isFavorite: boolean): Promise<void> {
    const mealRef = doc(db, 'meals', mealId);
    await updateDoc(mealRef, { isFavorite });
  },

  async deleteMeal(mealId: string): Promise<void> {
    const mealRef = doc(db, 'meals', mealId);
    await deleteDoc(mealRef);
  },

  // Daily Nutrition Targets Operations
  async saveNutritionTargets(
    userId: string,
    targets: {
      targetCalories: number;
      targetProtein: number;
      targetCarbs: number;
      targetFat: number;
    },
    profileSnapshot: {
      age: number;
      gender: string;
      height: number;
      weight: number;
      activityLevel: string;
      goal: string;
    }
  ): Promise<void> {
    const targetsRef = doc(db, 'users', userId, 'daily_nutrition_targets', 'current');
    await setDoc(targetsRef, {
      ...targets,
      lastCalculatedWith: profileSnapshot,
      calculatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async getNutritionTargets(userId: string): Promise<{
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    lastCalculatedWith?: any;
    calculatedAt?: Timestamp;
  } | null> {
    const targetsRef = doc(db, 'users', userId, 'daily_nutrition_targets', 'current');
    const targetsSnap = await getDoc(targetsRef);
    
    if (targetsSnap.exists()) {
      return targetsSnap.data() as any;
    }
    return null;
  },

  async deleteNutritionTargets(userId: string): Promise<void> {
    const targetsRef = doc(db, 'users', userId, 'daily_nutrition_targets', 'current');
    await deleteDoc(targetsRef);
  },
};
