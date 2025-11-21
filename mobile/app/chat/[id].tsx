import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const MESSAGE_TEMPLATES = [
  "Hey! I'd love to collaborate with you.",
  "Your content is amazing! Let's work together.",
  "I think we'd make a great collab. Interested?",
  "Would you be open to a collaboration?",
  "Let's create something awesome together!",
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadMessages();
    loadOtherUser();
    
    const subscription = supabase
      .channel(`chat:${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${id}.or.receiver_id=eq.${id}`,
      }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id}.and.receiver_id.eq.${id},sender_id.eq.${id}.and.receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Mark as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', id)
        .eq('receiver_id', user?.id)
        .eq('read', false);
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const loadOtherUser = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setOtherUser(data);
    } catch (error: any) {
      console.error('Error loading user:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          receiver_id: id,
          content: content.trim(),
        });

      if (error) throw error;
      setMessage('');
      setShowTemplates(false);
      loadMessages();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    }
  };

  const sendQuickLink = async (link: string) => {
    await sendMessage(`Check this out: ${link}`);
  };

  const useTemplate = (template: string) => {
    setMessage(template);
    setShowTemplates(false);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === user?.id;
    return (
      <View style={[styles.messageContainer, isMe && styles.messageContainerMe]}>
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser?.name || 'User'}</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
        <TouchableOpacity onPress={() => router.push(`/profile-view/${id}`)}>
          <Ionicons name="person-circle-outline" size={24} color="#667eea" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {showTemplates && (
        <View style={styles.templatesContainer}>
          <Text style={styles.templatesTitle}>Quick Messages</Text>
          {MESSAGE_TEMPLATES.map((template, index) => (
            <TouchableOpacity
              key={index}
              style={styles.templateItem}
              onPress={() => useTemplate(template)}
            >
              <Text style={styles.templateText}>{template}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.templateButton}
          onPress={() => setShowTemplates(!showTemplates)}
        >
          <Ionicons name="chatbubbles-outline" size={20} color="#667eea" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          multiline
          onSubmitEditing={() => sendMessage(message)}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => sendMessage(message)}
          disabled={!message.trim()}
        >
          <Ionicons name="send" size={20} color={message.trim() ? "#667eea" : "#ccc"} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => {
            Alert.prompt(
              'Send Link',
              'Enter URL:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Send',
                  onPress: (link) => link && sendQuickLink(link),
                },
              ],
              'plain-text'
            );
          }}
        >
          <Ionicons name="link" size={20} color="#667eea" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 12,
    color: '#4caf50',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  messageContainerMe: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  messageBubbleMe: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  messageTextMe: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.8)',
  },
  templatesContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 12,
    maxHeight: 200,
  },
  templatesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  templateItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  templateText: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  templateButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    padding: 8,
  },
  linkButton: {
    padding: 8,
  },
});

