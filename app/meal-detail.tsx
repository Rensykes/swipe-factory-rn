import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppSelector } from '@/store/hooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function MealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meals = useAppSelector((state) => state.meals.meals);
  
  const meal = meals.find((m) => m.idMeal === id);

  if (!meal) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </Pressable>
        </View>
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Meal not found</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const handleOpenYoutube = async () => {
    if (meal.strYoutube) {
      try {
        const supported = await Linking.canOpenURL(meal.strYoutube);
        if (supported) {
          await Linking.openURL(meal.strYoutube);
        } else {
          console.log("Can't open URL:", meal.strYoutube);
        }
      } catch (error) {
        console.error('Error opening YouTube:', error);
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        
        <Image
          source={{ uri: meal.strMealThumb }}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>← Back</ThemedText>
          </Pressable>

          <ThemedText type="title" style={styles.title}>
            {meal.strMeal}
          </ThemedText>

          <View style={styles.badges}>
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{meal.strCategory}</ThemedText>
            </View>
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{meal.strArea}</ThemedText>
            </View>
            {meal.strTags && (
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>{meal.strTags}</ThemedText>
              </View>
            )}
          </View>

          {meal.strYoutube && (
            <Pressable
              style={({ pressed }) => [
                styles.youtubeButton,
                pressed && styles.youtubeButtonPressed,
              ]}
              onPress={handleOpenYoutube}>
              <ThemedText style={styles.youtubeButtonText}>▶ Watch on YouTube</ThemedText>
            </Pressable>
          )}

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Ingredients</ThemedText>
            <View style={styles.ingredientsList}>
              {meal.ingredients.map((ing, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <View style={styles.ingredientBullet} />
                  <ThemedText style={styles.ingredientText}>
                    {ing.ingredient}
                  </ThemedText>
                  <ThemedText style={styles.measureText}>{ing.measure}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Instructions</ThemedText>
            <ThemedText style={styles.instructions}>
              {meal.strInstructions}
            </ThemedText>
          </View>

          <View style={styles.bottomSpacer} />
        </View>
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
  heroImage: {
    width: '100%',
    height: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  content: {
    padding: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    marginBottom: 16,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A84FF',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    color: '#FFFFFF',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A84FF',
  },
  youtubeButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  youtubeButtonPressed: {
    opacity: 0.8,
  },
  youtubeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#FFFFFF',
  },
  ingredientsList: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0A84FF',
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 16,
    color: '#E5E5E7',
    flex: 1,
  },
  measureText: {
    fontSize: 15,
    color: '#A0A0A0',
    fontWeight: '500',
  },
  instructions: {
    fontSize: 16,
    lineHeight: 26,
    color: '#E5E5E7',
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  bottomSpacer: {
    height: 40,
  },
});
