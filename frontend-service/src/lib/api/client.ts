import { config } from '@/config/env';
import type {
  ConversationDetailResponse,
  ConversationSummary,
  FeedbackRequest,
  FeedbackResponse,
  HealthResponse,
  KnowledgeIngestResponse,
  Microservice,
  QueryRequest,
  QueryResponse,
} from '@/types';

export class ApiError extends Error {
  code: string;
  requestId?: string;
  status: number;
  details?: Record<string, any>;

  constructor(status: number, message: string, code = 'API_ERROR', requestId?: string, details?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

/**
 * Base API Client for FC Central Engineering Intelligence Platform.
 * All HTTP communication with backend-service routes through here.
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = config.apiBaseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  getApiUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.getApiUrl(endpoint);
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const requestId = response.headers.get('X-Request-ID') || undefined;

    if (!response.ok) {
      try {
        const errorJson = await response.json();
        throw new ApiError(
          response.status,
          errorJson.message || `Request failed with status ${response.status}`,
          errorJson.code || 'HTTP_ERROR',
          errorJson.request_id || requestId,
          errorJson.details
        );
      } catch (e) {
        if (e instanceof ApiError) throw e;
        const errorText = await response.text().catch(() => 'Unknown server error');
        throw new ApiError(response.status, errorText, 'HTTP_ERROR', requestId);
      }
    }

    return response.json() as Promise<T>;
  }

  /**
   * Health check utility to test connectivity to backend
   */
  async checkHealth(): Promise<HealthResponse> {
    return this.fetch<HealthResponse>('/api/v1/health');
  }

  /**
   * Execute an engineering intelligence query against the RAG knowledge base
   */
  async query(payload: QueryRequest): Promise<QueryResponse> {
    return this.fetch<QueryResponse>('/api/v1/query', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Submit developer feedback (positive/negative + comment) on an answer
   */
  async submitFeedback(payload: FeedbackRequest): Promise<FeedbackResponse> {
    return this.fetch<FeedbackResponse>('/api/v1/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Trigger semantic chunking, embedding, and vector persistence for a microservice
   */
  async triggerKnowledgeIngestion(
    service: string,
    sourcePath?: string | null
  ): Promise<KnowledgeIngestResponse> {
    return this.fetch<KnowledgeIngestResponse>('/api/v1/knowledge', {
      method: 'POST',
      body: JSON.stringify({
        service,
        source_path: sourcePath || null,
      }),
    });
  }

  /**
   * Retrieve full conversation history by conversation ID
   */
  async getConversation(conversationId: string): Promise<ConversationDetailResponse> {
    return this.fetch<ConversationDetailResponse>(`/api/v1/conversations/${encodeURIComponent(conversationId)}`);
  }

  /**
   * List recent conversations, optionally filtered by service
   */
  async listConversations(service?: string, limit = 20): Promise<ConversationSummary[]> {
    const params = new URLSearchParams();
    if (service) params.append('service', service);
    params.append('limit', limit.toString());
    return this.fetch<ConversationSummary[]>(`/api/v1/conversations?${params.toString()}`);
  }

  /**
   * List available microservices discovered by the backend
   */
  async listServices(): Promise<Microservice[]> {
    return this.fetch<Microservice[]>('/api/v1/services');
  }
}

export const apiClient = new ApiClient();
export default apiClient;
