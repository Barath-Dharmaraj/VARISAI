import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, ArrowLeft, ShieldCheck, Accessibility, ZoomIn, ZoomOut, User } from 'lucide-react';
import { useAppStore } from '../store';
import { LANGUAGES } from '../i18n';

interface LayoutProps {
  children: React.ReactNode;
  stepNumber?: number;
  totalSteps?: number;
  showBack?: boolean;
  backPath?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  stepNumber,
  totalSteps = 10,
  showBack = false,
  backPath
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, staffUser, logoutStaff, citizenUser, logoutCitizen } = useAppStore();
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoom = (delta: number) => {
    const next = Math.max(90, Math.min(140, zoomLevel + delta));
    setZoomLevel(next);
    document.documentElement.style.fontSize = `${(next / 100) * 16}px`;
  };

  const handleBrandClick = () => {
    if (citizenUser) {
      navigate('/language');
    } else if (staffUser) {
      navigate('/admin');
    } else {
      navigate('/login');
    }
  };

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
        color: 'var(--color-text-main)'
      }}
    >
      {/* AgentFlow Glassmorphic Government Masthead */}
      <header
        role="banner"
        style={{
          backgroundColor: 'rgba(7, 9, 14, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--color-gold-hairline)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div
          style={{
            maxWidth: '1080px',
            margin: '0 auto',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {showBack && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go back to previous step"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <div
              style={{ cursor: 'pointer' }}
              onClick={handleBrandClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleBrandClick()}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #D4AF37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  VARISAI
                </span>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-gold)',
                    fontWeight: 700,
                    letterSpacing: '0.04em'
                  }}
                >
                  வரிசை
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)', margin: 0, letterSpacing: '0.02em' }}>
                Adaptive Public Service Queue Portal
              </p>
            </div>
          </div>

          {/* Right Header Utilities: Zoom + Language Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Elderly Font Scaler */}
            <div
              style={{
                display: 'none',
                alignItems: 'center',
                backgroundColor: 'var(--color-paper-dim)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '2px 4px'
              }}
              className="zoom-controls"
            >
              <button
                type="button"
                onClick={() => handleZoom(-10)}
                aria-label="Decrease text size"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ZoomOut size={15} />
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0 4px' }}>
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => handleZoom(10)}
                aria-label="Increase text size"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ZoomIn size={15} />
              </button>
            </div>

            {/* Language Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={16} color="var(--color-gold-deep)" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Switch active application language"
                style={{
                  height: '38px',
                  padding: '0 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-gold-hairline)',
                  backgroundColor: 'rgba(16, 21, 36, 0.95)',
                  color: '#FFFFFF',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} style={{ backgroundColor: '#0C0F19', color: '#FFFFFF' }}>
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Citizen Portal Access / Status */}
            {citizenUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/language')}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--color-gold)',
                    backgroundColor: 'rgba(212, 175, 55, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title={`Logged in Citizen: ${citizenUser.name} (${citizenUser.email})`}
                >
                  <User size={14} color="var(--color-gold)" />
                  <span>{citizenUser.name.split(' ')[0]}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logoutCitizen();
                    navigate('/login');
                  }}
                  style={{
                    height: '38px',
                    padding: '0 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Sign Out Citizen"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Staff Portal / Desk Access */}
            {staffUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--color-gold)',
                    backgroundColor: location.pathname === '/admin' ? 'var(--color-gold)' : 'rgba(212, 175, 55, 0.15)',
                    color: location.pathname === '/admin' ? '#07090E' : 'var(--color-gold)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    letterSpacing: '0.03em'
                  }}
                  title={`Official: ${staffUser.name} (${staffUser.staffId || staffUser.email})`}
                >
                  <ShieldCheck size={15} />
                  <span>Admin Desk</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logoutStaff();
                    navigate('/login?type=staff');
                  }}
                  style={{
                    height: '38px',
                    padding: '0 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Logout from Staff Portal"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Unauthenticated Access Button */}
            {!citizenUser && !staffUser && location.pathname !== '/login' && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  height: '38px',
                  padding: '0 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--color-gold)',
                  backgroundColor: 'rgba(212, 175, 55, 0.12)',
                  color: 'var(--color-gold)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Step Progression Bar (Citizen Flow) */}
        {stepNumber && (
          <div
            style={{
              backgroundColor: 'rgba(12, 15, 25, 0.85)',
              borderTop: '1px solid var(--color-border)',
              padding: '8px 20px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div
              style={{
                maxWidth: '1080px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-gold-deep)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                {t('stepIndicator', { current: stepNumber, total: totalSteps })}
              </span>
              <div
                style={{
                  width: '160px',
                  height: '5px',
                  backgroundColor: 'var(--color-border)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(stepNumber / totalSteps) * 100}%`,
                    backgroundColor: 'var(--color-gold)',
                    transition: 'width 0.25s ease'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main
        id="main-content"
        role="main"
        style={{
          flex: 1,
          maxWidth: '820px',
          width: '100%',
          margin: '0 auto',
          padding: '32px 20px 60px 20px'
        }}
      >
        {children}
      </main>

      {/* Footer */}
      <footer
        role="contentinfo"
        style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid var(--color-gold-hairline)',
          padding: '24px 20px',
          marginTop: 'auto'
        }}
      >
        <div
          style={{
            maxWidth: '1040px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--color-gold-deep)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>
              Official Public Service Token Allocation • Machine Learning Assisted Scheduling
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-ink-soft)' }}>
              Toll-Free Senior & Disability Helpdesk: 1800-425-2424
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
