import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authService } from '@/services/authService';
import { clearError, setError } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

export default function AuthScreen() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if Google Sign-In is available (not available in Expo Go)
  const isGoogleSignInAvailable = authService.isGoogleSignInAvailable();

  const handleAuth = async () => {
    dispatch(clearError());
    
    if (!email || !password) {
      dispatch(setError('Please fill in all fields'));
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      dispatch(setError('Passwords do not match'));
      return;
    }

    if (isSignUp && password.length < 6) {
      dispatch(setError('Password must be at least 6 characters'));
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        await authService.signUp(email, password, displayName);
      } else {
        await authService.signIn(email, password);
      }
    } catch (err: any) {
      let errorMessage = 'An error occurred';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'User not found';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      dispatch(setError(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    dispatch(clearError());
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
  };

  const handleGoogleSignIn = async () => {
    dispatch(clearError());
    setIsLoading(true);

    try {
      await authService.signInWithGoogle();
    } catch (err: any) {
      let errorMessage = 'Google sign-in failed';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      dispatch(setError(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <ThemedText style={styles.title}>Swipe Factory</ThemedText>
            <ThemedText style={styles.subtitle}>
              {isSignUp ? 'Create your account' : 'Sign in to continue'}
            </ThemedText>
          </View>

          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Name</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor="#666"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {isSignUp && (
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Confirm Password</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.authButton,
                pressed && styles.authButtonPressed,
                isLoading && styles.authButtonDisabled,
              ]}
              onPress={handleAuth}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.authButtonText}>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </ThemedText>
              )}
            </Pressable>

            {isGoogleSignInAvailable && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <ThemedText style={styles.dividerText}>OR</ThemedText>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.googleButton,
                    pressed && styles.googleButtonPressed,
                    isLoading && styles.authButtonDisabled,
                  ]}
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator color="#1F1F1F" />
                  ) : (
                    <>
                      <ThemedText style={styles.googleIcon}>G</ThemedText>
                      <ThemedText style={styles.googleButtonText}>
                        Continue with Google
                      </ThemedText>
                    </>
                  )}
                </Pressable>
              </>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.toggleButton,
                pressed && styles.toggleButtonPressed,
              ]}
              onPress={toggleMode}>
              <ThemedText style={styles.toggleButtonText}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0A84FF',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 44,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 18,
    color: '#A0A0A0',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E5E7',
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
  authButton: {
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  authButtonPressed: {
    opacity: 0.8,
  },
  authButtonDisabled: {
    opacity: 0.5,
  },
  authButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  googleButtonPressed: {
    opacity: 0.8,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1F1F',
  },
  infoContainer: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  infoText: {
    color: '#0A84FF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  toggleButton: {
    padding: 12,
    alignItems: 'center',
  },
  toggleButtonPressed: {
    opacity: 0.6,
  },
  toggleButtonText: {
    fontSize: 15,
    color: '#0A84FF',
    fontWeight: '600',
  },
});
