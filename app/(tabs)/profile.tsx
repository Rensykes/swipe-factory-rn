import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authService } from '@/services/authService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadProfile, saveProfile, type ActivityLevel, type Gender, type Goal, type UserProfile } from '@/store/profileSlice';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { profile, isLoaded } = useAppSelector((state) => state.profile);
  const { user } = useAppSelector((state) => state.auth);
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately_active');
  const [goal, setGoal] = useState<Goal>('maintain');

  useEffect(() => {
    dispatch(loadProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAge(profile.age.toString());
      setGender(profile.gender);
      setHeight(profile.height.toString());
      setWeight(profile.weight.toString());
      setActivityLevel(profile.activityLevel);
      setGoal(profile.goal);
    }
  }, [profile]);

  const handleSave = () => {
    if (!name || !age || !height || !weight) {
      alert('Please fill in all required fields');
      return;
    }

    const profileData: UserProfile = {
      name,
      age: parseInt(age),
      gender,
      height: parseInt(height),
      weight: parseInt(weight),
      activityLevel,
      goal,
    };

    dispatch(saveProfile(profileData));
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!isLoaded) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A84FF" />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}>
        
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>Profile</ThemedText>
          <ThemedText style={styles.subtitle}>Set up your personal information</ThemedText>
          {user && (
            <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
          )}
        </ThemedView>

        {/* Basic Information */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
          
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Name</ThemedText>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Age</ThemedText>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Enter your age"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Gender</ThemedText>
            <View style={styles.optionsRow}>
              {(['male', 'female', 'other'] as Gender[]).map((g) => (
                <Pressable
                  key={g}
                  style={[
                    styles.optionButton,
                    gender === g && styles.optionButtonActive,
                  ]}
                  onPress={() => setGender(g)}>
                  <ThemedText style={[
                    styles.optionButtonText,
                    gender === g && styles.optionButtonTextActive,
                  ]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Physical Metrics */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Physical Metrics</ThemedText>
          
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Height (cm)</ThemedText>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              placeholder="Enter your height"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Weight (kg)</ThemedText>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="Enter your weight"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Activity Level</ThemedText>
          
          <View style={styles.activityOptions}>
            {[
              { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
              { value: 'lightly_active', label: 'Lightly Active', desc: 'Exercise 1-3 days/week' },
              { value: 'moderately_active', label: 'Moderately Active', desc: 'Exercise 3-5 days/week' },
              { value: 'very_active', label: 'Very Active', desc: 'Exercise 6-7 days/week' },
              { value: 'extremely_active', label: 'Extremely Active', desc: 'Physical job + exercise' },
            ].map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.activityOption,
                  activityLevel === option.value && styles.activityOptionActive,
                ]}
                onPress={() => setActivityLevel(option.value as ActivityLevel)}>
                <View style={styles.activityOptionContent}>
                  <ThemedText style={[
                    styles.activityOptionLabel,
                    activityLevel === option.value && styles.activityOptionLabelActive,
                  ]}>
                    {option.label}
                  </ThemedText>
                  <ThemedText style={styles.activityOptionDesc}>
                    {option.desc}
                  </ThemedText>
                </View>
                {activityLevel === option.value && (
                  <ThemedText style={styles.checkmark}>✓</ThemedText>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Goal */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Fitness Goal</ThemedText>
          
          <View style={styles.goalOptions}>
            {[
              { value: 'lose_weight', label: 'Lose Weight', icon: '📉' },
              { value: 'maintain', label: 'Maintain Weight', icon: '⚖️' },
              { value: 'gain_muscle', label: 'Gain Muscle', icon: '💪' },
              { value: 'gain_weight', label: 'Gain Weight', icon: '📈' },
            ].map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.goalOption,
                  goal === option.value && styles.goalOptionActive,
                ]}
                onPress={() => setGoal(option.value as Goal)}>
                <ThemedText style={styles.goalIcon}>{option.icon}</ThemedText>
                <ThemedText style={[
                  styles.goalLabel,
                  goal === option.value && styles.goalLabelActive,
                ]}>
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Nutrition Targets (if profile exists) */}
        {profile && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Daily Nutrition Targets</ThemedText>
            
            <View style={styles.targetsGrid}>
              <View style={styles.targetCard}>
                <ThemedText style={styles.targetValue}>{profile.targetCalories}</ThemedText>
                <ThemedText style={styles.targetLabel}>Calories</ThemedText>
              </View>
              <View style={styles.targetCard}>
                <ThemedText style={styles.targetValue}>{profile.targetProtein}g</ThemedText>
                <ThemedText style={styles.targetLabel}>Protein</ThemedText>
              </View>
              <View style={styles.targetCard}>
                <ThemedText style={styles.targetValue}>{profile.targetCarbs}g</ThemedText>
                <ThemedText style={styles.targetLabel}>Carbs</ThemedText>
              </View>
              <View style={styles.targetCard}>
                <ThemedText style={styles.targetValue}>{profile.targetFat}g</ThemedText>
                <ThemedText style={styles.targetLabel}>Fat</ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Save Button */}
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.saveButtonPressed,
          ]}
          onPress={handleSave}>
          <ThemedText style={styles.saveButtonText}>Save Profile</ThemedText>
        </Pressable>

        {/* Sign Out Button */}
        <Pressable
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.signOutButtonPressed,
          ]}
          onPress={handleSignOut}>
          <ThemedText style={styles.signOutButtonText}>Sign Out</ThemedText>
        </Pressable>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    color: '#A0A0A0',
  },
  userEmail: {
    fontSize: 14,
    color: '#0A84FF',
    marginTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    color: '#E5E5E7',
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderColor: '#0A84FF',
    borderWidth: 2,
  },
  optionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#A0A0A0',
  },
  optionButtonTextActive: {
    color: '#0A84FF',
    fontWeight: '600',
  },
  activityOptions: {
    gap: 12,
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityOptionActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderColor: '#0A84FF',
    borderWidth: 2,
  },
  activityOptionContent: {
    flex: 1,
  },
  activityOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  activityOptionLabelActive: {
    color: '#0A84FF',
  },
  activityOptionDesc: {
    fontSize: 13,
    color: '#A0A0A0',
  },
  checkmark: {
    fontSize: 20,
    color: '#0A84FF',
    fontWeight: 'bold',
  },
  goalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalOption: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  goalOptionActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderColor: '#0A84FF',
    borderWidth: 2,
  },
  goalIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: '#E5E5E7',
  },
  goalLabelActive: {
    color: '#0A84FF',
    fontWeight: '600',
  },
  targetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  targetCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
    alignItems: 'center',
  },
  targetValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0A84FF',
    marginBottom: 4,
  },
  targetLabel: {
    fontSize: 13,
    color: '#A0A0A0',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signOutButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  signOutButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  signOutButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF3B30',
  },
  bottomSpacer: {
    height: 40,
  },
});
