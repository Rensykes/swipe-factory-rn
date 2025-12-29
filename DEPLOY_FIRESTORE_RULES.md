# Firebase Deployment Guide

## Deploy Firestore Rules

### Prerequisites
Install Firebase CLI if you haven't already:
```powershell
npm install -g firebase-tools
```

### Steps to Deploy

1. **Login to Firebase** (if not already logged in):
```powershell
firebase login
```

2. **Initialize Firebase** (if not already initialized):
```powershell
firebase init
```
- Select "Firestore" when prompted
- Choose your existing project
- Accept the default files (firestore.rules)

3. **Deploy the Firestore Rules**:
```powershell
firebase deploy --only firestore:rules
```

### Alternative: Manual Deployment via Console

If you prefer not to use the CLI:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Firestore Database** → **Rules** tab
4. Copy the contents from `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish**

### Verify Deployment

After deployment, you should see:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR_PROJECT/overview
```

The rules are now live and will fix the "Missing or insufficient permissions" error.
