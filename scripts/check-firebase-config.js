// Quick Firebase Configuration Checker
// Run this with: npx ts-node scripts/check-firebase-config.ts

const requiredEnvVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

const optionalEnvVars = [
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_USDA_API_KEY',
];

console.log('🔍 Checking Firebase Configuration...\n');

let allGood = true;

// Check required variables
console.log('✅ Required Variables:');
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value || value.includes('your-') || value === 'your-api-key' || value === 'your-project-id') {
    console.log(`   ❌ ${varName}: NOT SET or using placeholder`);
    allGood = false;
  } else {
    console.log(`   ✅ ${varName}: ${value.substring(0, 20)}...`);
  }
});

console.log('\n📝 Optional Variables:');
optionalEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value || value.includes('your-')) {
    console.log(`   ⚠️  ${varName}: Not set (optional)`);
  } else {
    console.log(`   ✅ ${varName}: ${value.substring(0, 20)}...`);
  }
});

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('✅ All required Firebase configuration variables are set!');
  console.log('\n📋 Next steps:');
  console.log('1. Make sure you enabled Authentication in Firebase Console');
  console.log('2. Create Firestore database');
  console.log('3. Set Firestore security rules');
  console.log('4. Run: npx expo start -c');
} else {
  console.log('❌ Some required variables are missing!');
  console.log('\n📋 To fix:');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
  console.log('2. Select your project');
  console.log('3. Go to Project Settings > Your apps > Web app');
  console.log('4. Copy the config values to your .env file');
  console.log('5. See FIREBASE_SETUP.md for detailed instructions');
}

console.log('='.repeat(50) + '\n');
