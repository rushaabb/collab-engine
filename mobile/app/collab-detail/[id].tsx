import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function CollabDetailScreen() {
  const { id } = useLocalSearchParams();
  const [collab, setCollab] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [collaborator, setCollaborator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadCollab();
  }, [id]);

  const loadCollab = async () => {
    try {
      const { data, error } = await supabase
        .from('collabs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCollab(data);

      if (data.creator_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.creator_id)
          .single();
        setCreator(profileData);
      }

      if (data.collaborator_id) {
        const { data: collabData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.collaborator_id)
          .single();
        setCollaborator(collabData);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load collaboration');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (action: 'accept' | 'complete' | 'cancel') => {
    try {
      let updateData: any = {};
      
      if (action === 'accept') {
        updateData = {
          collaborator_id: user?.id,
          status: 'in_progress',
          accepted_at: new Date().toISOString(),
        };
      } else if (action === 'complete') {
        updateData = {
          status: 'completed',
          completed_at: new Date().toISOString(),
        };
      } else if (action === 'cancel') {
        updateData = {
          status: 'cancelled',
        };
      }

      const { error } = await supabase
        .from('collabs')
        .update(updateData)
        .eq('id', collab.id);

      if (error) throw error;

      // Update user stats
      if (action === 'complete') {
        await supabase.rpc('increment_completed_collabs', { user_id: user?.id });
      }

      Alert.alert('Success', `Collaboration ${action}ed!`);
      loadCollab();
    } catch (error: any) {
      Alert.alert('Error', error.message || `Failed to ${action} collaboration`);
    }
  };

  if (loading || !collab) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const isCreator = collab.creator_id === user?.id;
  const isCollaborator = collab.collaborator_id === user?.id;
  const canJoin = !isCreator && !isCollaborator && collab.status === 'pending';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collab Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{collab.title}</Text>
        <View style={[styles.statusBadge, styles[`status${collab.status}`]]}>
          <Text style={styles.statusText}>{collab.status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objective</Text>
          <Text style={styles.sectionContent}>{collab.objective || collab.description}</Text>
        </View>

        {collab.deliverables && collab.deliverables.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deliverables</Text>
            {collab.deliverables.map((deliverable: string, index: number) => (
              <View key={index} style={styles.deliverableItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
                <Text style={styles.deliverableText}>{deliverable}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who Posts</Text>
          <Text style={styles.sectionContent}>
            {collab.who_posts === 'creator' && 'Creator posts'}
            {collab.who_posts === 'collaborator' && 'Collaborator posts'}
            {collab.who_posts === 'both' && 'Both post'}
            {!collab.who_posts && 'Not specified'}
          </Text>
        </View>

        {collab.deadline && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deadline</Text>
            <View style={styles.deadlineContainer}>
              <Ionicons name="calendar" size={20} color="#667eea" />
              <Text style={styles.deadlineText}>
                {new Date(collab.deadline).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        )}

        {creator && (
          <TouchableOpacity
            style={styles.creatorCard}
            onPress={() => router.push(`/profile-view/${creator.id}`)}
          >
            <View style={styles.creatorAvatar}>
              <Text style={styles.creatorAvatarText}>
                {creator.name?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{creator.name}</Text>
              <Text style={styles.creatorMeta}>Creator</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}

        {collaborator && (
          <TouchableOpacity
            style={styles.creatorCard}
            onPress={() => router.push(`/profile-view/${collaborator.id}`)}
          >
            <View style={styles.creatorAvatar}>
              <Text style={styles.creatorAvatarText}>
                {collaborator.name?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{collaborator.name}</Text>
              <Text style={styles.creatorMeta}>Collaborator</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}

        {collab.required_skills && collab.required_skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Skills</Text>
            <View style={styles.tags}>
              {collab.required_skills.map((skill: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Confirm Buttons */}
        {canJoin && (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => handleConfirm('accept')}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.confirmButtonText}>Accept Collaboration</Text>
          </TouchableOpacity>
        )}

        {(isCreator || isCollaborator) && collab.status === 'in_progress' && (
          <>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => handleConfirm('complete')}
            >
              <Ionicons name="checkmark-done" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>Mark as Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                Alert.alert(
                  'Cancel Collaboration',
                  'Are you sure? This action cannot be undone.',
                  [
                    { text: 'No', style: 'cancel' },
                    { text: 'Yes', onPress: () => handleConfirm('cancel') },
                  ]
                );
              }}
            >
              <Ionicons name="close-circle" size={20} color="#ff4444" />
              <Text style={styles.cancelButtonText}>Cancel Collaboration</Text>
            </TouchableOpacity>
          </>
        )}

        {(isCreator || isCollaborator) && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => router.push(`/chat/${isCreator ? collab.collaborator_id : collab.creator_id}`)}
          >
            <Ionicons name="chatbubbles" size={20} color="#fff" />
            <Text style={styles.chatButtonText}>Open Chat</Text>
          </TouchableOpacity>
        )}

        {(isCreator || isCollaborator) && collab.status === 'in_progress' && (
          <TouchableOpacity
            style={styles.proofButton}
            onPress={() => router.push(`/add-proof/${collab.id}`)}
          >
            <Ionicons name="camera" size={20} color="#667eea" />
            <Text style={styles.proofButtonText}>Add Proof of Collab</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  statuspending: {
    backgroundColor: '#fff3cd',
  },
  statusin_progress: {
    backgroundColor: '#d1ecf1',
  },
  statuscompleted: {
    backgroundColor: '#d4edda',
  },
  statuscancelled: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  deliverableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  deliverableText: {
    fontSize: 16,
    color: '#333',
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deadlineText: {
    fontSize: 16,
    color: '#333',
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  creatorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creatorAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  creatorMeta: {
    fontSize: 12,
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
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#4caf50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ff4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },
  chatButton: {
    flexDirection: 'row',
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  proofButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  proofButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
});
