import { useState } from 'react';
import { api } from '../api';
import type { IngestRequest } from '../types';

// Example payloads to help evaluators test quickly
const EXAMPLE_PAYLOADS: Record<string, { source: string; payload: object }> = {
  standard: {
    source: 'sensor-42',
    payload: {
      metric: 'temperature',
      amount: 23.7,
      timestamp: new Date().toISOString(),
    },
  },
  stringAmount: {
    source: 'billing-service',
    payload: {
      metric: 'revenue',
      amount: '$1,250.00',
      timestamp: '2024-01-15',
      region: 'us-east',
    },
  },
  missingFields: {
    source: 'legacy-client',
    payload: {
      type: 'page_view',   // 'type' instead of 'metric'
      value: '88',          // 'value' instead of 'amount'
      date: '15/01/2024',   // non-ISO date
    },
  },
  extraFields: {
    source: 'mobile-app',
    payload: {
      metric: 'clicks',
      amount: 5,
      timestamp: '2024-01-15T10:30:00Z',
      user_agent: 'Mozilla/5.0',
      session_id: 'abc-123',
      extra_data: { lat: 12.9, lng: 77.6 },
    },
  },
};

interface SubmitFormProps {
  onSubmitSuccess: () => void;
  onToast: (type: 'success' | 'error' | 'warning' | 'info', msg: string, details?: string[]) => void;
}

export function SubmitForm({ onSubmitSuccess, onToast }: SubmitFormProps) {
  const [source, setSource] = useState('sensor-42');
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(EXAMPLE_PAYLOADS.standard.payload, null, 2)
  );
  const [simulateFailure, setSimulateFailure] = useState<IngestRequest['simulate_failure']>(null);
  const [loading, setLoading] = useState(false);
  const [jsonError, setJsonError] = useState('');

  const validateJson = (text: string) => {
    try {
      JSON.parse(text);
      setJsonError('');
      return true;
    } catch {
      setJsonError('Invalid JSON — check syntax');
      return false;
    }
  };

  const handlePayloadChange = (val: string) => {
    setPayloadText(val);
    if (val.trim()) validateJson(val);
    else setJsonError('');
  };

  const loadExample = (key: string) => {
    const ex = EXAMPLE_PAYLOADS[key];
    setSource(ex.source);
    setPayloadText(JSON.stringify(ex.payload, null, 2));
    setJsonError('');
  };

  const handleSubmit = async () => {
    if (!source.trim()) {
      onToast('error', 'Source field is required');
      return;
    }
    if (!validateJson(payloadText)) return;

    setLoading(true);
    try {
      const result = await api.ingest({
        source: source.trim(),
        payload: JSON.parse(payloadText),
        simulate_failure: simulateFailure,
      });

      if (result.status === 'created') {
        const msg = result.corrections && result.corrections.length > 0 
          ? `Event ingested with ${result.corrections.length} correction(s) ✨  ID: ${result.event_id?.slice(0, 8)}…`
          : `Event ingested ✓  ID: ${result.event_id?.slice(0, 8)}…`;
          
        onToast('success', msg, result.corrections);
        onSubmitSuccess();
      } else if (result.status === 'duplicate') {
        onToast('warning', '⚡ Duplicate detected — idempotent skip (already processed)');
      } else {
        onToast('error', `Ingestion failed: ${result.message}`);
        onSubmitSuccess(); // still refresh so failed event shows up
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      onToast('error', `Network error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <div className="card-title-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>📥</div>
          Submit Raw Event
        </div>
      </div>

      <div className="card-body">
        {/* Quick examples */}
        <div className="form-group">
          <span className="form-label">Quick Examples</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Object.keys(EXAMPLE_PAYLOADS).map(key => (
              <button key={key} className="btn btn-ghost" onClick={() => loadExample(key)}>
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Source */}
        <div className="form-group">
          <label className="form-label" htmlFor="source-input">Event Source</label>
          <input
            id="source-input"
            className="form-input"
            value={source}
            onChange={e => setSource(e.target.value)}
            placeholder="e.g. sensor-42, billing-service"
          />
        </div>

        {/* Payload */}
        <div className="form-group">
          <label className="form-label" htmlFor="payload-input">Raw Payload (JSON)</label>
          <textarea
            id="payload-input"
            className="form-textarea"
            value={payloadText}
            onChange={e => handlePayloadChange(e.target.value)}
            placeholder='{"metric": "temperature", "amount": 23.7}'
          />
          {jsonError && <span className="error-text">{jsonError}</span>}
          <span className="hint-text">
            Can include string amounts ("$1,200"), non-ISO dates, aliased fields (type/value), extra fields — the normalizer handles all of it.
          </span>
        </div>

        {/* Simulate Failure */}
        <div className="form-group">
          <span className="form-label">Simulate Failure (optional)</span>
          <div className="failure-options">
            {([null, 'validation', 'db_error', 'timeout'] as const).map(opt => (
              <label
                key={String(opt)}
                className={`failure-option ${simulateFailure === opt ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="failure"
                  checked={simulateFailure === opt}
                  onChange={() => setSimulateFailure(opt)}
                />
                <span className="failure-option-label">
                  {opt === null ? '✅ None' :
                   opt === 'validation' ? '🔴 Validation Error' :
                   opt === 'db_error'   ? '💥 DB Write Fail' :
                                          '⏱️ Timeout'}
                </span>
              </label>
            ))}
          </div>
          {simulateFailure && (
            <span className="hint-text" style={{ color: 'rgba(245,158,11,0.8)' }}>
              ⚠️ Simulating <strong>{simulateFailure}</strong> — event will land in failed_events table
            </span>
          )}
        </div>

        <button
          id="submit-event-btn"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !!jsonError}
        >
          {loading ? <><span className="spinner" /> Ingesting…</> : '🚀 Submit Event'}
        </button>
      </div>
    </div>
  );
}
