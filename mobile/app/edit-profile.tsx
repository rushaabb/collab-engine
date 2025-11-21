import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const FOLLOWER_BUCKETS = [
  { label: '0-1K', value: '0-1k' },
  { label: '1K-10K', value: '1k-10k' },
  { label: '10K-50K', value: '10k-50k' },
  { label: '50K-100K', value: '50k-100k' },
  { label: '100K+', value: '100k+' },
];

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube' },
  { id: 'tiktok', name: 'TikTok', icon: 'musical-notes' },
];

const NICHE_TAGS = [
  'Fashion', 'Fitness', 'Food', 'Travel', 'Tech', 'Art', 'Music',
  'Gaming', 'Beauty', 'Lifestyle', 'Business', 'Education', 'Comedy',
];

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [platformHandles, setPlatformHandles] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [followerBucket, setFollowerBucket] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setName(data.name || '');
        setPhotoUri(data.photo_url);
        setPlatforms(data.platforms || []);
        setTags(data.tags || []);
        setFollowerBucket(data.follower_bucket || '');
        setPlatformHandles({
          instagram: data.instagram_handle || '',
          youtube: data.youtube_handle || '',
          tiktok: data.tiktok_handle || '',
        });
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const togglePlatform = (platformId: string) => {
    if (platforms.includes(platformId)) {
      setPlatforms(platforms.filter(p => p !== platformId));
    } else {
      setPlatforms([...platforms, platformId]);
    }
  };

  const updatePlatformHandle = (platform: string, handle: string) => {
    setPlatformHandles({ ...platformHandles, [platform]: handle });
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const toggleNicheTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        name,
        platforms,
        tags,
        follower_bucket: followerBucket,
      };

      if (photoUri) {
        updateData.photo_url = photoUri;
      }

      platforms.forEach(platform => {
        updateData[`${platform}_handle`] = platformHandles[platform] || null;
      });

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (error) throw error;
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Profile Photo</Text>
          <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="camera" size={40} color="#ccc" />
              </View>
            )}
            <View style={styles.editPhotoBadge}>
              <Ionicons name="create" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Platforms</Text>
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
                  size={32}
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
          {platforms.map(platform => (
            <View key={platform} style={styles.handleInputContainer}>
              <Text style={styles.handleLabel}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)} Handle
              </Text>
              <TextInput
                style={styles.handleInput}
                value={platformHandles[platform] || ''}
                onChangeText={(text) => updatePlatformHandle(platform, text)}
                placeholder={`@${platform}handle`}
                autoCapitalize="none"
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Follower Bucket</Text>
          <View style={styles.optionsContainer}>
            {FOLLOWER_BUCKETS.map(bucket => (
              <TouchableOpacity
                key={bucket.value}
                style={[
                  styles.option,
                  followerBucket === bucket.value && styles.optionSelected
                ]}
                onPress={() => setFollowerBucket(bucket.value)}
              >
                <Text style={[
                  styles.optionText,
                  followerBucket === bucket.value && styles.optionTextSelected
                ]}>
                  {bucket.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Niche/Style Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add a tag"
              onSubmitEditing={addTag}
            />
            <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
              <Ionicons name="add" size={24} color="#667eea" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(tag)}>
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
                  tags.includes(niche) && styles.optionSelected
                ]}
                onPress={() => toggleNicheTag(niche)}
              >
                <Text style={[
                  styles.optionText,
                  tags.includes(niche) && styles.optionTextSelected
                ]}>
                  {niche}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
  },
  editPhotoBadge: {
    position: 'absolute',
    bottom: 0,
    right: '40%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  platformsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  platformCard: {
    flex: 1,
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
  handleInputContainer: {
    marginBottom: 12,
  },
  handleLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  handleInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
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
    marginBottom: 12,
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
});
