import React from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="landing-logo">
          <div className="logo-icon-large">⚡</div>
          <h1 className="landing-title">EventFlow</h1>
        </div>
        <p className="landing-subtitle">
          A high-performance ingestion engine for unstructured data. 
          Normalize, deduplicate, and aggregate millions of events in real-time with built-in fault tolerance.
        </p>
        
        <div className="landing-features">
          <div className="landing-feature">
            <span className="feature-icon">🛡️</span>
            <span>Fault Tolerant</span>
          </div>
          <div className="landing-feature">
            <span className="feature-icon">🔄</span>
            <span>Auto Normalization</span>
          </div>
          <div className="landing-feature">
            <span className="feature-icon">📊</span>
            <span>Live Aggregation</span>
          </div>
        </div>

        <button className="landing-btn" onClick={onStart}>
          Get Started
          <span className="btn-arrow">→</span>
        </button>
      </div>

      <div className="landing-background">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <footer className="landing-footer">
        © 2026 EventFlow Systems · Built for Speed & Reliability
      </footer>
    </div>
  );
}
