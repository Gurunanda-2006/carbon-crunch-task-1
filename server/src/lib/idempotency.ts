import crypto from 'crypto';
import type { RawEventPayload } from '../types';

/**
 * Recursively sorts object keys alphabetically so the same payload
 * always produces the same JSON string regardless of key insertion order.
 */
function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((obj as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return obj;
}

/**
 * Computes a deterministic SHA-256 fingerprint for a raw event.
 *
 * Strategy:
 *  - Canonicalize the payload (sort all object keys recursively)
 *  - Hash: source + canonical JSON of payload
 *
 * This means: same source + same payload content → same key,
 * regardless of key order or when the event was submitted.
 * Different timestamps in the payload → different key (treated as distinct events).
 */
export function computeIdempotencyKey(source: string, payload: RawEventPayload): string {
  const canonical = JSON.stringify({
    source: source.trim().toLowerCase(),
    payload: sortKeys(payload),
  });
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}
