import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const { user, signOut } = useAuth();
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
      setProfile(data);
      setPhotoUri(data.photo_url);
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
      // In a real app, upload to Supabase Storage
      setPhotoUri(result.assets[0].uri);
      // Update profile
      await supabase
        .from('profiles')
        .update({ photo_url: result.assets[0].uri })
        .eq('id', user?.id);
    }
  };

  const calculateReliabilityScore = () => {
    if (!profile) return 0;
    const completedCollabs = profile.completed_collabs || 0;
    const proofs = profile.proofs_count || 0;
    const abandoned = profile.abandoned_collabs || 0;
    const responseTime = profile.avg_response_time || 0;
    
    let score = (completedCollabs * 10) + (proofs * 5);
    score -= abandoned * 15;
    if (responseTime < 24) score += 10; // Fast responder bonus
    return Math.max(0, Math.min(100, score));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity
          onPress={() => router.push('/edit-profile')}
          style={styles.editButton}
        >
          <Ionicons name="create-outline" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>

      {profile && (
        <>
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={pickImage}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {profile.name?.charAt(0) || '?'}
                  </Text>
                </View>
              )}
              <View style={styles.editPhotoBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>

            <View style={styles.reliabilityCard}>
              <Text style={styles.reliabilityLabel}>Reliability Score</Text>
              <Text style={styles.reliabilityScore}>
                {calculateReliabilityScore()}
              </Text>
              <View style={styles.reliabilityBar}>
                <View
                  style={[
                    styles.reliabilityFill,
                    { width: `${calculateReliabilityScore()}%` },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Platform Links</Text>
            {profile.platforms?.map((platform: string) => (
              <View key={platform} style={styles.platformLink}>
                <Ionicons
                  name={platform === 'instagram' ? 'logo-instagram' : platform === 'youtube' ? 'logo-youtube' : 'musical-notes'}
                  size={20}
                  color="#667eea"
                />
                <Text style={styles.platformText}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </Text>
                {profile[`${platform}_handle`] && (
                  <Text style={styles.handleText}>@{profile[`${platform}_handle`]}</Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Follower Bucket</Text>
            <Text style={styles.followerBucket}>
              {profile.follower_bucket || 'Not set'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Niche/Style Tags</Text>
            <View style={styles.tags}>
              {profile.tags?.map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.statsSection}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.active_collabs || 0}</Text>
              <Text style={styles.statLabel}>Active Collabs</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.completed_collabs || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.proofs_count || 0}</Text>
              <Text style={styles.statLabel}>Proofs</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
  },
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  editPhotoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  reliabilityCard: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  reliabilityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reliabilityScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 12,
  },
  reliabilityBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  reliabilityFill: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  platformLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  platformText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  handleText: {
    fontSize: 14,
    color: '#666',
  },
  followerBucket: {
    fontSize: 16,
    color: '#666',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  logoutButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ff4444',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
