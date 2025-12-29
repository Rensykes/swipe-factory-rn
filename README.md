# Swipe Factory 🍽️

A React Native meal planning and nutrition tracking app built with Expo, Firebase, and Redux.

## Features

- 📸 **Camera Integration** - Take photos and save to device gallery
- 🥗 **Ingredient Search** - Browse and select ingredients from TheMealDB
- 🍲 **Meal Suggestions** - Find recipes based on selected ingredients
- 📊 **Nutrition Tracking** - View macronutrients for ingredients
- 👤 **User Profile** - Calculate BMR, TDEE, and personalized nutrition targets
- 🔐 **Firebase Authentication** - Secure email/password authentication
- ☁️ **Cloud Storage** - Sync data with Firestore
- 🎨 **Dark Mode** - Beautiful dark-themed UI

## Tech Stack

- **React Native** with Expo SDK 54
- **TypeScript** for type safety
- **Redux Toolkit** for state management
- **Firebase** for authentication and cloud storage
- **Expo Router** for file-based navigation
- **TheMealDB API** for recipes and ingredients
- **AsyncStorage** for local data persistence

## Get Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** with Email/Password provider
3. Create a **Firestore Database** in production mode
4. Add a web app to your Firebase project
5. Copy your Firebase configuration
6. Create a `.env` file in the root directory:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# USDA API Key (Optional - for real nutrition data)
EXPO_PUBLIC_USDA_API_KEY=your_api_key_here
```

### 3. Configure Firestore Security Rules

In Firebase Console > Firestore Database > Rules, add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - only owner can read/write
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Ingredients - only owner can read/write
    match /ingredients/{ingredientId} {
      allow read, write: if request.auth != null && 
                           request.resource.data.userId == request.auth.uid;
    }
    
    // Meals - only owner can read/write
    match /meals/{mealId} {
      allow read, write: if request.auth != null && 
                           request.resource.data.userId == request.auth.uid;
    }
  }
}
```

### 4. Start the App

```bash
npx expo start
```

```bash
npx expo start
```

In the output, you'll find options to open the app in:

- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go)

## Project Structure

```
swipe-factory/
├── app/                    # File-based routing
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Camera screen
│   │   ├── ingredients.tsx # Ingredient selection
│   │   ├── profile.tsx    # User profile

│   ├── auth.tsx           # Authentication screen
│   ├── meals.tsx          # Meal search results
│   ├── meal-detail.tsx    # Recipe details
│   └── _layout.tsx        # Root layout with auth
├── store/                 # Redux state management
│   ├── authSlice.ts       # Authentication state
│   ├── ingredientsSlice.ts # Ingredients state
│   ├── mealsSlice.ts      # Meals state
│   ├── profileSlice.ts    # Profile state
│   └── store.ts           # Redux store config
├── services/              # API services
│   ├── authService.ts     # Firebase Auth
│   └── firestoreService.ts # Firestore operations
├── config/
│   └── firebase.ts        # Firebase configuration
└── components/            # Reusable components
```

## Firebase Firestore Collections

### `users` Collection
```typescript
{
  uid: string;
  email: string;
  displayName?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: 'male' | 'female';
  activityLevel?: string;
  goal?: 'lose' | 'maintain' | 'gain';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `ingredients` Collection
```typescript
{
  userId: string;
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  createdAt: Timestamp;
}
```

### `meals` Collection
```typescript
{
  userId: string;
  mealId: string;
  mealName: string;
  mealThumb?: string;
  category?: string;
  area?: string;
  isFavorite: boolean;
### Authentication Flow
- Users must sign up/sign in to access the app
- Firebase Authentication with email/password and Google Sign-In
- Google Sign-In uses Firebase JS SDK (works in Expo Go!)
- Protected routes with automatic redirect
- Sign out from profile screen
### Authentication Flow
- Users must sign up/sign in to access the app
- Firebase Authentication with email/password
- Protected routes with automatic redirect
- Sign out from profile screen

### Ingredient Selection
- Search ingredients from TheMealDB
- Auto-filterable dropdown with 500+ ingredients
- Mock nutrition data for each ingredient
- Selected ingredients displayed as removable pills
- Nutrition info modal with accordion

### Meal Search
- Find recipes based on selected ingredients
- Three filter modes:
  - **All**: Show all matching meals
  - **Exact Match**: Only meals with ALL selected ingredients
  - **50%+ Match**: Meals with at least half of selected ingredients
- Nested scrollable ingredient lists

### User Profile
- Calculate BMR using Mifflin-St Jeor equation
- Calculate TDEE based on activity level
- Personalized macro targets based on goals
- Save profile data to AsyncStorage and Firestore

## API Integration

### TheMealDB API
- **Ingredients**: `https://www.themealdb.com/api/json/v1/1/list.php?i=list`
- **Meals by Ingredient**: `https://www.themealdb.com/api/json/v1/1/filter.php?i={ingredient}`
- **Meal Details**: `https://www.themealdb.com/api/json/v1/1/lookup.php?i={mealId}`

### USDA FoodData Central (Optional)
- Register at: https://fdc.nal.usda.gov/api-key-signup.html
- Currently using mock data by default

## Development Tips

### Testing Firebase Locally
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore emulator (optional)
firebase init emulators
```

### Debugging
- Use React DevTools for component inspection
- Redux DevTools for state debugging
- Firebase Console for data inspection

## Troubleshooting

### Firebase Connection Issues
- Verify `.env` file has correct values
- Check Firebase project settings
- Ensure Authentication and Firestore are enabled

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules
npm cache clean --force
npm install
npx expo start -c
```

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [TheMealDB API](https://www.themealdb.com/api.php)

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
