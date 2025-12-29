# Firebase Configuration Guide for Swipe Factory

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** (or select existing project)
3. Enter project name: `swipe-factory` (or your preferred name)
4. (Optional) Enable Google Analytics
5. Click **Create project**

## Step 2: Register Your App

### For Web App (Required for Expo):

1. In Firebase Console, click the **Web icon** (`</>`) to add a web app
2. Enter app nickname: `Swipe Factory Web`
3. **Check** "Also set up Firebase Hosting" (optional)
4. Click **Register app**
5. You'll see your Firebase configuration - **KEEP THIS OPEN**

## Step 3: Copy Firebase Configuration

You'll see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "swipe-factory-xxxxx.firebaseapp.com",
  projectId: "swipe-factory-xxxxx",
  storageBucket: "swipe-factory-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## Step 4: Update Your .env File

1. In your project root, create or edit the `.env` file
2. Add your Firebase configuration:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=swipe-factory-xxxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=swipe-factory-xxxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=swipe-factory-xxxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Google Sign-In Configuration (for later)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com

# USDA API Key (optional)
EXPO_PUBLIC_USDA_API_KEY=your_api_key_here
```

**⚠️ IMPORTANT**: Add `.env` to your `.gitignore` file to keep credentials secret!

## Step 5: Enable Authentication

1. In Firebase Console, click **Authentication** in the left menu
2. Click **Get started**
3. Click **Sign-in method** tab

### Enable Email/Password:

1. Click on **Email/Password** provider
2. Toggle **Enable** switch ON
3. Leave "Email link" disabled (unless you want passwordless auth)
4. Click **Save**

### Enable Google Sign-In:

1. Click on **Google** provider
2. Toggle **Enable** switch ON
3. Select a **support email** from dropdown
4. Click **Save**
5. **Copy the Web client ID** - you'll need this for `.env`

## Step 6: Create Firestore Database

1. In Firebase Console, click **Firestore Database** in the left menu
2. Click **Create database**
3. Choose **Start in production mode** (we'll add rules next)
4. Select a location (choose closest to your users, e.g., `us-central1`)
5. Click **Enable**

## Step 7: Set Firestore Security Rules

1. In Firestore Database, click the **Rules** tab
2. Replace the default rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // User profiles - only owner can read/write their own profile
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      
      // Daily nutrition targets subcollection
      match /daily_nutrition_targets/{targetId} {
        allow read, write: if isOwner(userId);
      }
    }
    
    // Ingredients - only owner can read/write their own ingredients
    match /ingredients/{ingredientId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Meals - only owner can read/write their own saved meals
    match /meals/{mealId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click **Publish**

## Step 8: Verify Your Setup

Create a simple test file to verify Firebase is working:

```bash
# Restart your Expo server to load new .env variables
npx expo start -c
```

## Step 9: Test Authentication

1. Run your app
2. You should see the auth screen
3. Try signing up with email/password
4. Check Firebase Console > Authentication > Users to see the new user

## Firestore Database Structure

Your app will create these collections automatically:

```
/users/{userId}
  - uid: string
  - email: string
  - displayName: string
  - age: number
  - weight: number
  - height: number
  - gender: "male" | "female"
  - activityLevel: string
  - goal: "lose" | "maintain" | "gain"
  - createdAt: timestamp
  - updatedAt: timestamp

/ingredients/{ingredientId}
  - userId: string
  - name: string
  - calories: number
  - protein: number
  - carbs: number
  - fat: number
  - createdAt: timestamp

/meals/{mealId}
  - userId: string
  - mealId: string
  - mealName: string
  - mealThumb: string
  - category: string
  - area: string
  - isFavorite: boolean
  - createdAt: timestamp
```

## Common Issues & Solutions

### Issue: "Firebase: Error (auth/invalid-api-key)"
**Solution**: Check that your API key in `.env` is correct and matches Firebase Console

### Issue: "Firebase: Error (auth/configuration-not-found)"
**Solution**: 
- Verify all Firebase config values in `.env`
- Restart Expo dev server: `npx expo start -c`
- Check that you enabled Email/Password in Authentication

### Issue: Environment variables not loading
**Solution**:
- Variables must start with `EXPO_PUBLIC_` prefix
- Restart Expo dev server completely
- Check `.env` file is in project root
- No quotes around values in `.env`

### Issue: "Permission denied" in Firestore
**Solution**: 
- Check Firestore Rules are published
- Verify user is authenticated
- Ensure `userId` field matches authenticated user's UID

## Security Best Practices

1. ✅ **Never commit `.env` file** - Add to `.gitignore`
2. ✅ **Use Firestore Security Rules** - Already configured above
3. ✅ **Validate data** - Rules check userId ownership
4. ✅ **Enable App Check** (optional) - Prevents API abuse
5. ✅ **Monitor usage** - Check Firebase Console > Usage tab

## Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## Quick Checklist

- [ ] Created Firebase project
- [ ] Added web app to Firebase
- [ ] Copied Firebase config to `.env`
- [ ] Enabled Email/Password authentication
- [ ] Enabled Google Sign-In authentication
- [ ] Created Firestore database
- [ ] Set Firestore security rules
- [ ] Added `.env` to `.gitignore`
- [ ] Restarted Expo dev server
- [ ] Tested sign up/sign in

Once all items are checked, your Firebase integration is complete! 🎉
