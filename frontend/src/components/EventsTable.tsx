import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { api } from '../api';
import type { NormalizedEvent, FailedEvent } from '../types';

type Tab = 'processed' | 'failed';

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch { return iso; }
}

function truncate(str: string | null | undefined, n = 28) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

interface EventsTableProps {
  refreshTrigger: number;
  onToast: (type: 'success' | 'error' | 'warning' | 'info', msg: string, details?: string[]) => void;
}

export function EventsTable({ refreshTrigger, onToast }: EventsTableProps) {
  const [tab, setTab] = useState<Tab>('processed');
  const [processed, setProcessed] = useState<NormalizedEvent[]>([]);
  const [failed, setFailed] = useState<FailedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, f] = await Promise.all([
        api.getProcessedEvents(50),
        api.getFailedEvents(50),
      ]);
      setProcessed(p);
      setFailed(f);
      setLastRefresh(new Date());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      onToast('error', `Failed to load events: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => { fetchData(); }, [fetchData, refreshTrigger]);

  const events = tab === 'processed' ? processed : failed;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <div className="card-title-icon" style={{ background: 'rgba(6,182,212,0.15)' }}>📋</div>
          Event Log
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastRefresh && (
            <span className="refresh-time">
              Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button className="btn btn-ghost" onClick={fetchData} disabled={loading}>
            {loading ? <span className="spinner" /> : '↻'} Refresh
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)' }}>
        <div className="tab-bar">
          <button
            className={`btn btn-ghost ${tab === 'processed' ? 'active' : ''}`}
            onClick={() => { setTab('processed'); setExpandedId(null); }}
          >
            ✅ Processed
            <span className="badge badge-processed" style={{ marginLeft: 4 }}>
              {processed.length}
            </span>
          </button>
          <button
            className={`btn btn-ghost ${tab === 'failed' ? 'active' : ''}`}
            onClick={() => { setTab('failed'); setExpandedId(null); }}
          >
            ❌ Failed
            <span className="badge badge-failed" style={{ marginLeft: 4 }}>
              {failed.length}
            </span>
          </button>
        </div>
      </div>

      <div className="events-table-wrapper table-scroll">
        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{tab === 'processed' ? '📭' : '✨'}</div>
            <p>{tab === 'processed' ? 'No processed events yet.' : 'No failed events — great!'}</p>
          </div>
        ) : tab === 'processed' ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Source</th>
                <th>Metric</th>
                <th>Amount</th>
                <th>Event Time</th>
                <th>Ingested At</th>
              </tr>
            </thead>
            <tbody>
              {(events as NormalizedEvent[]).map(ev => (
                <React.Fragment key={ev.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => toggleExpand(ev.id)}>
                    <td className="cell-id" title={ev.id}>{ev.id.slice(0, 8)}…</td>
                    <td className="cell-primary">{truncate(ev.client_id, 20)}</td>
                    <td>
                      <span className="badge badge-processed">{ev.metric || '—'}</span>
                    </td>
                    <td className="cell-mono">
                      {ev.amount != null ? ev.amount.toLocaleString() : '—'}
                    </td>
                    <td className="cell-mono" style={{ fontSize: '0.72rem' }}>
                      {formatDate(ev.timestamp)}
                    </td>
                    <td className="cell-mono" style={{ fontSize: '0.72rem' }}>
                      {formatDate(ev.normalized_at)}
                    </td>
                  </tr>
                  {expandedId === ev.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0, backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', gap: '20px', padding: '16px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.05em' }}>USER ADDED (RAW) JSON</div>
                            <pre style={{ margin: 0, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.8rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                              {JSON.stringify(ev.raw_payload, null, 2)}
                            </pre>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8, letterSpacing: '0.05em' }}>CORRECTED (NORMALIZED) JSON</div>
                            <pre style={{ margin: 0, padding: 12, background: 'rgba(6,182,212,0.05)', borderRadius: 6, border: '1px solid rgba(6,182,212,0.2)', fontSize: '0.8rem', whiteSpace: 'pre-wrap', color: '#67e8f9' }}>
                              {JSON.stringify(ev.normalized_payload, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Source</th>
                <th>Error</th>
                <th>Failed At</th>
              </tr>
            </thead>
            <tbody>
              {(events as FailedEvent[]).map(ev => (
                <React.Fragment key={ev.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => toggleExpand(ev.id)}>
                    <td className="cell-id" title={ev.id}>{ev.id.slice(0, 8)}…</td>
                    <td className="cell-primary">{truncate(ev.source, 20)}</td>
                    <td>
                      <span className="badge badge-failed" title={ev.error_message}>
                        {truncate(ev.error_message, 40)}
                      </span>
                    </td>
                    <td className="cell-mono" style={{ fontSize: '0.72rem' }}>
                      {formatDate(ev.failed_at)}
                    </td>
                  </tr>
                  {expandedId === ev.id && (
                    <tr>
                      <td colSpan={4} style={{ padding: 0, backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.05em' }}>USER ADDED (RAW) JSON</div>
                          <pre style={{ margin: 0, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.8rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                            {JSON.stringify(ev.raw_payload, null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
