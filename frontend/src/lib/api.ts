// ============================================================
// API Client — Frontend API calls to backend
// ============================================================

const API_BASE = '/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'API request failed');
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// --- User ---
export const api = {
  getUser: () => request<any>('/user'),
  getDashboard: () => request<any>('/dashboard'),
  updateUser: (data: any) => request<any>('/user', { method: 'PUT', body: JSON.stringify(data) }),

  // --- Preferences ---
  getPreferences: (category?: string, status?: string) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (status) params.set('status', status);
    const query = params.toString();
    return request<any[]>(`/preferences${query ? `?${query}` : ''}`);
  },
  getPreference: (id: string) => request<any>(`/preferences/${id}`),
  createPreference: (data: any) =>
    request<any>('/preferences', { method: 'POST', body: JSON.stringify(data) }),
  updatePreference: (id: string, data: any) =>
    request<any>(`/preferences/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePreference: (id: string) =>
    request<void>(`/preferences/${id}`, { method: 'DELETE' }),
  getPreferenceHistory: (id: string) => request<any[]>(`/preferences/${id}/history`),

  // --- Suggestions ---
  getSuggestions: () => request<any[]>('/suggestions'),
  acceptSuggestion: (id: string) =>
    request<any>(`/suggestions/${id}/accept`, { method: 'POST' }),
  ignoreSuggestion: (id: string) =>
    request<any>(`/suggestions/${id}/ignore`, { method: 'POST' }),

  // --- Policies ---
  getPolicies: (category?: string) => {
    const query = category ? `?category=${category}` : '';
    return request<any[]>(`/policies${query}`);
  },
  createPolicy: (data: any) =>
    request<any>('/policies', { method: 'POST', body: JSON.stringify(data) }),
  updatePolicy: (id: string, data: any) =>
    request<any>(`/policies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePolicy: (id: string) =>
    request<void>(`/policies/${id}`, { method: 'DELETE' }),

  // --- Agents ---
  getAgents: () => request<any[]>('/agents'),
  registerAgent: (data: any) =>
    request<any>('/agents', { method: 'POST', body: JSON.stringify(data) }),
  deleteAgent: (id: string) =>
    request<void>(`/agents/${id}`, { method: 'DELETE' }),

  // --- Decisions ---
  getDecisions: () => request<any[]>('/decisions'),
  getDecision: (requestId: string) => request<any>(`/decisions/${requestId}`),
  submitDecision: (data: any) =>
    request<any>('/decisions', { method: 'POST', body: JSON.stringify(data) }),
  approveDecision: (requestId: string, decision: string) =>
    request<any>(`/decisions/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    }),
  overrideDecision: (requestId: string, data: any) =>
    request<any>(`/decisions/${requestId}/override`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // --- Onboarding ---
  onboardingChat: (messages: any[]) =>
    request<any>('/onboarding/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, user_id: '00000000-0000-0000-0000-000000000001' }),
    }),
  confirmOnboarding: (preferences: any[]) =>
    request<any>('/onboarding/confirm', {
      method: 'POST',
      body: JSON.stringify({ preferences }),
    }),
};
