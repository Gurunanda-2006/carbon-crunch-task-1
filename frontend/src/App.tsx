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

      <div className="relative z-20 pointer-events-auto -translate-y-32">
        <motion.button 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          onClick={onStart}
          className="group relative bg-[#1a1a1a] text-white px-20 py-8 rounded-md font-sans text-[24px] font-black hover:scale-105 active:scale-95 transition-all shadow-[0_30px_70px_rgba(0,0,0,0.6)] cursor-pointer overflow-hidden border border-white/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <span className="relative z-10 tracking-[0.2em] uppercase">Get Started</span>
        </motion.button>
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
      <header className="header">
        <div className="header-container">
          <div className="logo-section" onClick={() => setShowDashboard(false)} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">
              <div className="logo-inner" />
            </div>
            <h1 className="logo-text">EventFlow</h1>
          </div>
          <div className="header-status">
            <div className="status-dot" />
            <span>Ingestion Engine Active</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto p-4">
          {/* 1. Event Log (Now at the Top) */}
          <EventsTable refreshTrigger={refreshTrigger} onToast={addToast} />
          
          {/* 2. Aggregated Insights */}
          <AggregationPanel refreshTrigger={refreshTrigger} onToast={addToast} />
          
          {/* 3. Data Ingestion (Now at the Bottom) */}
          <div className="w-full">
            <SubmitForm onSubmitSuccess={handleRefresh} onToast={addToast} />
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
