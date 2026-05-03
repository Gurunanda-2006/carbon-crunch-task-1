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

// ── 2. Navbar Component ──
const Navbar = ({ onStart }: { onStart: () => void }) => {
  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 pointer-events-none">
      <nav className="pointer-events-auto backdrop-blur-md bg-white/10 rounded-full border border-black/10 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="font-instrument text-[28px] tracking-tight text-[#1a1a1a]">dot.</div>
        <div className="hidden md:flex gap-10 font-sans text-[14px] text-[#1a1a1a]">
          <a href="#" className="hover:opacity-50 transition-opacity">Philosophy</a>
          <a href="#" className="hover:opacity-50 transition-opacity">Trust</a>
          <a href="#" className="hover:opacity-50 transition-opacity">Access</a>
          <a href="#" className="hover:opacity-50 transition-opacity">Tribe</a>
        </div>
        <button 
          onClick={onStart}
          className="group relative bg-[#0871E7] text-white font-sans text-[14px] px-6 py-2 rounded-full shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline-1 outline-[#0871E7] -outline-offset-1 transition-all cursor-pointer"
        >
          <div className="absolute w-[80%] h-4 left-[10%] top-[1px] bg-gradient-to-b from-[#DEF0FC] to-transparent rounded-[12px] group-hover:scale-x-105 transition-transform origin-center" />
          <span className="relative z-10">Link up</span>
        </button>
      </nav>
    </header>
  );
};

// ── 3. Hero Component ──
const Hero = ({ onStart }: { onStart: () => void }) => {
  return (
    <section className="relative min-h-screen bg-[#F3F4ED] pt-24 md:pt-32 flex flex-col items-center overflow-hidden">
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

      <div className="relative z-20 pointer-events-none text-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-instrument text-[38px] md:text-[56px] lg:text-[72px] leading-[0.85] tracking-tight text-[#1a1a1a] mb-6"
        >
          Short notes. <br /> Daily calm.
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-sans text-[16px] md:text-[18px] text-[#1a1a1a]/70 leading-relaxed font-normal max-w-xl mx-auto mb-10"
        >
          Linked with a single anonymous peer. One message every day. A quiet rhythm in the digital noise.
        </motion.div>
        
        <div className="pointer-events-auto">
          <button 
            onClick={onStart}
            className="bg-[#1a1a1a] text-white px-10 py-4 rounded-full font-sans text-[16px] font-medium hover:scale-105 transition-transform shadow-2xl cursor-pointer"
          >
            Try now
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
        <Navbar onStart={() => setShowDashboard(true)} />
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
