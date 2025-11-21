import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileViewScreen() {
  const { id } = useLocalSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
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
    if (responseTime < 24) score += 10;
    return Math.max(0, Math.min(100, score));
  };

  const calculateEngagementTier = () => {
    if (!profile) return 'Beginner';
    const score = calculateReliabilityScore();
    if (score >= 80) return 'Elite';
    if (score >= 60) return 'Pro';
    if (score >= 40) return 'Rising';
    return 'Beginner';
  };

  const calculateConsistencyScore = () => {
    if (!profile) return 0;
    const totalCollabs = (profile.completed_collabs || 0) + (profile.abandoned_collabs || 0);
    if (totalCollabs === 0) return 0;
    return Math.round(((profile.completed_collabs || 0) / totalCollabs) * 100);
  };

  const calculateGrowthTrend = () => {
    // Simplified - would use actual follower data in production
    return '+12%';
  };

  const calculateVibeMatch = () => {
    if (!profile || !user) return [];
    // Simple matching based on tags and goals
    const matches = [];
    if (profile.tags && profile.tags.length > 0) {
      matches.push(`${profile.tags.length} shared interests`);
    }
    if (profile.collab_goals && profile.collab_goals.length > 0) {
      matches.push('Similar goals');
    }
    return matches;
  };

  const handleMessage = async () => {
    if (!user || !profile) return;
    router.push(`/chat/${profile.id}`);
  };

  const handleCollab = () => {
    router.push({
      pathname: '/create-collab',
      params: { collaboratorId: profile.id },
    });
  };

  if (loading || !profile) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const engagementTier = calculateEngagementTier();
  const consistencyScore = calculateConsistencyScore();
  const growthTrend = calculateGrowthTrend();
  const vibeMatches = calculateVibeMatch();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.profileSection}>
        {profile.photo_url ? (
          <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.name?.charAt(0) || '?'}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{profile.name}</Text>

        <View style={styles.engagementBadge}>
          <Text style={styles.engagementText}>{engagementTier}</Text>
        </View>
      </View>

      <View style={styles.metricsSection}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{calculateReliabilityScore()}</Text>
          <Text style={styles.metricLabel}>Reliability</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{consistencyScore}%</Text>
          <Text style={styles.metricLabel}>Consistency</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{growthTrend}</Text>
          <Text style={styles.metricLabel}>Growth</Text>
        </View>
      </View>

      {vibeMatches.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vibe Match</Text>
          {vibeMatches.map((match, index) => (
            <View key={index} style={styles.vibeMatchItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
              <Text style={styles.vibeMatchText}>{match}</Text>
            </View>
          ))}
        </View>
      )}

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
        <Text style={styles.sectionTitle}>Niche/Style Tags</Text>
        <View style={styles.tags}>
          {profile.tags?.map((tag: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Follower Bucket</Text>
        <Text style={styles.followerBucket}>
          {profile.follower_bucket || 'Not set'}
        </Text>
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

      {user?.id !== profile.id && (
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={handleMessage}
          >
            <Ionicons name="chatbubbles" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.collabButton}
            onPress={handleCollab}
          >
            <Ionicons name="people" size={20} color="#667eea" />
            <Text style={styles.collabButtonText}>Let's Collab</Text>
          </TouchableOpacity>
        </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  engagementBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#667eea',
  },
  engagementText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  metricsSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
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
  vibeMatchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  vibeMatchText: {
    fontSize: 14,
    color: '#333',
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
  followerBucket: {
    fontSize: 16,
    color: '#666',
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
  actionsSection: {
    padding: 20,
    gap: 12,
  },
  messageButton: {
    flexDirection: 'row',
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  collabButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  collabButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
});
