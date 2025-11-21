import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { rankCollabs } from '@/lib/ranking';
import { Collab, User } from '@/lib/supabase-types';
import CollabCard from '@/components/CollabCard';

export default function DiscoveryScreen() {
  const [recommendedCollabs, setRecommendedCollabs] = useState<any[]>([]);
  const [nearbyCollabs, setNearbyCollabs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'recommended' | 'nearby'>('recommended');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadCollabs();
  }, [activeTab, user]);

  const loadCollabs = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Get current user profile
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // Load all pending collabs (excluding user's own)
      const { data: allCollabs, error: collabsError } = await supabase
        .from('collabs')
        .select('*')
        .neq('creator1', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(100);

      if (collabsError) throw collabsError;

      if (!allCollabs || allCollabs.length === 0) {
        setRecommendedCollabs([]);
        setNearbyCollabs([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Get unique creator IDs
      const creatorIds = [...new Set(allCollabs.map(c => c.creator1))];

      // Load all creators
      const { data: creators, error: creatorsError } = await supabase
        .from('users')
        .select('*')
        .in('id', creatorIds);

      if (creatorsError) throw creatorsError;

      // Create creator map for quick lookup
      const creatorMap = new Map<string, User>();
      creators?.forEach(creator => {
        creatorMap.set(creator.id, creator);
      });

      // Rank collabs using rule-based algorithm
      const ranked = rankCollabs(
        currentUser as User,
        allCollabs as Collab[],
        creatorMap
      );

      // Add creator names to collabs for display
      const rankedWithCreators = ranked.map(collab => {
        const creator = creatorMap.get(collab.creator1);
        return {
          ...collab,
          creator_name: creator?.name || 'Unknown',
        };
      });

      setRecommendedCollabs(rankedWithCreators.slice(0, 50));

      // For nearby, use same data but could filter by location in future
      // For now, just show all collabs sorted by creation date
      const nearbyWithCreators = allCollabs
        .sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .map(collab => {
          const creator = creatorMap.get(collab.creator1);
          return {
            ...collab,
            creator_name: creator?.name || 'Unknown',
          };
        });

      setNearbyCollabs(nearbyWithCreators.slice(0, 50));
    } catch (error: any) {
      console.error('Error loading collabs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCollabs();
  };

  const collabs = activeTab === 'recommended' ? recommendedCollabs : nearbyCollabs;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discovery</Text>
        <TouchableOpacity
          onPress={() => router.push('/create-collab')}
          style={styles.createButton}
        >
          <Ionicons name="add" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recommended' && styles.tabActive]}
          onPress={() => setActiveTab('recommended')}
        >
          <Text style={[styles.tabText, activeTab === 'recommended' && styles.tabTextActive]}>
            Recommended
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nearby' && styles.tabActive]}
          onPress={() => setActiveTab('nearby')}
        >
          <Text style={[styles.tabText, activeTab === 'nearby' && styles.tabTextActive]}>
            Near You
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={collabs}
        renderItem={({ item }) => (
          <CollabCard
            collab={item}
            onPress={() => router.push(`/collab-detail/${item.id}`)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="compass-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No collaborations found</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/create-collab')}
            >
              <Text style={styles.emptyButtonText}>Create First Collab</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
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
  createButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
  },
  tabTextActive: {
    color: '#667eea',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#667eea',
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
