import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  {
    title: 'Real-time Presence',
    desc: 'See who joins and leaves the moment it happens. No refresh needed.',
    path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    title: 'Server-Authoritative Timer',
    desc: 'One clock shared across all participants. No drift. No desync.',
    path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Persistent Chat',
    desc: 'Messages are saved to the database. Rejoin a room and the full history is there.',
    path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  {
    title: '6-Character Room Codes',
    desc: 'Share a code. Anyone with it can join in seconds. No invite links, no friction.',
    path: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14',
  },
  {
    title: 'Session History',
    desc: 'Every session is logged. Track total study time and count from your dashboard.',
    path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    title: 'Zero Distraction',
    desc: 'No feeds. No notifications. Just a room, a timer, and the people you are working with.',
    path: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
];

const STEPS = [
  { n: '01', title: 'Create an account', desc: 'Register with email. Under a minute.' },
  { n: '02', title: 'Create a room', desc: 'Name it. A 6-character code generates automatically.' },
  { n: '03', title: 'Share the code', desc: 'Send it to study partners. They join in one click.' },
  { n: '04', title: 'Track your work', desc: 'Start a session. Your dashboard records every minute.' },
];

const CARD_TOP_BORDERS = [
  'border-t-accent',
  'border-t-violet-500',
  'border-t-indigo-400',
  'border-t-accent',
  'border-t-violet-500',
  'border-t-indigo-400',
];

const MOCK_PARTICIPANTS = ['Aryan', 'Priya', 'Rohan'];

const MOCK_MESSAGES = [
  { name: 'Priya', time: '09:14 AM', text: 'anyone doing the algo sheet?', own: false },
  { name: 'Aryan', time: '09:15 AM', text: 'yeah, starting from problem 4', own: true },
  { name: 'Rohan', time: '09:16 AM', text: 'joining in 5', own: false },
];

function MockRoomUI({ mockSeconds }) {
  return (
    <div style={{
      background: '#111111',
      border: '1px solid #262626',
      borderRadius: '12px',
      overflow: 'hidden',
      maxWidth: '680px',
      width: '100%',
      boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.1)',
    }}>
      <div style={{
        background: '#111111',
        borderBottom: '1px solid #262626',
        padding: '0 14px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ color: '#525252', fontSize: '12px' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: 'inline' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </span>
        <div style={{ width: '1px', height: '18px', background: '#262626' }} />
        <span style={{ color: '#a3a3a3', fontSize: '12px' }}>Aryan's Room</span>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '11px',
          background: '#1a1a1a',
          border: '1px solid #262626',
          color: '#a3a3a3',
          padding: '1px 7px',
          borderRadius: '4px',
          letterSpacing: '0.06em',
        }}>XK9M2P</span>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1px' }}>Session Active</div>
          <span className="mock-timer-glow" style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '20px',
            fontWeight: '700',
            color: '#6366f1',
            lineHeight: 1,
            textShadow: '0 0 20px rgba(99,102,241,0.6)',
          }}>
            {String(Math.floor(mockSeconds / 3600)).padStart(2, '0')}:{String(Math.floor((mockSeconds % 3600) / 60)).padStart(2, '0')}:<span className="mock-blink">{String(mockSeconds % 60).padStart(2, '0')}</span>
          </span>
        </div>
        <div style={{ width: '1px', height: '18px', background: '#262626' }} />
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#ef4444',
          fontSize: '11px',
          fontWeight: '500',
          padding: '4px 10px',
          borderRadius: '5px',
        }}>End Session</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ fontSize: '10px', color: '#525252' }}>connected</span>
        </div>
      </div>

      <div style={{ display: 'flex', height: '260px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MOCK_MESSAGES.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.own ? 'flex-end' : 'flex-start',
                maxWidth: '78%',
                alignSelf: m.own ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  background: m.own ? '#6366f1' : '#1a1a1a',
                  borderLeft: m.own ? 'none' : '2px solid rgba(99,102,241,0.35)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                }}>
                  <div style={{ display: 'flex', gap: '7px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '10px', color: m.own ? 'rgba(255,255,255,0.8)' : '#6366f1', fontWeight: '500' }}>{m.name}</span>
                    <span style={{ fontSize: '10px', color: m.own ? 'rgba(255,255,255,0.5)' : '#525252', fontFamily: "'DM Mono', monospace" }}>{m.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: m.own ? '#fff' : '#f5f5f5' }}>{m.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #262626', padding: '8px 12px', display: 'flex', gap: '7px' }}>
            <div style={{ flex: 1, background: '#1a1a1a', border: '1px solid #262626', borderRadius: '5px', padding: '6px 10px', color: '#525252', fontSize: '12px' }}>Send a message...</div>
            <div style={{ background: '#6366f1', color: '#fff', fontSize: '12px', fontWeight: '500', padding: '6px 12px', borderRadius: '5px' }}>Send</div>
          </div>
        </div>

        <div style={{ width: '164px', borderLeft: '1px solid #262626', flexShrink: 0 }}>
          <div style={{ padding: '9px 12px 7px', borderBottom: '1px solid #262626', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '9px', fontWeight: '600', color: '#f5f5f5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Online</span>
            <span style={{ fontSize: '9px', fontWeight: '600', background: 'rgba(99,102,241,0.15)', color: '#6366f1', padding: '1px 6px', borderRadius: '20px' }}>3</span>
          </div>
          <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {MOCK_PARTICIPANTS.map((name) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', borderRadius: '5px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: '#6366f1' }}>{name[0]}</span>
                </div>
                <span style={{ fontSize: '12px', color: '#f5f5f5', flex: 1 }}>{name}</span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { token, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mockSeconds, setMockSeconds] = useState(23 * 60 + 47);
  const [scrolled, setScrolled] = useState(false);
  const [stepCounts, setStepCounts] = useState([0, 0, 0, 0]);
  const stepsRef = useRef(null);

  useEffect(() => {
    if (!isLoading && token) {
      navigate('/rooms', { replace: true });
    }
  }, [isLoading, token, navigate]);

  useEffect(() => {
    const id = setInterval(() => setMockSeconds(s => (s + 1) % 7200), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const el = stepsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const targets = [1, 2, 3, 4];
        targets.forEach((target, idx) => {
          setTimeout(() => {
            let count = 0;
            const step = setInterval(() => {
              count += 1;
              setStepCounts(prev => {
                const next = [...prev];
                next[idx] = count;
                return next;
              });
              if (count >= target) clearInterval(step);
            }, 60);
          }, idx * 150);
        });
        observer.disconnect();
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mockGlow {
          0%, 100% { text-shadow: 0 0 8px rgba(99,102,241,0.4); }
          50%       { text-shadow: 0 0 22px rgba(99,102,241,0.75); }
        }
        @keyframes mockBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.15; }
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(20px, -15px) scale(1.05); }
          66%       { transform: translate(-10px, 10px) scale(0.97); }
        }
        @keyframes borderRotate {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .fade-up-1 { animation: fadeUp 0.65s 0.05s ease both; }
        .fade-up-2 { animation: fadeUp 0.65s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.65s 0.25s ease both; }
        .fade-up-4 { animation: fadeUp 0.65s 0.38s ease both; }
        .mock-timer-glow { animation: mockGlow 2s ease-in-out infinite; }
        .mock-blink { animation: mockBlink 1s step-end infinite; display: inline-block; }
        .orb-1 { animation: drift 12s ease-in-out infinite; }
        .orb-2 { animation: drift 16s ease-in-out infinite reverse; }
        .step-connector::before {
          content: '';
          position: absolute;
          top: 28px;
          left: 0;
          right: 0;
          height: 1px;
          background: #262626;
          z-index: 0;
        }
        .feature-card {
          animation: fadeUp 0.5s ease forwards;
          opacity: 0;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.4);
        }
        .feature-card:nth-child(1) { animation-delay: 0.05s; }
        .feature-card:nth-child(2) { animation-delay: 0.1s; }
        .feature-card:nth-child(3) { animation-delay: 0.15s; }
        .feature-card:nth-child(4) { animation-delay: 0.2s; }
        .feature-card:nth-child(5) { animation-delay: 0.25s; }
        .feature-card:nth-child(6) { animation-delay: 0.3s; }
        .cta-glow {
          background: linear-gradient(270deg, #6366f1, #8b5cf6, #4f46e5, #6366f1);
          background-size: 300% 300%;
          animation: borderRotate 6s ease infinite;
          padding: 1px;
          border-radius: 16px;
        }
        .cta-inner {
          background: #0a0a0a;
          border-radius: 15px;
          padding: 2.5rem 2rem;
        }
      `}</style>

      <div className="min-h-screen bg-bg-base text-text-primary" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Nav */}
        <nav className={`border-b border-bg-border sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-bg-surface/95 backdrop-blur-md shadow-lg shadow-black/20' : 'bg-transparent'}`}>
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <span className="text-text-primary font-semibold" style={{ fontFamily: "'DM Mono', monospace", fontSize: '15px', letterSpacing: '-0.01em' }}>
              Sync<span className="text-accent">ora</span>
            </span>
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-text-muted hover:text-text-primary text-sm transition-colors px-3 py-1.5">
                Sign in
              </Link>
              <Link to="/register" className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
                Get started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="px-4 pt-20 pb-24 text-center relative overflow-hidden">
          {/* Radial glow behind headline */}
          <div className="orb-1 w-72 h-72 rounded-full bg-accent/20 blur-3xl absolute -top-20 left-1/4 pointer-events-none z-0" />
          <div className="orb-2 w-48 h-48 rounded-full bg-purple-500/10 blur-2xl absolute top-40 right-1/4 pointer-events-none z-0" />
          <div className="max-w-6xl mx-auto relative">
            <div className="fade-up-1 mb-5">
              <span
                className="inline-block text-accent text-xs font-medium px-4 py-1 rounded-full border border-accent/20"
                style={{ fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em' }}
              >
                FOCUSED WORK INFRASTRUCTURE
              </span>
            </div>

            <h1
              className="fade-up-2 text-text-primary mb-5 leading-tight"
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: 'clamp(2rem, 6vw, 3.75rem)',
                maxWidth: '780px',
                margin: '0 auto 20px',
              }}
            >
              Everyone's online.{' '}
              <em style={{ color: '#6366f1', fontStyle: 'italic' }}>Are you actually studying?</em>
            </h1>

            <p
              className="fade-up-3 text-text-secondary text-base sm:text-lg mb-10"
              style={{ maxWidth: '460px', margin: '0 auto 36px', lineHeight: '1.7' }}
            >
              Syncora is a collaborative study room with a shared session timer, real-time presence, and persistent chat.
              No noise. Just focus.
            </p>

            <div className="fade-up-3 flex flex-wrap justify-center gap-3 mb-16">
              <Link to="/register" className="bg-accent hover:bg-accent-hover text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm">
                Create a room
              </Link>
              <Link to="/login" className="bg-bg-surface hover:bg-bg-elevated border border-bg-border text-text-primary font-medium px-6 py-2.5 rounded-lg transition-colors text-sm">
                Sign in
              </Link>
            </div>

            <div className="fade-up-4 flex justify-center overflow-x-auto pb-2">
              <MockRoomUI mockSeconds={mockSeconds} />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 border-t border-bg-border">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span
                className="inline-block text-accent font-mono text-xs tracking-widest uppercase border border-accent/20 rounded-full px-4 py-1 mb-4"
              >
                FEATURES
              </span>
              <h2
                className="text-2xl sm:text-3xl text-text-primary"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                Built for people who want to work,{' '}
                <em style={{ fontStyle: 'italic' }}>not plan to.</em>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className={`feature-card flex flex-col bg-bg-surface border border-bg-border border-t-2 ${CARD_TOP_BORDERS[i]} rounded-xl p-6 hover:border-accent/30 transition-colors`}
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={f.path} />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mb-2">{f.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          className="py-20 px-4 border-t border-bg-border"
          style={{ background: 'linear-gradient(to bottom, #0a0a0a, #111111 50%, #0a0a0a)' }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span
                className="inline-block text-accent font-mono text-xs tracking-widest uppercase border border-accent/20 rounded-full px-4 py-1 mb-4"
              >
                HOW IT WORKS
              </span>
              <h2
                className="text-2xl sm:text-3xl text-text-primary"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                Four steps. Then you're studying.
              </h2>
            </div>
            <div ref={stepsRef} className="relative step-connector grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((s, i) => (
                <div key={s.n} className="relative z-10">
                  <div
                    className="font-bold text-accent/20 mb-4 leading-none"
                    style={{ fontFamily: "'DM Mono', monospace", fontSize: '56px', lineHeight: 1 }}
                  >
                    {String(stepCounts[i]).padStart(2, '0')}
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2">{s.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* CTA */}
        <section
          className="py-24 px-4 text-center"
          style={{ backgroundImage: 'radial-gradient(ellipse 60% 60% at 50% 100%, rgba(99,102,241,0.08) 0%, transparent 70%)' }}
        >
          <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent mb-16" />
          <div className="max-w-xl mx-auto">
            <div className="cta-glow">
              <div className="cta-inner text-center">
                <h2
                  className="text-2xl sm:text-4xl text-text-primary mb-4"
                  style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                  Your next session starts here.
                </h2>
                <p className="text-text-secondary text-sm sm:text-base mb-8 leading-relaxed">
                  Free to use. No credit card. No setup beyond an email address.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link to="/register" className="bg-accent hover:bg-accent-hover text-white font-medium px-7 py-3 rounded-lg transition-colors text-sm">
                    Get started for free
                  </Link>
                  <Link to="/login" className="bg-bg-surface hover:bg-bg-elevated border border-bg-border text-text-secondary font-medium px-7 py-3 rounded-lg transition-colors text-sm">
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-bg-border py-6 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-text-muted text-[11px]" style={{ fontFamily: "'DM Mono', monospace" }}>Syncora</span>
            <span className="text-text-muted text-[11px]">Collaborative study infrastructure</span>
          </div>
        </footer>
      </div>
    </>
  );
}
