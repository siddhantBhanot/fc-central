import { config } from '@/config/env';

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

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API Error [${response.status}]: ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Health check utility to test connectivity to backend
   */
  async checkHealth(): Promise<{ status: string }> {
    return this.fetch<{ status: string }>('/api/v1/health');
  }
}

export const apiClient = new ApiClient();
export default apiClient;
