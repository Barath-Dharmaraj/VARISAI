import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { VoiceAssistantBar } from '../components/VoiceAssistantBar';
import { useAppStore } from '../store';
import { LANGUAGES } from '../i18n';

export const LanguagePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    language,
    setLanguage,
    citizenUser,
    email,
    userName,
    isOtpVerified,
    setDemoOtp,
    setEmailDelivered,
    setIsRealInbox,
    setPreviewUrl
  } = useAppStore();

  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);

  const screenSpeech = `${t('language.title')}. ${t('language.subtitle')}. Currently selected language is ${LANGUAGES.find(l => l.code === language)?.name}.`;

  const handleContinue = async () => {
    // If already verified in this session, proceed straight to offices
    if (isOtpVerified) {
      navigate('/offices');
      return;
    }

    const targetEmail = email || citizenUser?.email;
    const targetName = userName || citizenUser?.name;

    if (!targetEmail) {
      navigate('/login');
      return;
    }

    setIsSendingOtp(true);
    try {
      const isRender = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');
      const apiBase = import.meta.env.VITE_API_URL || (isRender ? 'https://varisai-backend.onrender.com' : '');
      const res = await axios.post(
        `${apiBase}/api/auth/send-otp`,
        {
          email: targetEmail,
          name: targetName,
          userType: 'CITIZEN'
        },
        { timeout: 3500 }
      );
      if (res.data.success) {
        setDemoOtp(res.data.otp);
        setEmailDelivered(Boolean(res.data.emailDelivered));
        setIsRealInbox(Boolean(res.data.isRealInbox));
        setPreviewUrl(res.data.previewUrl || null);
      }
    } catch (err) {
      console.warn("Failed sending initial OTP:", err);
      // Fallback code so user is never blocked
      setDemoOtp('5678');
    } finally {
      setIsSendingOtp(false);
      navigate('/otp');
    }
  };

  const handleVoiceCommand = (cmd: string) => {
    const matched = LANGUAGES.find(
      l => cmd.includes(l.name.toLowerCase()) || cmd.includes(l.nativeName.toLowerCase()) || cmd.includes(l.code)
    );
    if (matched) {
      setLanguage(matched.code);
    } else if (cmd.includes('continue') || cmd.includes('next') || cmd.includes('proceed')) {
      handleContinue();
    }
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setLanguage(item.code);
                }
              }}
              className="card"
              style={{
                padding: '20px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderColor: isSelected ? 'var(--color-gold)' : undefined,
                backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.08)' : undefined,
                boxShadow: isSelected ? '0 0 20px rgba(212, 175, 55, 0.2)' : undefined,
                outline: 'none',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {item.nativeName}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                  {item.name}
                </div>
              </div>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid var(--color-gold)' : '2px solid rgba(255, 255, 255, 0.2)',
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
          disabled={isSendingOtp}
          style={{ width: '100%', maxWidth: '280px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {isSendingOtp ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Sending Verification Code...</span>
            </>
          ) : (
            <>
              <span>{t('continueBtn')}</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </Layout>
  );
};
