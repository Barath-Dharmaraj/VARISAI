import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MailCheck, ArrowRight, RotateCcw, ArrowLeft, AlertCircle, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { VoiceAssistantBar } from '../components/VoiceAssistantBar';
import { useAppStore } from '../store';

export const OtpPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    citizenUser,
    email: storeEmail,
    userName: storeName,
    demoOtp,
    setDemoOtp,
    setOtpVerified,
    emailDelivered,
    setEmailDelivered,
    isRealInbox,
    setIsRealInbox,
    previewUrl,
    setPreviewUrl,
    setCitizenUser,
    setSelectedPriority
  } = useAppStore();

  const email = storeEmail || citizenUser?.email || '';
  const userName = storeName || citizenUser?.name || '';

  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [showBackupCode, setShowBackupCode] = useState<boolean>(!emailDelivered && !previewUrl);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    if (!email && !citizenUser) {
      navigate('/login');
      return;
    }

    if (!demoOtp && email) {
      const isRender = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');
      const apiBase = import.meta.env.VITE_API_URL || (isRender ? 'https://varisai-backend.onrender.com' : '');
      axios.post(
        `${apiBase}/api/auth/send-otp`,
        {
          email,
          name: userName,
          userType: 'CITIZEN'
        },
        { timeout: 4000 }
      ).then((res) => {
        if (res.data.success) {
          setDemoOtp(res.data.otp);
          setEmailDelivered(Boolean(res.data.emailDelivered));
          setIsRealInbox(Boolean(res.data.isRealInbox));
          setPreviewUrl(res.data.previewUrl || null);
        }
      }).catch((err) => {
        console.warn("Auto-send OTP notice:", err);
        // Ensure demoOtp is available as backup
        if (!demoOtp) setDemoOtp('5678');
      });
    }
  }, [email, citizenUser, demoOtp, navigate, userName, setDemoOtp, setEmailDelivered, setIsRealInbox, setPreviewUrl]);

  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const activeCode = demoOtp || '5678';
  const screenSpeech = `${t('otp.title')}. ${t('otp.sentTo', { email })}. ${t('otp.demoNotice', { code: activeCode })}`;

  const handleAutoFill = () => {
    const code = (demoOtp || '5678').slice(0, 4);
    setDigits(code.split(''));
    setErrorMsg('');
    inputRefs[3].current?.focus();
  };

  const handleDigitChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setErrorMsg('');

    if (char && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVoiceCommand = (cmd: string) => {
    const raw = cmd.replace(/\D/g, '');
    if (raw.length === 4) {
      setDigits(raw.split(''));
    }
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    setErrorMsg('');

    try {
      const isRender = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');
      const apiBase = import.meta.env.VITE_API_URL || (isRender ? 'https://varisai-backend.onrender.com' : '');
      const response = await axios.post(
        `${apiBase}/api/auth/send-otp`,
        {
          email,
          name: userName,
          userType: 'CITIZEN'
        },
        { timeout: 4000 }
      );
      if (response.data.success) {
        setDemoOtp(response.data.otp);
        setEmailDelivered(Boolean(response.data.emailDelivered));
        setIsRealInbox(Boolean(response.data.isRealInbox));
        setPreviewUrl(response.data.previewUrl || null);
        setTimerSeconds(60);
        setDigits(['', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch (err: any) {
      setErrorMsg('Failed to resend code to email. Using session fallback code.');
      if (!demoOtp) setDemoOtp('5678');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredCode = digits.join('');
    if (enteredCode.length !== 4) {
      setErrorMsg('Please enter all 4 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      const isRender = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');
      const apiBase = import.meta.env.VITE_API_URL || (isRender ? 'https://varisai-backend.onrender.com' : '');
      const response = await axios.post(
        `${apiBase}/api/auth/verify-otp`,
        {
          email,
          otp: enteredCode,
          name: userName
        },
        { timeout: 5000 }
      );

      if (response.data.success) {
        setOtpVerified(true);
        sessionStorage.setItem('varisai_citizen_verified', 'true');
        if (response.data.user) {
          setCitizenUser(response.data.user);
          if (response.data.user.priorityCategory) {
            setSelectedPriority(response.data.user.priorityCategory);
          }
        }
        navigate('/offices');
      } else {
        setErrorMsg(response.data.error || 'Verification failed');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Incorrect OTP code. Please enter the code sent to your email or click Auto-fill.');
    } finally {
      setIsVerifying(false);
    }
  };

  const fullCodeEntered = digits.every((d) => d.length === 1);

  return (
    <Layout stepNumber={2} totalSteps={10} showBack backPath="/language">
      <VoiceAssistantBar screenTextToRead={screenSpeech} onVoiceCommand={handleVoiceCommand} />

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#FFFFFF' }}>{t('otp.title')}</h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)' }}>
          {t('otp.sentTo', { email })}
        </p>
      </div>

      {/* Official Email Notice Box */}
      <div
        role="status"
        aria-live="polite"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          padding: '18px 20px',
          backgroundColor: 'rgba(212, 175, 55, 0.08)',
          border: '1.5px solid var(--color-gold-hairline)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-subtle)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <MailCheck size={26} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gold)', fontWeight: 700 }}>
            {isRealInbox ? 'Official Email Dispatched to Personal Inbox' : 'Email Verification Service'}
          </div>
          
          {isRealInbox ? (
            <div style={{ fontSize: '0.96rem', color: '#FFFFFF', lineHeight: 1.5, marginTop: '4px' }}>
              A 4-digit verification code has been dispatched directly to your inbox: <strong style={{ color: 'var(--color-gold)' }}>{email}</strong>.
              <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Please check your inbox (and Spam/Junk folder if not visible immediately).
              </div>
            </div>
          ) : previewUrl ? (
            <div style={{ fontSize: '0.96rem', color: '#FFFFFF', lineHeight: 1.5, marginTop: '4px' }}>
              Email dispatched for <strong>{email}</strong>. You can view the full rendered email in the live inbox viewer:
              <div style={{ marginTop: '8px' }}>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-gold)',
                    color: '#07090E',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <span>Open Delivered Email Inbox</span>
                  <ExternalLink size={14} color="#07090E" />
                </a>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.96rem', color: '#FFFFFF', lineHeight: 1.5, marginTop: '4px' }}>
              Verification code generated for <strong>{email}</strong>.
            </div>
          )}

          {/* Active Session Verification Code Badge with Instant Auto-fill */}
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', backgroundColor: 'rgba(255, 255, 255, 0.06)', border: '1.5px solid var(--color-gold-hairline)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Official Code:</span>
              <span className="numeral" style={{ letterSpacing: '0.15em', color: 'var(--color-gold)', fontWeight: 700, fontSize: '1.25rem' }}>
                {activeCode}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAutoFill}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                backgroundColor: 'var(--color-gold)',
                color: '#07090E',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <span>⚡ Auto-fill Code</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '36px 32px', marginBottom: '28px' }}>
        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#FFFFFF',
                marginBottom: '16px',
                textAlign: 'center'
              }}
            >
              Enter 4-Digit Email Code
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px'
              }}
            >
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  autoFocus={idx === 0}
                  aria-label={t('otp.enterDigitAria', { index: idx + 1 })}
                  className="numeral"
                  style={{
                    width: '64px',
                    height: '68px',
                    textAlign: 'center',
                    fontSize: '1.85rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    border: digit
                      ? '2px solid var(--color-gold)'
                      : errorMsg
                      ? '2px solid var(--color-error)'
                      : '1.5px solid var(--color-border)',
                    backgroundColor: digit ? 'rgba(212, 175, 55, 0.12)' : 'var(--bg-input)',
                    color: digit ? 'var(--color-gold)' : '#FFFFFF',
                    boxShadow: digit ? '0 0 16px rgba(212, 175, 55, 0.2)' : 'var(--shadow-subtle)',
                    outline: 'none'
                  }}
                />
              ))}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleAutoFill}
                style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid var(--color-gold-hairline)',
                  borderRadius: 'var(--radius-pill)',
                  color: 'var(--color-gold)',
                  padding: '6px 18px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>⚡ Auto-fill Code: <strong style={{ letterSpacing: '0.08em' }}>{activeCode}</strong></span>
              </button>
            </div>
          </div>

          {/* Error display */}
          {errorMsg && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '12px',
                marginBottom: '16px',
                color: 'var(--color-error)',
                fontSize: '0.92rem',
                fontWeight: 500
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Recovery paths */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '20px',
              borderTop: '1px solid var(--color-border)',
              marginTop: '24px'
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--color-ink-soft)',
                fontSize: '0.92rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                padding: '6px 0'
              }}
            >
              <ArrowLeft size={16} />
              <span>Change Email Address</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {timerSeconds > 0 ? (
                <span style={{ fontSize: '0.9rem', color: 'var(--color-ink-soft)' }} className="numeral">
                  {t('otp.timerText', { seconds: timerSeconds })}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-gold-deep)',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={15} />
                  <span>{isResending ? 'Sending...' : t('resendOtpBtn')}</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={!fullCodeEntered || isVerifying}
              className="btn-primary"
              style={{ width: '100%', maxWidth: '280px' }}
            >
              <span>{isVerifying ? 'Verifying...' : t('continueBtn')}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
