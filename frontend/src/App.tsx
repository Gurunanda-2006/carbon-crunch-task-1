import { useState } from 'react';
import './index.css';
import { SubmitForm } from './components/SubmitForm';
import { EventsTable } from './components/EventsTable';
import { AggregationPanel } from './components/AggregationPanel';
import { ToastContainer, useToast } from './components/Toast';

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toasts, addToast, removeToast } = useToast();

  const handleRefresh = () => setRefreshTrigger(n => n + 1);

  return (
    <div className="app-layout">
      {/* ── HEADER ── */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <span>EventFlow</span>
        </div>
        <div className="header-status">
          <span className="status-dot" />
          System Online
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <div className="hero">
        <div className="hero-text">
          <h1>Fault-Tolerant Data Processing System</h1>
          <p>Submit unstructured events · Normalize · Deduplicate · Aggregate in real time</p>
        </div>
        <div className="hero-badges">
          <span className="hero-badge blue">Idempotent Ingestion</span>
          <span className="hero-badge cyan">Auto Normalization</span>
          <span className="hero-badge purple">Failure Simulation</span>
          <span className="hero-badge green">Live Aggregation</span>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <main className="main-content">
        {/* Left column – submit form */}
        <div>
          <SubmitForm
            onSubmitSuccess={handleRefresh}
            onToast={addToast}
          />
        </div>

        {/* Right column – table + aggregation */}
        <div className="right-column">
          <EventsTable
            refreshTrigger={refreshTrigger}
            onToast={addToast}
          />
          <AggregationPanel
            refreshTrigger={refreshTrigger}
            onToast={addToast}
          />
        </div>
      </main>

      {/* ── TOASTS ── */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
