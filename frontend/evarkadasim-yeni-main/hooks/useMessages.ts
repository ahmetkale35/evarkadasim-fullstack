import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types';
import { messageService } from '@/services/messageService';
import { storage } from '@/services/storage';

export function useMessages(matchId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Gönderilen mesajların "ben mi?" kontrolü için userId lazım
  useEffect(() => {
    storage.getUserId().then(setCurrentUserId);
  }, []);

  useEffect(() => {
    if (!matchId) return;
    setLoading(true);
    messageService.getMessages(matchId)
      .then(result => setMessages(result.messages))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Sohbet açılınca okunmamış mesajları okundu işaretle
    messageService.markAsRead(matchId).catch(() => {});
  }, [matchId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!matchId || !content.trim()) return;

    // Optimistic update — API yanıtını beklemeden UI'a ekle
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId ?? 'me',
      content: content.trim(),
      timestamp: new Date(),
      type: 'text',
      isRead: false,
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const sent = await messageService.send(matchId, content.trim());
      // Temp mesajı gerçek sunucu yanıtıyla değiştir
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? sent : m));
    } catch {
      // Gönderim başarısız — temp mesajı kaldır
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  }, [matchId, currentUserId]);

  return { messages, loading, currentUserId, sendMessage };
}
