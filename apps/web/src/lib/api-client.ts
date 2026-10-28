/**
 * CivicSphere Universal API Client.
 * Handles credentialed requests (httpOnly cookies), CSRF token header propagation,
 * error normalization, and typed domain operations across all 6 modules.
 */

import type {
  User,
  CaseItem,
  DocumentItem,
  LegalGuidance,
  LegalAct,
  GovScheme,
  GovAnalysisResponse,
  GovEligibilityResponse,
  KnowledgeSource,
  KnowledgeSearchResult,
  GraphNeighborhood,
  AgentTool,
  AgentChatResponse,
} from './types';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  confidence?: number;
  warnings?: string[];
  request_id?: string;
  timestamp?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const isServer = typeof window === 'undefined';
  const rawBackend = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const backendBase = rawBackend.replace(/\/+$/, '');
  const baseUrl = isServer ? `${backendBase}/api/v1` : '/api/v1';
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject CSRF token for state-changing requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers.set('X-CSRF-Token', csrf);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Crucial for httpOnly access_token cookie
  });

  const body = await response.json().catch(() => ({
    success: false,
    error: { code: 'HTTP_ERROR', message: `Server returned status ${response.status}` },
  }));

  if (!response.ok || body.success === false) {
    const error: ApiError = body.error || {
      code: `HTTP_${response.status}`,
      message: response.statusText || 'An unexpected error occurred.',
    };
    throw error;
  }

  return body as ApiResponse<T>;
}

export const api = {
  // 1. Auth & Profile
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ user: User; message: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: { name: string; email: string; password: string; role?: string; phone?: string }) =>
      request<{ user: User; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    logout: () =>
      request<{ message: string }>('/auth/logout', { method: 'POST' }),
    me: () =>
      request<{ user: User }>('/auth/me'),
    updateProfile: (profileData: { name?: string; phone?: string }) =>
      request<{ user: User }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }),
  },

  // 2. Legal Guidance (Module A)
  legal: {
    query: (queryData: { query: string; jurisdiction?: string; user_context?: Record<string, unknown> }) =>
      request<LegalGuidance>('/legal/query', {
        method: 'POST',
        body: JSON.stringify(queryData),
      }),
    listActs: () =>
      request<LegalAct[]>('/legal/acts'),
    acts: () =>
      request<LegalAct[]>('/legal/acts'),
  },

  // 3. Government Schemes & Navigation (Module B)
  government: {
    analyze: (problemData: { problem_text: string; citizen_context?: Record<string, unknown>; jurisdiction?: string }) =>
      request<GovAnalysisResponse>('/government/analyze', {
        method: 'POST',
        body: JSON.stringify(problemData),
      }),
    listServices: (params?: { category?: string; jurisdiction?: string }) => {
      const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : '';
      return request<GovScheme[]>(`/government/services${qs ? `?${qs}` : ''}`);
    },
    getService: (serviceId: string) =>
      request<GovScheme>(`/government/services/${serviceId}`),
    checkEligibility: (data: { service_id: string; citizen_context: Record<string, unknown> }) =>
      request<GovEligibilityResponse>('/government/check-eligibility', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // 4. Intelligent Document Processing (Module D)
  documents: {
    upload: (file: File, caseId?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (caseId) formData.append('case_id', caseId);
      return request<DocumentItem>('/documents/upload', {
        method: 'POST',
        body: formData,
      });
    },
    list: (caseId?: string) =>
      request<DocumentItem[]>(`/documents${caseId ? `?case_id=${caseId}` : ''}`),
    get: (docId: string) =>
      request<DocumentItem>(`/documents/${docId}`),
  },

  // 5. Case Workspace (Module Cases)
  cases: {
    list: (filters?: { status?: string; priority?: string; category?: string; search?: string }) => {
      const qs = filters ? new URLSearchParams(filters as Record<string, string>).toString() : '';
      return request<CaseItem[]>(`/cases${qs ? `?${qs}` : ''}`);
    },
    get: (caseId: string) =>
      request<CaseItem>(`/cases/${caseId}`),
    create: (caseData: { title: string; description: string; category?: string; priority?: string; location?: string }) =>
      request<CaseItem>('/cases', {
        method: 'POST',
        body: JSON.stringify(caseData),
      }),
    update: (caseId: string, caseData: Partial<CaseItem>) =>
      request<CaseItem>(`/cases/${caseId}`, {
        method: 'PUT',
        body: JSON.stringify(caseData),
      }),
    delete: (caseId: string) =>
      request<{ message: string }>(`/cases/${caseId}`, { method: 'DELETE' }),
  },

  // 6. Knowledge & Neo4j Graph Engine (Module C)
  knowledge: {
    search: (queryData: { query: string; jurisdiction?: string; top_k?: number }) =>
      request<KnowledgeSearchResult>('/knowledge/search', {
        method: 'POST',
        body: JSON.stringify(queryData),
      }),
    getNeighborhood: (entityId: string, maxDepth: number = 2) =>
      request<GraphNeighborhood>(`/knowledge/graph/neighborhood/${entityId}?max_depth=${maxDepth}`),
    listSources: () =>
      request<KnowledgeSource[]>('/knowledge/sources'),
    sources: () =>
      request<KnowledgeSource[]>('/knowledge/sources'),
  },

  // 7. Multi-Agent System & Tools (Phase 6)
  agents: {
    chat: (chatData: { query: string; context?: Record<string, unknown>; jurisdiction?: string }) =>
      request<AgentChatResponse>('/agents/chat', {
        method: 'POST',
        body: JSON.stringify(chatData),
      }),
    listTools: () =>
      request<AgentTool[]>('/agents/tools'),
  },
};
