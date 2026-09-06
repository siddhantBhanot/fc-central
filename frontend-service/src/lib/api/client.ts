import { config } from '@/config/env';
import type {
  AuthResponse,
  ConversationDetailResponse,
  ConversationSummary,
  DocumentDetailResponse,
  FeedbackRequest,
  FeedbackResponse,
  HealthResponse,
  KnowledgeIngestResponse,
  LoginRequest,
  Microservice,
  ModelsResponse,
  QueryRequest,
  QueryResponse,
  ShareResponse,
  SharedConversationDetailResponse,
  SignupRequest,
  User,
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
  private token: string | null = null;

  constructor(baseUrl: string = config.apiBaseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
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

    if (this.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const requestId = response.headers.get('X-Request-ID') || undefined;


    if (!response.ok) {
      try {
        const errorJson = await response.json();
        let message = errorJson.message;

        // If Pydantic field validation errors exist, extract the first human-readable description
        if (errorJson.details?.errors && Array.isArray(errorJson.details.errors) && errorJson.details.errors.length > 0) {
          const firstErr = errorJson.details.errors[0];
          const field = Array.isArray(firstErr.loc) ? firstErr.loc[firstErr.loc.length - 1] : undefined;
          const msg = firstErr.msg;
          if (field && msg) {
            message = `${String(field).charAt(0).toUpperCase() + String(field).slice(1)}: ${msg}`;
          } else if (msg) {
            message = msg;
          }
        }

        if (!message) {
          if (response.status === 401) {
            message = 'Invalid email or password.';
          } else if (response.status === 403) {
            message = 'Access forbidden.';
          } else {
            message = `Request failed with status ${response.status}`;
          }
        }

        throw new ApiError(
          response.status,
          message,
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
   * Retrieve full source documentation file content safely
   */
  async getDocument(service: string, file: string): Promise<DocumentDetailResponse> {
    const params = new URLSearchParams({ service, file });
    return this.fetch<DocumentDetailResponse>(`/api/v1/documents?${params.toString()}`);
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

  /**
   * List configured LLM models available on the backend
   */
  async listModels(): Promise<ModelsResponse> {
    return this.fetch<ModelsResponse>('/api/v1/models');
  }

  /**
   * Register a new user account
   */
  async signup(payload: SignupRequest): Promise<AuthResponse> {
    const res = await this.fetch<AuthResponse>('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  /**
   * Login with email and password
   */
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const res = await this.fetch<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  /**
   * Fetch current authenticated user profile
   */
  async getCurrentUser(): Promise<User> {
    return this.fetch<User>('/api/v1/auth/me');
  }

  /**
   * Generate or retrieve a shareable UUID token for an active conversation
   */
  async shareConversation(conversationId: string): Promise<ShareResponse> {
    return this.fetch<ShareResponse>(`/api/v1/conversations/${conversationId}/share`, {
      method: 'POST',
    });
  }

  /**
   * Retrieve a shared conversation and citations (requires user authentication)
   */
  async getSharedConversation(shareToken: string): Promise<SharedConversationDetailResponse> {
    return this.fetch<SharedConversationDetailResponse>(`/api/v1/shared/${shareToken}`);
  }

  /**
   * Logout user and clear local token
   */
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await this.fetch('/api/v1/auth/logout', { method: 'POST' });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      this.setToken(null);
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;

