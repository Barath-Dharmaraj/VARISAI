import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Cpu } from 'lucide-react';

interface StartupPreloaderProps {
  onComplete: () => void;
}

export const StartupPreloader: React.FC<StartupPreloaderProps> = ({ onComplete }) => {
  const [percent, setPercent] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Initializing Core ML Service...');
  const [isExiting, setIsExiting] = useState<boolean>(false);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      // Non-linear acceleration for natural agency feel
      const increment = current < 30 ? 2 : current < 70 ? 3 : current < 90 ? 2 : 1;
      current = Math.min(100, current + increment);
      setPercent(current);

      if (current < 25) {
        setStatusText('Booting Gradient Boosting Wait-Time Predictor...');
      } else if (current < 55) {
        setStatusText('Synchronizing Tamil Nadu District Nodal Registry...');
      } else if (current < 85) {
        setStatusText('Calibrating Adaptive Senior & PwD Priority Matrix...');
      } else {
        setStatusText('Autonomous Public Queue Infrastructure Ready');
      }

      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            onComplete();
          }, 600);
        }, 300);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [onComplete]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 200);
  };

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#07090E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'transform 0.65s cubic-bezier(0.85, 0, 0.15, 1), opacity 0.5s ease',
        transform: isExiting ? 'translateY(-100%)' : 'translateY(0)',
        opacity: isExiting ? 0 : 1
      }}
    >
      {/* Ambient background glow elements */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }}
      />

      {/* Cyber Grid background */}
      <div
        className="bg-cyber-grid"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.6,
          pointerEvents: 'none'
        }}
      />

      {/* Top Header Tag */}
      <div
        style={{
          position: 'absolute',
          top: '36px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          borderRadius: 'var(--radius-pill)',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="badge-live-dot" />
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'var(--color-gold)',
            textTransform: 'uppercase'
          }}
        >
          GOVERNMENT OF TAMIL NADU • DIGITAL INITIATIVE
        </span>
      </div>

      {/* Center Branding & Massive Percentage Counter */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '0 20px' }}>
        {/* Kinetic Title */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '14px', marginBottom: '8px' }}>
          <h1
            style={{
              fontSize: 'clamp(3rem, 7vw, 5.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #D4AF37 50%, #B8923F 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}
          >
            VARISAI
          </h1>
          <span
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              fontWeight: 700,
              color: 'var(--color-gold)',
              letterSpacing: '0.04em'
            }}
          >
            வரிசை
          </span>
        </div>

        <p
          style={{
            fontSize: 'clamp(0.95rem, 1.8vw, 1.15rem)',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: '40px'
          }}
        >
          Autonomous Adaptive Queue Management Platform
        </p>

        {/* Dynamic Percentage Counter */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: '6px',
            marginBottom: '28px'
          }}
        >
          <span
            className="numeral"
            style={{
              fontSize: 'clamp(4.5rem, 11vw, 8.5rem)',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              color: '#FFFFFF',
              fontVariantNumeric: 'tabular-nums',
              textShadow: '0 0 40px rgba(212, 175, 55, 0.35)'
            }}
          >
            {percent.toString().padStart(2, '0')}
          </span>
          <span
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 700,
              color: 'var(--color-gold)'
            }}
          >
            %
          </span>
        </div>

        {/* Sleek Golden Progress Line */}
        <div
          style={{
            width: 'min(420px, 85vw)',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            margin: '0 auto 20px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percent}%`,
              background: 'linear-gradient(90deg, #B8923F 0%, #D4AF37 50%, #F59E0B 100%)',
              boxShadow: '0 0 16px rgba(212, 175, 55, 0.8)',
              transition: 'width 0.1s linear'
            }}
          />
        </div>

        {/* Status ticker */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.88rem',
            color: 'var(--color-gold)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <Cpu size={15} />
          <span>{statusText}</span>
        </div>
      </div>

      {/* Bottom Controls / Fast Skip */}
      <div
        style={{
          position: 'absolute',
          bottom: '36px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}
      >
        <button
          type="button"
          onClick={handleSkip}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-dim)',
            fontSize: '0.82rem',
            cursor: 'pointer',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-dim)')}
        >
          Skip Intro →
        </button>
      </div>
    </div>
  );
};
