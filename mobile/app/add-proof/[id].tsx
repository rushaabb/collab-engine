import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function AddProofScreen() {
  const { id } = useLocalSearchParams();
  const [proofLink, setProofLink] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const validateLink = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const checkTimestamp = (url: string) => {
    // Basic timestamp check - in production, would parse post date from platform API
    // For now, we'll just check if it's a valid platform URL
    const instagramPattern = /instagram\.com/;
    const youtubePattern = /youtube\.com|youtu\.be/;
    const tiktokPattern = /tiktok\.com/;
    
    return instagramPattern.test(url) || youtubePattern.test(url) || tiktokPattern.test(url);
  };

  const handleSubmit = async () => {
    if (!proofLink.trim()) {
      Alert.alert('Error', 'Please enter a proof link');
      return;
    }

    if (!validateLink(proofLink)) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    if (!checkTimestamp(proofLink)) {
      Alert.alert(
        'Warning',
        'This link may not be from a supported platform (Instagram, YouTube, TikTok). Continue anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: submitProof },
        ]
      );
      return;
    }

    submitProof();
  };

  const submitProof = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('proofs')
        .insert({
          collab_id: id,
          user_id: user?.id,
          proof_link: proofLink.trim(),
          submitted_at: new Date().toISOString(),
          verified: false, // Would be verified by platform API in production
        });

      if (error) throw error;

      // Update collab proof count
      await supabase.rpc('increment_proofs_count', { user_id: user?.id });

      Alert.alert('Success', 'Proof submitted! It will be verified shortly.');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit proof');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Proof</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Submit Proof of Collaboration</Text>
        <Text style={styles.subtitle}>
          Share a link to your post, video, or content that proves this collaboration happened.
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Proof Link</Text>
          <TextInput
            style={styles.input}
            value={proofLink}
            onChangeText={setProofLink}
            placeholder="https://instagram.com/p/..."
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            Supported platforms: Instagram, YouTube, TikTok
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#667eea" />
          <Text style={styles.infoText}>
            Your proof will be verified to ensure it matches the collaboration timeline and requirements.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Proof'}
          </Text>
        </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#999',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

