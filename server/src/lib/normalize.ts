import type { RawEventPayload } from '../types';

// ─── Amount Parsing ──────────────────────────────────────────────────────────
/**
 * Coerces any amount-like value to a number.
 * Handles: 23.7, "23.7", "$1,200.00", "1.2k", null, undefined
 */
function parseAmount(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return isFinite(raw) ? raw : null;
  if (typeof raw === 'string') {
    // Strip currency symbols, commas, spaces
    const cleaned = raw.replace(/[$€£₹,\s]/g, '').toLowerCase();
    if (cleaned.endsWith('k')) return parseFloat(cleaned) * 1_000;
    if (cleaned.endsWith('m')) return parseFloat(cleaned) * 1_000_000;
    const n = parseFloat(cleaned);
    return isFinite(n) ? n : null;
  }
  return null;
}

// ─── Timestamp Parsing ───────────────────────────────────────────────────────
/**
 * Parses a variety of date formats into an ISO-8601 string.
 * Handles:
 *  - ISO 8601 (2024-01-15T10:30:00Z)  ← pass-through
 *  - Unix epoch seconds (1705312200)
 *  - DD/MM/YYYY and MM-DD-YYYY
 *  - YYYY/MM/DD
 *  - "15 Jan 2024", "Jan 15 2024"
 */
function parseTimestamp(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;

  // Unix epoch (number)
  if (typeof raw === 'number') {
    // Heuristic: if > 1e10 it's milliseconds, else seconds
    const ms = raw > 1e10 ? raw : raw * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  if (typeof raw !== 'string') return null;

  const s = raw.trim();
  if (!s) return null;

  // Try native parse first (handles ISO 8601, RFC 2822, etc.)
  let d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString();

  // DD/MM/YYYY  or  DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    d = new Date(`${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // YYYY/MM/DD
  const ymd = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymd) {
    d = new Date(`${ymd[1]}-${ymd[2].padStart(2,'0')}-${ymd[3].padStart(2,'0')}`);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  return null;
}

// ─── Field Aliases ───────────────────────────────────────────────────────────
/**
 * Pulls a value from the first matching key in the payload.
 * Returns both the value and the matched key.
 */
function pickField(payload: RawEventPayload, ...keys: string[]): { value: unknown; key: string } | null {
  for (const k of keys) {
    if (payload[k] !== undefined && payload[k] !== null) return { value: payload[k], key: k };
  }
  return null;
}

// ─── Main Normalizer ─────────────────────────────────────────────────────────
export interface NormalizeResult {
  client_id: string;
  metric: string;
  amount: number | null;
  timestamp: string | null;
}

export type NormalizeOutcome = {
  ok: true;
  data: NormalizeResult;
  corrections: string[];
} | {
  ok: false;
  error: string;
};

/**
 * Normalizes a raw event payload into a canonical internal format.
 */
export function normalizeEvent(source: string, payload: RawEventPayload): NormalizeOutcome {
  try {
    const corrections: string[] = [];

    // Unwrap if user wrapped everything inside .payload or .data
    let activePayload = payload;
    if (activePayload && typeof activePayload === 'object') {
      if (activePayload.payload && typeof activePayload.payload === 'object' && !Array.isArray(activePayload.payload)) {
        activePayload = activePayload.payload as RawEventPayload;
        corrections.push(`Unwrapped nested "payload" object`);
      } else if (activePayload.data && typeof activePayload.data === 'object' && !Array.isArray(activePayload.data)) {
        activePayload = activePayload.data as RawEventPayload;
        corrections.push(`Unwrapped nested "data" object`);
      }
    }

    // Source / client_id
    const client_id = (source || 'unknown').trim().toLowerCase();
    if (client_id !== source) {
      corrections.push(`Cleaned up source name from "${source}" to "${client_id}"`);
    }

    // Metric — check multiple aliases
    const metricMatch = pickField(activePayload, 'metric', 'type', 'event_type', 'name');
    let metric = 'unknown';
    if (metricMatch) {
      metric = String(metricMatch.value).trim().toLowerCase();
      if (metricMatch.key !== 'metric') {
        corrections.push(`Mapped field "${metricMatch.key}" to standard field "metric"`);
      }
      if (metric !== metricMatch.value) {
        corrections.push(`Standardized metric name to lowercase "${metric}"`);
      }
    }

    // Amount — check multiple aliases
    const amountMatch = pickField(activePayload, 'amount', 'value', 'total', 'price', 'count');
    const amount = amountMatch ? parseAmount(amountMatch.value) : null;
    if (amountMatch) {
      if (amountMatch.key !== 'amount') {
        corrections.push(`Mapped field "${amountMatch.key}" to standard field "amount"`);
      }
      if (amount !== amountMatch.value) {
        corrections.push(`Coerced amount from "${amountMatch.value}" to numeric ${amount}`);
      }
    }

    // Timestamp — check multiple aliases
    const tsMatch = pickField(activePayload, 'timestamp', 'date', 'time', 'created_at', 'event_time');
    const timestamp = tsMatch ? parseTimestamp(tsMatch.value) : null;
    if (tsMatch) {
      if (tsMatch.key !== 'timestamp') {
        corrections.push(`Mapped field "${tsMatch.key}" to standard field "timestamp"`);
      }
      if (timestamp !== tsMatch.value) {
        corrections.push(`Parsed timestamp from "${tsMatch.value}" to ISO-8601 ${timestamp}`);
      }
    }

    if (!client_id && metric === 'unknown' && amount === null && timestamp === null) {
      return { ok: false, error: 'Payload is empty or entirely unrecognizable' };
    }

    return { ok: true, data: { client_id, metric, amount, timestamp }, corrections };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Normalization exception: ${message}` };
  }
}
