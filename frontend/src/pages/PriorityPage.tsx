import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, HeartHandshake, Baby, Accessibility, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { Layout } from '../components/Layout';
import { VoiceAssistantBar } from '../components/VoiceAssistantBar';
import { useAppStore } from '../store';
import type { PriorityCategory } from '../store';

export const PriorityPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedPriority, setSelectedPriority } = useAppStore();

  const priorityOptions: Array<{
    id: PriorityCategory;
    title: string;
    description: string;
    icon: React.ReactNode;
    badgeText?: string;
  }> = [
    {
      id: 'none',
      title: t('priority.noPriority'),
      description: t('priority.noPriorityDesc'),
      icon: <User size={24} />
    },
    {
      id: 'senior_citizen',
      title: t('priority.senior'),
      description: t('priority.seniorDesc'),
      icon: <HeartHandshake size={24} />,
      badgeText: 'Priority Weight +10'
    },
    {
      id: 'pregnant_woman',
      title: t('priority.pregnant'),
      description: t('priority.pregnantDesc'),
      icon: <Baby size={24} />,
      badgeText: 'Priority Weight +12'
    },
    {
      id: 'differently_abled',
      title: t('priority.disabled'),
      description: t('priority.disabledDesc'),
      icon: <Accessibility size={24} />,
      badgeText: 'Priority Weight +15'
    }
  ];

  const screenSpeech = `${t('priority.title')}. ${t('priority.subtitle')}. ${t('priority.verificationNotice')}.`;

  const handleVoiceCommand = (cmd: string) => {
    if (cmd.includes('senior') || cmd.includes('elderly') || cmd.includes('old')) {
      setSelectedPriority('senior_citizen');
    } else if (cmd.includes('pregnant') || cmd.includes('maternity')) {
      setSelectedPriority('pregnant_woman');
    } else if (cmd.includes('differently') || cmd.includes('disabled') || cmd.includes('disability')) {
      setSelectedPriority('differently_abled');
    } else if (cmd.includes('general') || cmd.includes('none') || cmd.includes('no priority')) {
      setSelectedPriority('none');
    } else if (cmd.includes('continue') || cmd.includes('next')) {
      handleContinue();
    }
  };

  const handleContinue = () => {
    navigate('/token');
  };

  return (
    <Layout stepNumber={7} totalSteps={10} showBack backPath="/services">
      <VoiceAssistantBar screenTextToRead={screenSpeech} onVoiceCommand={handleVoiceCommand} />

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '8px' }}>{t('priority.title')}</h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--color-ink-soft)' }}>
          {t('priority.subtitle')}
        </p>
      </div>

      {/* Verification note always visible */}
      <div
        role="note"
        aria-label="Priority category verification notice"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '16px 20px',
          backgroundColor: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid var(--color-gold)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-subtle)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <AlertTriangle size={20} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span style={{ fontSize: '0.92rem', color: '#FFFFFF', lineHeight: 1.45 }}>
          {t('priority.verificationNotice')}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Priority category options"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '36px'
        }}
      >
        {priorityOptions.map((opt) => {
          const isSelected = selectedPriority === opt.id;
          return (
            <div
              key={opt.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => setSelectedPriority(opt.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedPriority(opt.id)}
              className={`card card-interactive ${isSelected ? 'selected' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '20px',
                padding: '22px'
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
                {opt.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      color: isSelected ? 'var(--color-gold-deep)' : 'var(--color-ink)'
                    }}
                  >
                    {opt.title}
                  </h3>
                  {opt.badgeText && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: '#F7F6F3',
                        color: 'var(--color-gold-deep)',
                        border: '1px solid var(--color-gold-hairline)',
                        padding: '1px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {opt.badgeText}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.94rem', color: 'var(--color-ink-soft)', lineHeight: 1.45 }}>
                  {opt.description}
                </p>
              </div>

              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid var(--color-gold-deep)' : '2px solid var(--color-border)',
                  backgroundColor: isSelected ? 'var(--color-gold-deep)' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '4px'
                }}
              >
                {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleContinue}
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
