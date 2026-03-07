import type { ChatMessage } from '../../services/chat.service';

export type PendingComposerAttachment = {
  file: File;
  name: string;
  mimeType: string;
  localUrl: string;
};

export type MessageLocalAttachment = {
  name: string;
  mimeType: string;
  localUrl: string;
};

export type ChatUiMessage = ChatMessage & {
  clientId?: string;
  deliveryStatus?: 'pending' | 'sent';
  localAttachment?: MessageLocalAttachment;
};
