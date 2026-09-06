export interface Microservice {
  id: string;
  name: string;
  description?: string;
  has_indexed_data?: boolean;
  doc_count?: number;
}

export type MessageStatus =
  | 'pending'
  | 'streaming'
  | 'complete'
  | 'error'
  | 'cancelled';

export interface SourceCitation {
  file: string;
  service?: string;
  doc_type?: string;
  docType?: string;
  class_name?: string;
  class?: string;
  method?: string;
  endpoint?: string;
  start_line?: number;
  end_line?: number;
  lineNumber?: number;
  snippet?: string;
  contentSnippet?: string;
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  status?: MessageStatus;
  sources?: SourceCitation[];
  latencyMs?: number;
  provider?: string;
  model?: string;
  feedbackRating?: 'positive' | 'negative' | null;
  feedbackComment?: string;
}

// Backend API Request & Response Contracts

export interface QueryRequest {
  query: string;
  conversation_id?: string | null;
  share_token?: string | null;
  service?: string;
  top_k?: number;
}

export interface QueryResponse {
  conversation_id: string;
  message_id: string;
  answer: string;
  sources: SourceCitation[];
  service: string;
  latency_ms: number;
  provider: string;
  model: string;
  forked?: boolean;
  forked_from?: string | null;
  created_at: string;
}

export interface FeedbackRequest {
  message_id: string;
  conversation_id: string;
  rating: 'positive' | 'negative';
  comment?: string;
}

export interface FeedbackResponse {
  id: string;
  message_id: string;
  conversation_id: string;
  rating: string;
  comment?: string;
  status: string;
  created_at: string;
}

export interface KnowledgeIngestRequest {
  service: string;
  source_path?: string | null;
}

export interface KnowledgeIngestResponse {
  job_id: string;
  service: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  source_path: string;
  total_files: number;
  total_chunks: number;
  files_indexed: string[];
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  service: string;
  environment: string;
  database: string;
  rag_mode: string;
  default_microservice: string;
}

export interface ConversationSummary {
  id: string;
  service: string;
  title?: string | null;
  share_token?: string | null;
  forked_from?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetailResponse {
  id: string;
  service: string;
  title?: string | null;
  share_token?: string | null;
  forked_from?: string | null;
  created_at: string;
  updated_at: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    sources: SourceCitation[];
    created_at: string;
  }>;
}

export interface ShareResponse {
  conversation_id: string;
  share_token: string;
  share_url: string;
}

export interface SharedConversationDetailResponse {
  id: string;
  share_token: string;
  service: string;
  title?: string | null;
  forked_from?: string | null;
  is_owner: boolean;
  created_at: string;
  updated_at: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    sources: SourceCitation[];
    created_at: string;
  }>;
}

export interface ErrorResponse {
  code: string;
  message: string;
  request_id: string;
  details?: Record<string, any>;
}

// Authentication Contracts

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface DocumentDetailResponse {
  file: string;
  service: string;
  content: string;
  content_type: string;
  total_lines: number;
  size_bytes: number;
}

