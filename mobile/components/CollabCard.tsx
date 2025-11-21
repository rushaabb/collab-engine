import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseCardData } from '@/lib/supabase-helpers';

interface CollabCardProps {
  collab: any;
  onPress: () => void;
}

export default function CollabCard({ collab, onPress }: CollabCardProps) {
  const cardData = parseCardData(collab.card_data || {});
  const title = cardData.title || 'Untitled Collaboration';
  const description = cardData.description || cardData.objective || '';
  const tags = cardData.tags || [];
  const deadline = cardData.deadline;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={[styles.statusBadge, styles[`status${collab.status}`]]}>
          <Text style={styles.statusText}>{collab.status}</Text>
        </View>
      </View>
      {description && (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      )}
      {tags.length > 0 && (
        <View style={styles.tags}>
          {tags.slice(0, 3).map((tag: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.footer}>
        <View style={styles.creatorInfo}>
          <Ionicons name="person" size={16} color="#999" />
          <Text style={styles.creatorText}>
            {collab.creator_name || 'Creator'}
          </Text>
        </View>
        {deadline && (
          <Text style={styles.deadline}>
            {new Date(deadline).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creatorText: {
    fontSize: 12,
    color: '#999',
  },
  deadline: {
    fontSize: 12,
    color: '#999',
  },
});
