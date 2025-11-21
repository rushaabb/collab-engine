import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const SKILLS = [
  'Design', 'Development', 'Writing', 'Photography', 'Video Editing',
  'Music Production', 'Marketing', 'Business', 'Strategy', 'Content Creation'
];

const COLLAB_TYPES = [
  'Shoutout',
  'Content Swap',
  'Joint Project',
  'Guest Feature',
  'Challenge',
];

export default function CreateCollabScreen() {
  const params = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [deliverableInput, setDeliverableInput] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [collabType, setCollabType] = useState('');
  const [whoPosts, setWhoPosts] = useState<'creator' | 'collaborator' | 'both'>('both');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const toggleSkill = (skill: string) => {
    if (requiredSkills.includes(skill)) {
      setRequiredSkills(requiredSkills.filter(s => s !== skill));
    } else {
      setRequiredSkills([...requiredSkills, skill]);
    }
  };

  const addDeliverable = () => {
    if (deliverableInput.trim() && !deliverables.includes(deliverableInput.trim())) {
      setDeliverables([...deliverables, deliverableInput.trim()]);
      setDeliverableInput('');
    }
  };

  const removeDeliverable = (deliverable: string) => {
    setDeliverables(deliverables.filter(d => d !== deliverable));
  };

  const handleCreate = async () => {
    if (!title.trim() || !objective.trim()) {
      Alert.alert('Error', 'Please fill in title and objective');
      return;
    }

    if (requiredSkills.length === 0) {
      Alert.alert('Error', 'Please select at least one required skill');
      return;
    }

    if (!collabType) {
      Alert.alert('Error', 'Please select a collaboration type');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('collabs')
        .insert({
          title,
          objective,
          description: objective, // For backward compatibility
          deliverables,
          required_skills: requiredSkills,
          collab_type: collabType,
          who_posts: whoPosts,
          deadline: deadline || null,
          creator_id: user?.id,
          collaborator_id: params.collaboratorId || null,
          status: params.collaboratorId ? 'pending' : 'pending',
        });

      if (error) throw error;

      Alert.alert('Success', 'Collaboration created!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create collaboration');
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
        <Text style={styles.title}>Create Collab</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Collaboration title"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Objective</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={objective}
            onChangeText={setObjective}
            placeholder="What do you want to achieve with this collaboration?"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Deliverables</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={deliverableInput}
              onChangeText={setDeliverableInput}
              placeholder="Add a deliverable"
              onSubmitEditing={addDeliverable}
            />
            <TouchableOpacity style={styles.addTagButton} onPress={addDeliverable}>
              <Ionicons name="add" size={24} color="#667eea" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {deliverables.map((deliverable, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{deliverable}</Text>
                <TouchableOpacity onPress={() => removeDeliverable(deliverable)}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Required Skills</Text>
          <View style={styles.optionsContainer}>
            {SKILLS.map(skill => (
              <TouchableOpacity
                key={skill}
                style={[
                  styles.option,
                  requiredSkills.includes(skill) && styles.optionSelected
                ]}
                onPress={() => toggleSkill(skill)}
              >
                <Text style={[
                  styles.optionText,
                  requiredSkills.includes(skill) && styles.optionTextSelected
                ]}>
                  {skill}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Collab Type</Text>
          <View style={styles.optionsContainer}>
            {COLLAB_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.option,
                  collabType === type && styles.optionSelected
                ]}
                onPress={() => setCollabType(type)}
              >
                <Text style={[
                  styles.optionText,
                  collabType === type && styles.optionTextSelected
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Who Posts</Text>
          <View style={styles.radioContainer}>
            {(['creator', 'collaborator', 'both'] as const).map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.radioOption,
                  whoPosts === option && styles.radioOptionSelected
                ]}
                onPress={() => setWhoPosts(option)}
              >
                <View style={styles.radio}>
                  {whoPosts === option && <View style={styles.radioSelected} />}
                </View>
                <Text style={[
                  styles.radioText,
                  whoPosts === option && styles.radioTextSelected
                ]}>
                  {option === 'creator' ? 'Creator posts' : option === 'collaborator' ? 'Collaborator posts' : 'Both post'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Deadline (Optional)</Text>
          <TextInput
            style={styles.input}
            value={deadline}
            onChangeText={setDeadline}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Collaboration'}
          </Text>
        </TouchableOpacity>
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
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  radioContainer: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  radioOptionSelected: {
    backgroundColor: '#f0f4ff',
    borderColor: '#667eea',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#667eea',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  radioTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
