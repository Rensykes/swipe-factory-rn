import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authService } from '@/services/authService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { calculateNutritionTargetsWithAI, hasSensitiveDataChanged, loadProfile, saveProfile, type ActivityLevel, type Gender, type Goal, type UserProfile } from '@/store/profileSlice';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { LineChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { profile, isLoaded, isCalculatingTargets } = useAppSelector((state) => state.profile);
  const { user } = useAppSelector((state) => state.auth);
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderately_active');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [currentChartIndex, setCurrentChartIndex] = useState(0);
  const chartScrollViewRef = useRef<ScrollView>(null);
  
  // Get OpenAI API key from environment variable or use empty string
  const envApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
  const hasEnvApiKey = envApiKey && envApiKey !== 'your_openai_api_key_here';

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

  const handleSave = async () => {
    if (!name || !age || !height || !weight) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
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

    try {
      await dispatch(saveProfile(profileData));
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      console.error('Error saving profile:', error);
    }
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

  const handleCalculateTargets = async () => {
    // Use environment API key if available, otherwise use user input
    const apiKeyToUse = hasEnvApiKey ? envApiKey : openaiApiKey.trim();
    
    console.log('=== API Key Debug ===');
    console.log('Environment API Key:', envApiKey);
    console.log('Has Env API Key:', hasEnvApiKey);
    console.log('User Input API Key:', openaiApiKey);
    console.log('API Key to Use:', apiKeyToUse);
    console.log('API Key Length:', apiKeyToUse.length);
    console.log('====================');
    
    if (!apiKeyToUse) {
      Alert.alert('API Key Required', 'Please enter your OpenAI API key to calculate nutrition targets.');
      return;
    }

    if (!name || !age || !height || !weight) {
      Alert.alert('Incomplete Profile', 'Please fill in all required fields before calculating nutrition targets.');
      return;
    }

    // Save profile first
    const profileData: UserProfile = {
      name,
      age: parseInt(age),
      gender,
      height: parseInt(height),
      weight: parseInt(weight),
      activityLevel,
      goal,
    };

    try {
      await dispatch(saveProfile(profileData));
      
      // Calculate nutrition targets using OpenAI
      await dispatch(calculateNutritionTargetsWithAI(apiKeyToUse));
      
      Alert.alert('Success', 'Your nutrition targets have been calculated and saved!');
      setOpenaiApiKey(''); // Clear API key for security
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to calculate nutrition targets. Please try again.');
      console.error('Error calculating nutrition targets:', error);
    }
  };

  const hasTargets = profile && profile.targetCalories !== undefined;
  const needsRecalculation = profile ? hasSensitiveDataChanged(profile) : false;

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
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Daily Nutrition Targets</ThemedText>
          
          {hasTargets ? (
            <>
              {/* Swipable Macro Charts */}
              <View style={styles.swipableChartWrapper}>
                <ScrollView
                  ref={chartScrollViewRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(
                      event.nativeEvent.contentOffset.x / (Dimensions.get('window').width - 40)
                    );
                    setCurrentChartIndex(index);
                  }}
                  style={styles.chartScrollView}
                  contentContainerStyle={styles.chartScrollContent}
                >
                  {/* Macro Progress Rings */}
                  <View style={[styles.chartContainer, styles.chartPage]}>
                    <ThemedText style={styles.chartTitle}>Macro Distribution</ThemedText>
                    <ProgressChart
                      data={{
                        labels: ['Protein', 'Carbs', 'Fat'],
                        data: [
                          (profile.targetProtein! * 4) / profile.targetCalories!,
                          (profile.targetCarbs! * 4) / profile.targetCalories!,
                          (profile.targetFat! * 9) / profile.targetCalories!,
                        ],
                      }}
                      width={Dimensions.get('window').width - 80}
                      height={240}
                      strokeWidth={10}
                      radius={26}
                      chartConfig={{
                        backgroundGradientFrom: '#1C1C1E',
                        backgroundGradientTo: '#1C1C1E',
                        color: (opacity = 1, index) => {
                          const colors = [
                            `rgba(10, 132, 255, ${opacity})`,   // Blue for Protein
                            `rgba(52, 199, 89, ${opacity})`,    // Green for Carbs
                            `rgba(255, 159, 10, ${opacity})`,   // Orange for Fat
                          ];
                          return colors[index || 0];
                        },
                        labelColor: () => '#E5E5E7',
                        propsForLabels: {
                          fontSize: 12,
                          fontWeight: '600',
                        },
                      }}
                      hideLegend={false}
                    />
                  </View>

                  {/* Enhanced Macro Pie Chart */}
                  <View style={[styles.chartContainer, styles.chartPage]}>
                    <ThemedText style={styles.chartTitle}>Calorie Breakdown</ThemedText>
                    <PieChart
                      data={[
                        {
                          name: 'Protein',
                          population: profile.targetProtein! * 4,
                          color: '#0A84FF',
                          legendFontColor: '#E5E5E7',
                          legendFontSize: 13,
                        },
                        {
                          name: 'Carbs',
                          population: profile.targetCarbs! * 4,
                          color: '#34C759',
                          legendFontColor: '#E5E5E7',
                          legendFontSize: 13,
                        },
                        {
                          name: 'Fat',
                          population: profile.targetFat! * 9,
                          color: '#FF9F0A',
                          legendFontColor: '#E5E5E7',
                          legendFontSize: 13,
                        },
                      ]}
                      width={Dimensions.get('window').width - 80}
                      height={220}
                      chartConfig={{
                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(229, 229, 231, ${opacity})`,
                        propsForLabels: {
                          fontSize: 15,
                          fontWeight: '700',
                        },
                      }}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      center={[10, 10]}
                      hasLegend={true}
                      absolute={false}
                      style={{
                        marginVertical: 8,
                      }}
                    />
                  </View>
                </ScrollView>
                
                {/* Pagination Dots */}
                <View style={styles.paginationDots}>
                  {[0, 1].map((index) => (
                    <Pressable
                      key={index}
                      onPress={() => {
                        chartScrollViewRef.current?.scrollTo({
                          x: index * (Dimensions.get('window').width - 40),
                          animated: true,
                        });
                        setCurrentChartIndex(index);
                      }}
                      style={[
                        styles.dot,
                        currentChartIndex === index && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Weekly Progress Preview Chart */}
              <View style={styles.chartContainer}>
                <ThemedText style={styles.chartTitle}>Weekly Target Tracking</ThemedText>
                <LineChart
                  data={{
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                      {
                        data: [
                          profile.targetCalories! * 0.92,
                          profile.targetCalories! * 1.05,
                          profile.targetCalories! * 0.98,
                          profile.targetCalories! * 1.02,
                          profile.targetCalories! * 0.95,
                          profile.targetCalories! * 1.08,
                          profile.targetCalories! * 0.88,
                        ],
                        color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
                        strokeWidth: 2,
                      },
                    ],
                    legend: ['Calorie Target'],
                  }}
                  width={Dimensions.get('window').width - 80}
                  height={200}
                  chartConfig={{
                    backgroundColor: '#1C1C1E',
                    backgroundGradientFrom: '#1C1C1E',
                    backgroundGradientTo: '#2C2C2E',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(229, 229, 231, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '3',
                      stroke: '#0A84FF',
                      fill: '#1C1C1E',
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                      stroke: 'rgba(255, 255, 255, 0.1)',
                      strokeWidth: 1,
                    },
                    propsForLabels: {
                      fontSize: 12,
                      fontWeight: '600',
                    },
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  withInnerLines={true}
                  withOuterLines={true}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  withVerticalLabels={true}
                  withHorizontalLabels={true}
                  withDots={true}
                  withShadow={true}
                  fromZero={false}
                />
                <ThemedText style={styles.chartNote}>
                  Sample data - Track your actual progress in the Meals tab
                </ThemedText>
              </View>

              <View style={styles.targetsGrid}>
                <View style={[styles.targetCard, styles.targetCardCalories]}>
                  <View style={styles.targetIconContainer}>
                    <ThemedText style={styles.targetIcon}>🔥</ThemedText>
                  </View>
                  <ThemedText style={styles.targetValue}>{profile.targetCalories}</ThemedText>
                  <ThemedText style={styles.targetLabel}>Calories</ThemedText>
                  <View style={styles.targetProgressBar}>
                    <View style={[styles.targetProgressFill, { width: '100%', backgroundColor: '#FF453A' }]} />
                  </View>
                </View>
                <View style={[styles.targetCard, styles.targetCardProtein]}>
                  <View style={styles.targetIconContainer}>
                    <ThemedText style={styles.targetIcon}>💪</ThemedText>
                  </View>
                  <ThemedText style={styles.targetValue}>{profile.targetProtein}g</ThemedText>
                  <ThemedText style={styles.targetLabel}>Protein</ThemedText>
                  <View style={styles.targetProgressBar}>
                    <View style={[styles.targetProgressFill, { width: '100%', backgroundColor: '#0A84FF' }]} />
                  </View>
                </View>
                <View style={[styles.targetCard, styles.targetCardCarbs]}>
                  <View style={styles.targetIconContainer}>
                    <ThemedText style={styles.targetIcon}>🌾</ThemedText>
                  </View>
                  <ThemedText style={styles.targetValue}>{profile.targetCarbs}g</ThemedText>
                  <ThemedText style={styles.targetLabel}>Carbs</ThemedText>
                  <View style={styles.targetProgressBar}>
                    <View style={[styles.targetProgressFill, { width: '100%', backgroundColor: '#34C759' }]} />
                  </View>
                </View>
                <View style={[styles.targetCard, styles.targetCardFat]}>
                  <View style={styles.targetIconContainer}>
                    <ThemedText style={styles.targetIcon}>🥑</ThemedText>
                  </View>
                  <ThemedText style={styles.targetValue}>{profile.targetFat}g</ThemedText>
                  <ThemedText style={styles.targetLabel}>Fat</ThemedText>
                  <View style={styles.targetProgressBar}>
                    <View style={[styles.targetProgressFill, { width: '100%', backgroundColor: '#FF9F0A' }]} />
                  </View>
                </View>
              </View>
              
              {needsRecalculation && (
                <>
                  <View style={styles.warningContainer}>
                    <ThemedText style={styles.warningText}>
                      ⚠️ Your profile has changed. Consider recalculating your nutrition targets.
                    </ThemedText>
                  </View>
                  
                  {!hasEnvApiKey && (
                    <View style={styles.inputGroup}>
                      <ThemedText style={styles.label}>OpenAI API Key (for recalculation)</ThemedText>
                      <TextInput
                        style={styles.input}
                        value={openaiApiKey}
                        onChangeText={setOpenaiApiKey}
                        placeholder="sk-..."
                        placeholderTextColor="#666"
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>
                  )}
                  
                  <Pressable
                    style={({ pressed }) => [
                      styles.calculateButton,
                      pressed && styles.calculateButtonPressed,
                      isCalculatingTargets && styles.calculateButtonDisabled,
                    ]}
                    onPress={handleCalculateTargets}
                    disabled={isCalculatingTargets}>
                    {isCalculatingTargets ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <ThemedText style={styles.calculateButtonText}>Recalculate Targets</ThemedText>
                    )}
                  </Pressable>
                </>
              )}
            </>
          ) : (
            <>
              <View style={styles.infoContainer}>
                <ThemedText style={styles.infoText}>
                  Calculate your personalized daily nutrition targets using AI.
                </ThemedText>
              </View>
              
              {!hasEnvApiKey && (
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>OpenAI API Key</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={openaiApiKey}
                    onChangeText={setOpenaiApiKey}
                    placeholder="sk-..."
                    placeholderTextColor="#666"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <ThemedText style={styles.helperText}>
                    Your API key is used once and not stored. Get one at platform.openai.com
                  </ThemedText>
                </View>
              )}
              
              <Pressable
                style={({ pressed }) => [
                  styles.calculateButton,
                  pressed && styles.calculateButtonPressed,
                  isCalculatingTargets && styles.calculateButtonDisabled,
                ]}
                onPress={handleCalculateTargets}
                disabled={isCalculatingTargets}>
                {isCalculatingTargets ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.calculateButtonText}>Calculate Targets</ThemedText>
                )}
              </Pressable>
            </>
          )}
        </View>

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
    marginTop: 8,
  },
  targetCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 120,
  },
  targetCardCalories: {
    borderColor: 'rgba(255, 69, 58, 0.4)',
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
  },
  targetCardProtein: {
    borderColor: 'rgba(10, 132, 255, 0.4)',
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
  },
  targetCardCarbs: {
    borderColor: 'rgba(52, 199, 89, 0.4)',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  targetCardFat: {
    borderColor: 'rgba(255, 159, 10, 0.4)',
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
  },
  targetIconContainer: {
    marginBottom: 6,
  },
  targetIcon: {
    fontSize: 24,
  },
  targetValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  targetLabel: {
    fontSize: 11,
    color: '#A0A0A0',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  targetProgressBar: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  targetProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  swipableChartWrapper: {
    marginBottom: 24,
  },
  chartScrollView: {
    width: '100%',
  },
  chartScrollContent: {
    alignItems: 'flex-start',
  },
  chartPage: {
    width: Dimensions.get('window').width - 40,
    marginBottom: 0,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#0A84FF',
    width: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  chartNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoContainer: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
    marginBottom: 16,
  },
  infoText: {
    color: '#0A84FF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.3)',
    marginTop: 16,
  },
  warningText: {
    color: '#FF9F0A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    lineHeight: 16,
  },
  calculateButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  calculateButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  calculateButtonDisabled: {
    opacity: 0.5,
  },
  calculateButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
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
