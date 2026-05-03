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
  const messages = ["Are you here?", "Yes, I am.", "Speak soon."];
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [speed, setSpeed] = useState(100);

  useEffect(() => {
    const handleTyping = () => {
      const currentMessage = messages[index];
      if (isDeleting) {
        setText(currentMessage.substring(0, text.length - 1));
        setSpeed(50);
      } else {
        setText(currentMessage.substring(0, text.length + 1));
        setSpeed(100);
      }

      if (!isDeleting && text === currentMessage) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && text === "") {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % messages.length);
      }
    };

    const timer = setTimeout(handleTyping, speed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, index, messages, speed]);

  return (
    <div className="absolute left-[48.5%] md:left-[47.5%] lg:left-[48.5%] -translate-x-1/2 bottom-[32%] z-30 w-[110px] sm:w-[130px] flex justify-start text-left">
      <p className="font-nokia text-[#2A3616] text-[10px] sm:text-[14px] leading-tight break-words min-h-[1.5em]">
        {text}
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="inline-block w-1.5 h-3 bg-[#2A3616] ml-1 align-middle"
        />
      </p>
    </div>
  );
};

// ── 3. Hero Component ──
const Hero = ({ onStart }: { onStart: () => void }) => {
  return (
    <section className="relative min-h-screen bg-[#F3F4ED] flex flex-col items-center justify-center overflow-hidden">
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

      <div className="relative z-20 pointer-events-none text-center px-6 max-w-6xl -translate-y-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-instrument text-[64px] md:text-[96px] lg:text-[124px] leading-[0.8] tracking-tighter text-[#1a1a1a] mb-10"
        >
          Event Flow. <br /> Ingested Calm.
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans text-[20px] md:text-[24px] text-[#1a1a1a]/85 leading-relaxed font-normal max-w-3xl mx-auto mb-16"
        >
          High-performance, fault-tolerant ingestion engine for unstructured data. <br className="hidden md:block" /> 
          Normalize, deduplicate, and aggregate millions of events with real-time reliability.
        </motion.div>
        
        <div className="pointer-events-auto">
          <button 
            onClick={onStart}
            className="group relative bg-[#1a1a1a] text-white px-20 py-7 rounded-full font-sans text-[22px] font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_25px_60px_rgba(0,0,0,0.4)] cursor-pointer overflow-hidden"
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
