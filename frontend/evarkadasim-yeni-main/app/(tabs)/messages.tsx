import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ArrowLeft } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { ChatMessage } from '@/components/ChatMessage';
import { useMatches } from '@/hooks/useMatches';
import { useMessages } from '@/hooks/useMessages';

function MatchAvatar({ uri, name, size }: { uri?: string; name: string; size: number }) {
  const [error, setError] = useState(false);
  const isCircle = size / 2;
  if (uri && !error) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: isCircle }}
        onError={() => setError(true)}
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: isCircle, backgroundColor: '#FCE7F3', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: '#EC4899' }}>
        {name[0]?.toUpperCase()}
      </Text>
    </View>
  );
}

export default function MessagesScreen() {
  const { matches, loading: matchesLoading } = useMatches();
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(matchId ?? null);
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { messages, loading: messagesLoading, currentUserId, sendMessage } = useMessages(selectedMatchId);

  const currentMatch = matches.find(m => m.id === selectedMatchId);

  // Yeni mesaj gelince sona kaydır
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    const text = messageText;
    const ok = await sendMessage(text);
    if (ok) {
      setMessageText('');
    } else {
      Alert.alert('Hata', 'Mesaj gönderilemedi. Tekrar dene.');
    }
  };

  if (selectedMatchId && currentMatch) {
    return (
      <LinearGradient colors={['#FDF2F8', '#F3E8FF']} style={styles.container}>
        <SafeAreaView style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSelectedMatchId(null)}>
              <ArrowLeft size={24} color="#111827" />
            </TouchableOpacity>
            <View style={styles.chatTitleRow}>
              <MatchAvatar uri={currentMatch.user.photos[0]} name={currentMatch.user.name} size={36} />
              <Text style={styles.chatTitle} numberOfLines={1}>{currentMatch.user.name}</Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          {messagesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#EC4899" />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>Henüz mesaj yok. İlk mesajı sen gönder!</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={({ item }) => (
                <ChatMessage message={item} isOwnMessage={item.senderId === currentUserId} />
              )}
              keyExtractor={item => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          <KeyboardAvoidingView
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 60}
            style={styles.inputContainer}
          >
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Mesaj yaz..."
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
    <LinearGradient colors={['#FDF2F8', '#F3E8FF']} style={styles.container}>
      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mesajlar</Text>
          <Text style={styles.subtitle}>{matches.length} sohbet</Text>
        </View>

        {matchesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#EC4899" />
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Send size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Henüz sohbet yok</Text>
            <Text style={styles.emptySubtitle}>Eşleştiğin kişilerle buradan yazışabilirsin!</Text>
          </View>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.matchItem} onPress={() => setSelectedMatchId(item.id)}>
                <MatchAvatar uri={item.user.photos[0]} name={item.user.name} size={52} />
                <View style={styles.matchInfo}>
                  <Text style={styles.matchName}>{item.user.name}</Text>
                  {item.lastMessage && (
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {item.lastMessage.content}
                    </Text>
                  )}
                </View>
                {item.isNewMatch && <View style={styles.newBadge} />}
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },
  header: { paddingTop: 20, paddingBottom: 20, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#6B7280' },
  listContainer: { paddingBottom: 20 },
  matchItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  matchInfo: { flex: 1 },
  matchName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  lastMessage: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  newBadge: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EC4899' },
  chatTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 24, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 16, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  emptyChatText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32 },
  chatContainer: { flex: 1 },
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
  backButton: { padding: 8 },
  chatTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  placeholder: { width: 40 },
  messagesList: { flex: 1, backgroundColor: '#fff' },
  messagesContent: { padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
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
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EC4899', alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: '#F3F4F6' },
});
