import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ArrowLeft } from 'lucide-react-native';
import { ChatMessage } from '@/components/ChatMessage';
import { useMatches } from '@/hooks/useMatches';
import { Message } from '@/types';

export default function MessagesScreen() {
  const { matches } = useMatches();
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: '1',
      content: 'Hey! Thanks for the like 😊',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: 'text',
      isRead: true
    },
    {
      id: '2',
      senderId: 'me',
      content: 'Hi Emma! I think we could be great roommates based on your profile',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      type: 'text',
      isRead: true
    },
    {
      id: '3',
      senderId: '1',
      content: 'Thank you! What\'s your ideal living situation?',
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      type: 'text',
      isRead: true
    },
    {
      id: '4',
      senderId: 'me',
      content: 'I\'m looking for a clean, quiet space where we can both feel comfortable. Maybe we could schedule a video call?',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      type: 'text',
      isRead: true
    }
  ]);

  const currentMatch = matches.find(m => m.id === selectedMatch);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedMatch) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      content: messageText.trim(),
      timestamp: new Date(),
      type: 'text',
      isRead: true
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageText('');
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatMessage message={item} isOwnMessage={item.senderId === 'me'} />
  );

  const renderMatch = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.matchItem}
      onPress={() => setSelectedMatch(item.id)}
    >
      <Text style={styles.matchName}>{item.user.name}</Text>
    </TouchableOpacity>
  );

  if (selectedMatch && currentMatch) {
    return (
      <LinearGradient
        colors={['#FDF2F8', '#F3E8FF']}
        style={styles.container}
      >
        <SafeAreaView style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setSelectedMatch(null)}
            >
              <ArrowLeft size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.chatTitle}>{currentMatch.user.name}</Text>
            <View style={styles.placeholder} />
          </View>

          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          />

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputContainer}
          >
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!messageText.trim()}
              >
                <Send size={20} color={messageText.trim() ? '#fff' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FDF2F8', '#F3E8FF']}
      style={styles.container}
    >
      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>
            {matches.length} conversations
          </Text>
        </View>

        {matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Send size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              Match with potential roommates to start chatting!
            </Text>
          </View>
        ) : (
          <FlatList
            data={matches}
            renderItem={renderMatch}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  listContainer: {
    paddingBottom: 20,
  },
  matchItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesContent: {
    padding: 16,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
});