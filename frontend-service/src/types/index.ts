export interface Microservice {
  id: string;
  name: string;
  description?: string;
}

export type MessageStatus =
  | 'pending'
  | 'streaming'
  | 'complete'
  | 'error'
  | 'cancelled';

export interface SourceCitation {
  file: string;
  docType?: string;
  class?: string;
  method?: string;
  endpoint?: string;
  lineNumber?: number;
  contentSnippet?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  status?: MessageStatus;
  sources?: SourceCitation[];
}
