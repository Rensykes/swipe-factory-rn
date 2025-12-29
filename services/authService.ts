import { auth } from '@/config/firebase';
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updateProfile,
    User
} from 'firebase/auth';

export const authService = {
  // Sign up with email and password
  signUp: async (email: string, password: string, displayName?: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential.user;
  },

  // Sign in with email and password
  signIn: async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Sign out
  signOut: async (): Promise<void> => {
    await firebaseSignOut(auth);
  },

  // Reset password
  resetPassword: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  },

  // Update user profile
  updateUserProfile: async (displayName?: string, photoURL?: string): Promise<void> => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName, photoURL });
    }
  },

  // Get current user
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },

  // Google Sign-In is disabled
  signInWithGoogle: async (): Promise<User> => {
    throw new Error('Google Sign-In is not available. Please use email/password authentication.');
  },
  
  // Check if Google Sign-In is available
  isGoogleSignInAvailable: (): boolean => {
    return false;
  },
};
