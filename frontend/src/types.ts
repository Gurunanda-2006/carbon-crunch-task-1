// Shared TypeScript types between frontend and server
// (Server will mirror these in server/src/types.ts)

export interface RawEventPayload {
  [key: string]: unknown;
}

export interface IngestRequest {
  source: string;
  payload: RawEventPayload;
  simulate_failure?: 'validation' | 'db_error' | 'timeout' | null;
}

export interface IngestResponse {
  success: boolean;
  status: 'created' | 'duplicate' | 'failed';
  message: string;
  event_id?: string;
  idempotency_key?: string;
  corrections?: string[];
}

export interface RawEvent {
  id: string;
  idempotency_key: string;
  source: string;
  raw_payload: RawEventPayload;
  received_at: string;
  status: 'pending' | 'processed' | 'failed';
}

export interface NormalizedEvent {
  id: string;
  raw_event_id: string;
  client_id: string;
  metric: string;
  amount: number | null;
  timestamp: string | null;
  normalized_at: string;
  // Joined from raw_events
  source: string;
  received_at: string;
  raw_payload?: Record<string, unknown>;
  normalized_payload?: Record<string, unknown>;
}

export interface FailedEvent {
  id: string;
  raw_event_id: string;
  error_message: string;
  failed_at: string;
  // joined
  source?: string;
  raw_payload?: RawEventPayload;
}

export interface AggregationResult {
  total_events: number;
  processed_events: number;
  failed_events: number;
  duplicate_events: number;
  unique_sources: number;
  total_amount: number;
  by_metric: MetricBreakdown[];
  by_client: ClientBreakdown[];
}

export interface MetricBreakdown {
  metric: string;
  count: number;
  total_amount: number;
}

export interface ClientBreakdown {
  client_id: string;
  count: number;
  total_amount: number;
}

export type EventStatus = 'processed' | 'failed' | 'all';
