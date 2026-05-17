import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types';
import { messageService } from '@/services/messageService';
import { signalrService } from '@/services/signalrService';
import { storage } from '@/services/storage';

interface MessageDto {
  id: number;
  matchId: number;
  senderId: string;
  content: string;
  timestamp: string;
  type: string;
  isRead: boolean;
}

export function useMessages(matchId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Gönderilen mesajların "ben mi?" kontrolü için userId lazım
  useEffect(() => {
    storage.getUserId().then(setCurrentUserId);
  }, []);

  const fetchMessages = useCallback((isRefresh = false) => {
    if (!matchId) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    messageService.getMessages(matchId)
      .then(result => setMessages(result.messages))
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [matchId]);

  const refetch = useCallback(() => fetchMessages(true), [fetchMessages]);

  useEffect(() => {
    if (!matchId) return;
    fetchMessages();

    messageService.markAsRead(matchId).catch(() => {});

    signalrService.start().catch(() => {});

    signalrService.on<MessageDto>('ReceiveMessage', (dto) => {
      if (dto.matchId.toString() !== matchId) return;
      const msg: Message = {
        id: dto.id.toString(),
        senderId: dto.senderId,
        content: dto.content,
        timestamp: new Date(dto.timestamp),
        type: dto.type as Message['type'],
        isRead: dto.isRead,
      };
      setMessages(prev =>
        prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
      );
      messageService.markAsRead(matchId).catch(() => {});
    });

    signalrService.on<number>('MessagesRead', (readMatchId) => {
      if (readMatchId.toString() !== matchId) return;
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    });

    return () => {
      signalrService.off('ReceiveMessage');
      signalrService.off('MessagesRead');
    };
  }, [matchId]);

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    if (!matchId || !content.trim()) return false;

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
      // Temp mesajı gerçek sunucu yanıtıyla değiştir; SignalR aynı ID'yi çoktan eklediyse onu da temizle
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempMessage.id && m.id !== sent.id),
        sent,
      ]);
      return true;
    } catch {
      // Gönderim başarısız — temp mesajı kaldır
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      return false;
    }
  }, [matchId, currentUserId]);

  return { messages, loading, refreshing, currentUserId, sendMessage, refetch };
}
