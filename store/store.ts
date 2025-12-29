import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import ingredientsReducer from './ingredientsSlice';
import mealPlannerReducer from './mealPlannerSlice';
import mealsReducer from './mealsSlice';
import profileReducer from './profileSlice';
import shoppingListsReducer from './shoppingListsSlice';

export const store = configureStore({
  reducer: {
    ingredients: ingredientsReducer,
    meals: mealsReducer,
    mealPlanner: mealPlannerReducer,
    profile: profileReducer,
    auth: authReducer,
    shoppingLists: shoppingListsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Firebase User object in actions
        ignoredActions: ['auth/setUser'],
        ignoredPaths: ['auth.user'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
