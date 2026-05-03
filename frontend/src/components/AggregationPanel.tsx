import { useEffect, useCallback, useState } from 'react';
import { api } from '../api';
import type { AggregationResult } from '../types';

interface AggregationPanelProps {
  refreshTrigger: number;
  onToast: (type: 'success' | 'error' | 'warning' | 'info', msg: string, details?: string[]) => void;
}

function MetricBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="metric-bar-row">
      <span className="metric-bar-label">{label}</span>
      <div className="metric-bar-track">
        <div className="metric-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="metric-bar-val">{value.toLocaleString()}</span>
    </div>
  );
}

const COLORS = [
  'linear-gradient(90deg,#3b82f6,#06b6d4)',
  'linear-gradient(90deg,#8b5cf6,#ec4899)',
  'linear-gradient(90deg,#10b981,#06b6d4)',
  'linear-gradient(90deg,#f59e0b,#ef4444)',
  'linear-gradient(90deg,#06b6d4,#3b82f6)',
];

export function AggregationPanel({ refreshTrigger, onToast }: AggregationPanelProps) {
  const [data, setData] = useState<AggregationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAgg = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getAggregation();
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      onToast('error', `Aggregation error: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => { fetchAgg(); }, [fetchAgg, refreshTrigger]);

  const successRate = data
    ? data.total_events > 0
      ? Math.round((data.processed_events / data.total_events) * 100)
      : 0
    : 0;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <div className="card-title-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>📊</div>
          Aggregated Insights
        </div>
        <button className="btn btn-ghost" onClick={fetchAgg} disabled={loading}>
          {loading ? <span className="spinner" /> : '↻'} Refresh
        </button>
      </div>

      <div className="card-body">
        {/* Top-level stat cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Events</div>
            <div className="stat-value blue">{data?.total_events ?? '—'}</div>
            <div className="stat-sub">all time</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Processed</div>
            <div className="stat-value green">{data?.processed_events ?? '—'}</div>
            <div className="stat-sub">{successRate}% success rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Failed</div>
            <div className="stat-value red">{data?.failed_events ?? '—'}</div>
            <div className="stat-sub">in failed_events</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Duplicates</div>
            <div className="stat-value purple">{data?.duplicate_events ?? '—'}</div>
            <div className="stat-sub">idempotent skips</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Unique Sources</div>
            <div className="stat-value cyan">{data?.unique_sources ?? '—'}</div>
            <div className="stat-sub">distinct clients</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Amount</div>
            <div className="stat-value amber">
              {data?.total_amount != null
                ? data.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })
                : '—'}
            </div>
            <div className="stat-sub">sum of amounts</div>
          </div>
        </div>

        {/* By Metric */}
        {data && data.by_metric.length > 0 && (
          <>
            <div className="section-divider" style={{ margin: '20px 0 16px' }} />
            <div style={{ marginBottom: 8 }}>
              <span className="form-label">By Metric</span>
            </div>
            {data.by_metric.map((m, i) => (
              <MetricBar
                key={m.metric}
                label={m.metric || 'unknown'}
                value={m.count}
                max={data.total_events}
                color={COLORS[i % COLORS.length]}
              />
            ))}
          </>
        )}

        {/* By Client */}
        {data && data.by_client.length > 0 && (
          <>
            <div className="section-divider" style={{ margin: '20px 0 16px' }} />
            <div style={{ marginBottom: 12 }}>
              <span className="form-label">By Client / Source</span>
            </div>
            <div className="events-table-wrapper">
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Events</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_client.map(c => (
                    <tr key={c.client_id}>
                      <td className="cell-primary">{c.client_id}</td>
                      <td className="cell-mono">{c.count}</td>
                      <td className="cell-mono">
                        {c.total_amount != null
                          ? c.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!data && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon">📉</div>
            <p>No aggregation data yet. Submit some events!</p>
          </div>
        )}
      </div>
    </div>
  );
}
