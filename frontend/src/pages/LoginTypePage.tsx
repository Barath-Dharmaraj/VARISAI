import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Briefcase, ArrowRight, Check } from 'lucide-react';
import { Layout } from '../components/Layout';
import { VoiceAssistantBar } from '../components/VoiceAssistantBar';
import { useAppStore } from '../store';

export const LoginTypePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setLoginType } = useAppStore();
  const [selectedType, setSelectedType] = useState<'CITIZEN' | 'STAFF'>('CITIZEN');

  const screenSpeech = `${t('loginType.title')}. Option 1: ${t('loginType.citizenTitle')}. Option 2: ${t('loginType.staffTitle')}.`;

  const handleVoiceCommand = (cmd: string) => {
    if (cmd.includes('citizen') || cmd.includes('public') || cmd.includes('people')) {
      setSelectedType('CITIZEN');
    } else if (cmd.includes('staff') || cmd.includes('official') || cmd.includes('admin')) {
      setSelectedType('STAFF');
    } else if (cmd.includes('continue') || cmd.includes('next')) {
      handleProceed();
    }
  };

  const handleProceed = () => {
    setLoginType(selectedType);
    if (selectedType === 'CITIZEN') {
      navigate('/login');
    } else {
      navigate('/staff-login');
    }
  };

  return (
    <Layout stepNumber={2} totalSteps={10} showBack backPath="/language">
      <VoiceAssistantBar screenTextToRead={screenSpeech} onVoiceCommand={handleVoiceCommand} />

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '8px' }}>{t('loginType.title')}</h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--color-ink-soft)' }}>
          {t('loginType.subtitle')}
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Portal access selection"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          marginBottom: '36px'
        }}
      >
        {/* Option 1: Citizen */}
        <div
          role="radio"
          aria-checked={selectedType === 'CITIZEN'}
          tabIndex={0}
          onClick={() => setSelectedType('CITIZEN')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedType('CITIZEN')}
          className={`card card-interactive ${selectedType === 'CITIZEN' ? 'selected' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '20px',
            padding: '24px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-paper-dim)',
              border: '1px solid var(--color-gold-hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-gold-deep)',
              flexShrink: 0
            }}
          >
            <Users size={24} />
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: selectedType === 'CITIZEN' ? 'var(--color-gold-deep)' : 'var(--color-ink)',
                marginBottom: '4px'
              }}
            >
              {t('loginType.citizenTitle')}
            </div>
            <p style={{ fontSize: '0.98rem', color: 'var(--color-ink-soft)', lineHeight: 1.45 }}>
              {t('loginType.citizenDesc')}
            </p>
          </div>

          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: selectedType === 'CITIZEN' ? '2px solid var(--color-gold-deep)' : '2px solid var(--color-border)',
              backgroundColor: selectedType === 'CITIZEN' ? 'var(--color-gold-deep)' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {selectedType === 'CITIZEN' && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </div>
        </div>

        {/* Option 2: Staff */}
        <div
          role="radio"
          aria-checked={selectedType === 'STAFF'}
          tabIndex={0}
          onClick={() => setSelectedType('STAFF')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedType('STAFF')}
          className={`card card-interactive ${selectedType === 'STAFF' ? 'selected' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '20px',
            padding: '24px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-paper-dim)',
              border: '1px solid var(--color-gold-hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-gold-deep)',
              flexShrink: 0
            }}
          >
            <Briefcase size={24} />
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: selectedType === 'STAFF' ? 'var(--color-gold-deep)' : 'var(--color-ink)',
                marginBottom: '4px'
              }}
            >
              {t('loginType.staffTitle')}
            </div>
            <p style={{ fontSize: '0.98rem', color: 'var(--color-ink-soft)', lineHeight: 1.45 }}>
              {t('loginType.staffDesc')}
            </p>
          </div>

          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: selectedType === 'STAFF' ? '2px solid var(--color-gold-deep)' : '2px solid var(--color-border)',
              backgroundColor: selectedType === 'STAFF' ? 'var(--color-gold-deep)' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {selectedType === 'STAFF' && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleProceed}
          className="btn-primary"
          style={{ width: '100%', maxWidth: '280px' }}
        >
          <span>{t('continueBtn')}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </Layout>
  );
};
