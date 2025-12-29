# Firestore Security Rules Update

## Important: Update Your Firebase Security Rules

The app now uses a subcollection for daily nutrition targets. You need to update your Firestore security rules to allow access to this data.

### Steps to Update:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace your current rules with the following:

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

6. Click **Publish**

### What Changed?

Added support for the `daily_nutrition_targets` subcollection under the `users` collection:

```javascript
// Daily nutrition targets subcollection
match /daily_nutrition_targets/{targetId} {
  allow read, write: if isOwner(userId);
}
```

This allows authenticated users to read and write their own nutrition targets stored at:
`users/{userId}/daily_nutrition_targets/current`

### Verify the Update

After publishing, you should see a success message. The nutrition targets calculation feature will now work without permission errors.
