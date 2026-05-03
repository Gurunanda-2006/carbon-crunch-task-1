import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import './index.css';

// Dashboard Component Imports
import { SubmitForm } from './components/SubmitForm';
import { EventsTable } from './components/EventsTable';
import { AggregationPanel } from './components/AggregationPanel';
import { ToastContainer, useToast } from './components/Toast';

// ── 1. TypingMessages Component ──
const TypingMessages = () => {
  const messages = ["Event Ingestion...", "Data Corrected.", "Aggregating...", "Real-time Flow."];
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute bottom-[-20%] md:bottom-[-25%] left-1/2 -translate-x-1/2 scale-[0.45] md:scale-[0.6] lg:scale-[0.7] pointer-events-none select-none z-10">
      <img src="https://mintlify.s3.us-west-1.amazonaws.com/dot-2/phone.png" alt="Phone" className="w-[320px] md:w-[400px]" />
      <div className="absolute top-[31%] left-[17%] right-[18%] bottom-[32%] flex flex-col justify-center items-center">
        <motion.div
          key={currentMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="font-nokia text-[#1a1a1a] text-[14px] md:text-[18px] text-center leading-tight tracking-tighter"
        >
          {messages[currentMessage]}
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block ml-0.5"
          >
            _
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
};

// ── 3. Hero Component ──
const Hero = ({ onStart }: { onStart: () => void }) => {
  return (
    <section className="relative min-h-screen bg-[#F3F4ED] flex flex-col items-center justify-start pt-8 md:pt-12 lg:pt-16 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260427_054418_a6d194f0-ac86-4df9-abe5-ded73e596d7c.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/5" />
      </div>

      <div className="relative z-20 pointer-events-none text-center px-4 max-w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-instrument text-[28px] md:text-[44px] lg:text-[56px] leading-none tracking-tighter text-[#1a1a1a] mb-4 whitespace-nowrap block w-full"
        >
          Event Flow. Ingested Calm.
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans text-[14px] md:text-[17px] text-[#1a1a1a]/80 leading-relaxed font-normal max-w-2xl mx-auto mb-8"
        >
          High-performance, fault-tolerant ingestion engine for unstructured data. <br className="hidden md:block" />
          Normalize, deduplicate, and aggregate millions of events with real-time reliability.
        </motion.div>
        
        <div className="pointer-events-auto">
          <button 
            onClick={onStart}
            className="group relative bg-[#1a1a1a] text-white px-10 py-4 rounded-full font-sans text-[18px] font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_15px_40px_rgba(0,0,0,0.3)] cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative z-10">Get Started</span>
          </button>
        </div>
      </div>

      <TypingMessages />
    </section>
  );
};

// ── 4. Main App Component ──
export default function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toasts, addToast, removeToast } = useToast();

  const handleRefresh = () => setRefreshTrigger(n => n + 1);

  if (!showDashboard) {
    return (
      <main className="antialiased">
        <Hero onStart={() => setShowDashboard(true)} />
      </main>
    );
  }

  return (
    <div className="app-layout">
      {/* ── HEADER ── */}
      <header className="header">
        <div className="logo" onClick={() => setShowDashboard(false)} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">⚡</div>
          <span>EventFlow</span>
        </div>
        <div className="header-status">
          <div className="status-dot" />
          <span>Ingestion Engine Active</span>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <section className="hero">
        <div className="hero-text">
          <h1>Event Monitoring Dashboard</h1>
          <p>Real-time analytics and ingestion status for Carbon Crunch pipeline.</p>
        </div>
        <div className="hero-badges">
          <div className="hero-badge blue">Production</div>
          <div className="hero-badge cyan">Fault-Tolerant</div>
          <div className="hero-badge purple">Auto-Normalizing</div>
          <div className="hero-badge green">Healthy</div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">
        <SubmitForm onSubmitSuccess={handleRefresh} onToast={addToast} />
        
        <div className="right-column">
          <AggregationPanel refreshTrigger={refreshTrigger} onToast={addToast} key={`agg-${refreshTrigger}`} />
          <EventsTable refreshTrigger={refreshTrigger} onToast={addToast} key={`table-${refreshTrigger}`} />
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
