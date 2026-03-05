import { api } from './api';

export type ChatRole = 'USER' | 'ADMIN';

export type ChatUser = {
  id: string;
  fullName: string;
  email: string;
  profilePhotoUrl: string | null;
  role: ChatRole;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: string;
};

export type ChatAttachment = {
  url: string;
  downloadUrl: string;
  mimeType: string;
  name: string;
  previewUrl?: string;
};

export type AdminConversation = {
  user: ChatUser;
  lastMessageAt: string;
  lastMessagePreview: string;
  lastMessageFromUserId: string;
  unreadMessageCount: number;
};

export type ChatUnreadSummary = {
  userUnreadMessageCount: number;
  adminUnreadUserCount: number;
};

export const CHAT_ATTACHMENT_PREFIX = '[ATTACHMENT]';

type AttachmentMessagePayload = {
  attachment: ChatAttachment;
  text?: string;
};

const isValidAttachmentMessagePayload = (value: unknown): value is AttachmentMessagePayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Record<string, unknown>;
  const attachment = payload.attachment as Record<string, unknown> | undefined;

  return Boolean(
    attachment &&
      typeof attachment.url === 'string' &&
      typeof attachment.mimeType === 'string' &&
      typeof attachment.name === 'string' &&
      (attachment.previewUrl === undefined || typeof attachment.previewUrl === 'string')
  );
};

export const encodeAttachmentMessageContent = (attachment: ChatAttachment, text?: string): string => {
  return `${CHAT_ATTACHMENT_PREFIX}${JSON.stringify({
    attachment,
    text: text?.trim() || undefined
  })}`;
};

export const decodeAttachmentMessageContent = (
  content: string
): { attachment: ChatAttachment; text?: string } | null => {
  if (!content.startsWith(CHAT_ATTACHMENT_PREFIX)) {
    return null;
  }

  const rawPayload = content.slice(CHAT_ATTACHMENT_PREFIX.length);

  try {
    const parsed = JSON.parse(rawPayload) as unknown;

    if (!isValidAttachmentMessagePayload(parsed)) {
      return null;
    }

    return {
      attachment: parsed.attachment,
      text: typeof parsed.text === 'string' ? parsed.text : undefined
    };
  } catch (_error) {
    return null;
  }
};

const resolveWsUrl = (): string => {
  const wsUrl = import.meta.env.VITE_WS_BASE_URL ?? import.meta.env.VITE_WS_URL;
  if (wsUrl) return wsUrl;

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '/api/v1';
  if (apiBaseUrl.startsWith('http://') || apiBaseUrl.startsWith('https://')) {
    const parsed = new URL(apiBaseUrl);
    parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
    parsed.pathname = '/ws';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

export const chatService = {
  async getPeer(userId?: string): Promise<ChatUser> {
    const response = await api.get<{ peer: ChatUser }>('/chat/peer', {
      params: userId ? { userId } : undefined
    });

    return response.data.peer;
  },

  async getMessages(peerUserId: string): Promise<ChatMessage[]> {
    const response = await api.get<{ messages: ChatMessage[] }>(`/chat/messages/${peerUserId}`);
    return response.data.messages;
  },

  async getAdminConversations(): Promise<AdminConversation[]> {
    const response = await api.get<{ conversations: AdminConversation[] }>('/chat/conversations');
    return response.data.conversations;
  },

  async getUnreadSummary(): Promise<ChatUnreadSummary> {
    const response = await api.get<{ summary: ChatUnreadSummary }>('/chat/unread-summary');
    return response.data.summary;
  },

  async markConversationRead(peerUserId: string): Promise<void> {
    await api.patch(`/chat/read/${peerUserId}`);
  },

  async uploadAttachment(file: File): Promise<ChatAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ file: ChatAttachment }>('/chat/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.file;
  },

  async fetchAttachmentBlob(attachment: ChatAttachment): Promise<Blob> {
    const response = await api.post<Blob>(
      '/chat/attachments/download',
      {
        url: attachment.url,
        name: attachment.name,
        mimeType: attachment.mimeType
      },
      {
        responseType: 'blob'
      }
    );

    return response.data;
  },

  async downloadAttachment(attachment: ChatAttachment): Promise<void> {
    const blob = await this.fetchAttachmentBlob(attachment);
    const blobUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = attachment.name;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(blobUrl);
  },

  createSocket(): WebSocket {
    return new WebSocket(resolveWsUrl());
  }
};
