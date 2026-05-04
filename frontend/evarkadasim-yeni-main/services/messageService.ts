import { Message } from '@/types';
import { apiClient } from './apiClient';

interface MessageDto {
  id: number;
  senderId: string;
  content: string;
  timestamp: string;
  type: string;
  isRead: boolean;
}

interface PagedMessagesDto {
  messages: MessageDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

function toMessage(dto: MessageDto): Message {
  return {
    id: dto.id.toString(),
    senderId: dto.senderId,
    content: dto.content,
    timestamp: new Date(dto.timestamp),
    type: dto.type as Message['type'],
    isRead: dto.isRead,
  };
}

export const messageService = {
  getMessages: async (matchId: string, page = 1): Promise<{ messages: Message[]; hasMore: boolean }> => {
    // MatchDto.Id string, MessageController int bekliyor — parseInt ile dönüştür
    const { data } = await apiClient.get<PagedMessagesDto>(`/message/${parseInt(matchId)}`, {
      params: { page, pageSize: 50 },
    });
    return {
      messages: data.messages.map(toMessage),
      hasMore: data.hasMore,
    };
  },

  send: async (matchId: string, content: string): Promise<Message> => {
    const { data } = await apiClient.post<MessageDto>('/message', {
      matchId: parseInt(matchId),
      content,
      type: 'text',
    });
    return toMessage(data);
  },

  markAsRead: async (matchId: string): Promise<void> => {
    await apiClient.put(`/message/${parseInt(matchId)}/read`);
  },
};
