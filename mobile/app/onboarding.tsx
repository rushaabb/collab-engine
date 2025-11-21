import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube' },
  { id: 'tiktok', name: 'TikTok', icon: 'musical-notes' },
];

const COLLAB_GOALS = [
  'Grow Followers',
  'Increase Engagement',
  'Cross-Promote',
  'Create Content',
  'Build Community',
  'Monetize',
];

const COLLAB_TYPES = [
  'Shoutout',
  'Content Swap',
  'Joint Project',
  'Guest Feature',
  'Challenge',
];

const NICHE_TAGS = [
  'Fashion', 'Fitness', 'Food', 'Travel', 'Tech', 'Art', 'Music',
  'Gaming', 'Beauty', 'Lifestyle', 'Business', 'Education', 'Comedy',
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [manualTags, setManualTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [collabGoals, setCollabGoals] = useState<string[]>([]);
  const [preferences, setPreferences] = useState({
    radius: 50,
    niche: [] as string[],
    collabType: [] as string[],
  });
  const { user } = useAuth();
  const router = useRouter();

  const togglePlatform = (platformId: string) => {
    if (platforms.includes(platformId)) {
      setPlatforms(platforms.filter(p => p !== platformId));
    } else {
      setPlatforms([...platforms, platformId]);
    }
  };

  const addManualTag = () => {
    if (tagInput.trim() && !manualTags.includes(tagInput.trim())) {
      setManualTags([...manualTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeManualTag = (tag: string) => {
    setManualTags(manualTags.filter(t => t !== tag));
  };

  const toggleCollabGoal = (goal: string) => {
    if (collabGoals.includes(goal)) {
      setCollabGoals(collabGoals.filter(g => g !== goal));
    } else {
      setCollabGoals([...collabGoals, goal]);
    }
  };

  const toggleNiche = (niche: string) => {
    if (preferences.niche.includes(niche)) {
      setPreferences({
        ...preferences,
        niche: preferences.niche.filter(n => n !== niche),
      });
    } else {
      setPreferences({
        ...preferences,
        niche: [...preferences.niche, niche],
      });
    }
  };

  const toggleCollabType = (type: string) => {
    if (preferences.collabType.includes(type)) {
      setPreferences({
        ...preferences,
        collabType: preferences.collabType.filter(t => t !== type),
      });
    } else {
      setPreferences({
        ...preferences,
        collabType: [...preferences.collabType, type],
      });
    }
  };

  const handleNext = () => {
    if (step === 1 && platforms.length === 0) {
      Alert.alert('Required', 'Please select at least one platform');
      return;
    }
    if (step === 2 && collabGoals.length === 0) {
      Alert.alert('Required', 'Please select at least one collab goal');
      return;
    }
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkipImport = () => {
    setStep(2); // Skip to manual tags
  };

  const handleComplete = async () => {
    try {
      const allTags = [...preferences.niche, ...manualTags];
      const { error } = await supabase
        .from('profiles')
        .update({
          platforms,
          tags: allTags,
          collab_goals: collabGoals,
          search_radius: preferences.radius,
          preferred_collab_types: preferences.collabType,
          onboarding_complete: true,
        })
        .eq('id', user?.id);

      if (error) throw error;

      router.replace('/(tabs)/discovery');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {step === 1 && 'Select Your Platforms'}
          {step === 2 && 'Collab Goals'}
          {step === 3 && 'Add Tags'}
          {step === 4 && 'Preferences'}
        </Text>
        <Text style={styles.subtitle}>
          Step {step} of 4
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {step === 1 && (
          <>
            <View style={styles.platformsContainer}>
              {PLATFORMS.map(platform => (
                <TouchableOpacity
                  key={platform.id}
                  style={[
                    styles.platformCard,
                    platforms.includes(platform.id) && styles.platformCardSelected
                  ]}
                  onPress={() => togglePlatform(platform.id)}
                >
                  <Ionicons
                    name={platform.icon as any}
                    size={40}
                    color={platforms.includes(platform.id) ? '#fff' : '#667eea'}
                  />
                  <Text style={[
                    styles.platformText,
                    platforms.includes(platform.id) && styles.platformTextSelected
                  ]}>
                    {platform.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkipImport}
            >
              <Text style={styles.skipButtonText}>Skip Import, Add Tags Manually</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <View style={styles.optionsContainer}>
            {COLLAB_GOALS.map(goal => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.option,
                  collabGoals.includes(goal) && styles.optionSelected
                ]}
                onPress={() => toggleCollabGoal(goal)}
              >
                <Text style={[
                  styles.optionText,
                  collabGoals.includes(goal) && styles.optionTextSelected
                ]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 3 && (
          <>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add a tag"
                onSubmitEditing={addManualTag}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={addManualTag}>
                <Ionicons name="add" size={24} color="#667eea" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagsContainer}>
              {manualTags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeManualTag(tag)}>
                    <Ionicons name="close" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <Text style={styles.sectionLabel}>Or select from popular niches:</Text>
            <View style={styles.optionsContainer}>
              {NICHE_TAGS.map(niche => (
                <TouchableOpacity
                  key={niche}
                  style={[
                    styles.option,
                    preferences.niche.includes(niche) && styles.optionSelected
                  ]}
                  onPress={() => toggleNiche(niche)}
                >
                  <Text style={[
                    styles.optionText,
                    preferences.niche.includes(niche) && styles.optionTextSelected
                  ]}>
                    {niche}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceLabel}>Search Radius (miles)</Text>
              <Text style={styles.radiusValue}>{preferences.radius} miles</Text>
              <View style={styles.sliderContainer}>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => setPreferences({ ...preferences, radius: Math.max(10, preferences.radius - 10) })}
                >
                  <Ionicons name="remove" size={20} color="#667eea" />
                </TouchableOpacity>
                <View style={styles.sliderTrack}>
                  <View style={[styles.sliderFill, { width: `${(preferences.radius / 100) * 100}%` }]} />
                </View>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => setPreferences({ ...preferences, radius: Math.min(100, preferences.radius + 10) })}
                >
                  <Ionicons name="add" size={20} color="#667eea" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceLabel}>Preferred Collab Types</Text>
              <View style={styles.optionsContainer}>
                {COLLAB_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.option,
                      preferences.collabType.includes(type) && styles.optionSelected
                    ]}
                    onPress={() => toggleCollabType(type)}
                  >
                    <Text style={[
                      styles.optionText,
                      preferences.collabType.includes(type) && styles.optionTextSelected
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {step === 4 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  platformCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  platformCardSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  platformText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  platformTextSelected: {
    color: '#fff',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#667eea',
    fontSize: 14,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginRight: 8,
  },
  addTagButton: {
    padding: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    gap: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    marginTop: 8,
  },
  preferenceSection: {
    marginBottom: 24,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  radiusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 16,
    textAlign: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderButton: {
    padding: 8,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  nextButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
