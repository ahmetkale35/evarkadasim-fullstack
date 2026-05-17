import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check, CheckCheck } from 'lucide-react-native';
import { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
}

export function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <View style={[styles.container, isOwnMessage && styles.ownMessage]}>
      <View style={[styles.bubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
        <Text style={[styles.text, isOwnMessage ? styles.ownText : styles.otherText]}>
          {message.content}
        </Text>
      </View>
      <View style={[styles.meta, isOwnMessage ? styles.ownMeta : styles.otherMeta]}>
        <Text style={styles.time}>{formatTime(message.timestamp)}</Text>
        {isOwnMessage && (
          message.isRead
            ? <CheckCheck size={14} color="#EC4899" style={styles.tick} />
            : <Check size={14} color="#9CA3AF" style={styles.tick} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  ownBubble: {
    backgroundColor: '#EC4899',
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 6,
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#111827',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otherMeta: {
    marginLeft: 16,
  },
  ownMeta: {
    marginRight: 16,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tick: {
    marginLeft: 4,
  },
});