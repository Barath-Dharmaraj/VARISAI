import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ArrowRight } from 'lucide-react';
import { Layout } from '../components/Layout';
import { VoiceAssistantBar } from '../components/VoiceAssistantBar';
import { useAppStore } from '../store';
import { LANGUAGES } from '../i18n';

export const LanguagePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, setLanguage } = useAppStore();

  const screenSpeech = `${t('language.title')}. ${t('language.subtitle')}. Currently selected language is ${LANGUAGES.find(l => l.code === language)?.name}.`;

  const handleVoiceCommand = (cmd: string) => {
    const matched = LANGUAGES.find(
      l => cmd.includes(l.name.toLowerCase()) || cmd.includes(l.nativeName.toLowerCase()) || cmd.includes(l.code)
    );
    if (matched) {
      setLanguage(matched.code);
    } else if (cmd.includes('continue') || cmd.includes('next') || cmd.includes('proceed')) {
      navigate('/offices');
    }
  };

  const handleContinue = () => {
    navigate('/offices');
  };

  return (
    <Layout stepNumber={1} totalSteps={10}>
      <VoiceAssistantBar screenTextToRead={screenSpeech} onVoiceCommand={handleVoiceCommand} />

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#FFFFFF' }}>{t('language.title')}</h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)' }}>
          {t('language.subtitle')}
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label={t('language.ariaLabel')}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '36px'
        }}
      >
        {LANGUAGES.map((item) => {
          const isSelected = language === item.code;
          return (
            <div
              key={item.code}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => setLanguage(item.code)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setLanguage(item.code)}
              className={`card card-interactive ${isSelected ? 'selected' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px',
                minHeight: '74px'
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: isSelected ? 'var(--color-gold)' : '#FFFFFF'
                  }}
                >
                  {item.nativeName}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {item.name}
                </div>
              </div>

              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid var(--color-gold)' : '2px solid var(--color-border)',
                  backgroundColor: isSelected ? 'var(--color-gold)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isSelected && <Check size={14} color="#07090E" strokeWidth={3} />}
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
