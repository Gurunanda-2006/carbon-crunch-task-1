// API client — all calls go to the backend server
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

import type {
  IngestRequest,
  IngestResponse,
  NormalizedEvent,
  FailedEvent,
  AggregationResult,
  EventStatus,
} from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  /** Submit a raw event */
  ingest(body: IngestRequest): Promise<IngestResponse> {
    return request<IngestResponse>('/api/ingest', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /** Get processed (normalized) events */
  getProcessedEvents(limit = 50): Promise<NormalizedEvent[]> {
    return request<NormalizedEvent[]>(`/api/events?status=processed&limit=${limit}`);
  },

  /** Get failed events */
  getFailedEvents(limit = 50): Promise<FailedEvent[]> {
    return request<FailedEvent[]>(`/api/events?status=failed&limit=${limit}`);
  },

  /** Get all events (raw) */
  getAllEvents(status: EventStatus = 'all', limit = 100) {
    return request(`/api/events?status=${status}&limit=${limit}`);
  },

  /** Get aggregated stats */
  getAggregation(): Promise<AggregationResult> {
    return request<AggregationResult>('/api/aggregate');
  },
};
