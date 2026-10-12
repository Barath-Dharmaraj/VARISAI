import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io, Socket } from 'socket.io-client';
import { Radio, Users, Clock, AlertCircle, CheckCircle2, ArrowRight, Printer, Bell, Volume2 } from 'lucide-react';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { VoiceAssistantBar } from '../components/VoiceAssistantBar';
import { useAppStore } from '../store';

export const LiveQueuePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { confirmedBooking } = useAppStore();

  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [tokensAhead, setTokensAhead] = useState<number>(confirmedBooking?.tokensAhead ?? 0);
  const [myStatus, setMyStatus] = useState<string>(confirmedBooking?.status ?? 'WAITING');
  const [assignedCounter, setAssignedCounter] = useState<number | null>(null);
  const [nowServingList, setNowServingList] = useState<any[]>([]);
  const [openCounters, setOpenCounters] = useState<number>(3);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<string>('');

  const officeId = confirmedBooking?.officeId || '';
  const bookingRef = confirmedBooking?.bookingRef || '';

  useEffect(() => {
    if (!confirmedBooking) {
      navigate('/token');
      return;
    }

    // Initial fetch of current live queue state
    const fetchInitial = async () => {
      try {
        const [queueRes, bookingRes] = await Promise.all([
          axios.get(`/api/bookings/live-queue/${officeId}`),
          axios.get(`/api/bookings/${bookingRef}`)
        ]);

        if (queueRes.data.success) {
          setNowServingList(queueRes.data.nowServingList);
          setOpenCounters(queueRes.data.openCountersCount);
        }

        if (bookingRes.data.success) {
          setTokensAhead(bookingRes.data.booking.tokensAhead);
          setMyStatus(bookingRes.data.booking.status);
          setAssignedCounter(bookingRes.data.booking.counterNumber || null);
        }
      } catch (e) {
        console.error('Error fetching initial queue state:', e);
      }
    };

    fetchInitial();

    // Establish WebSocket Connection
    const socket: Socket = io('/', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join:office', officeId);
      socket.emit('join:booking', bookingRef);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    // Real WebSocket broadcast updates when Admin advances / calls next / completes tokens
    socket.on('queue:update', (payload: any) => {
      if (payload.officeId === officeId) {
        setNowServingList(payload.nowServingList);
        setOpenCounters(payload.openCountersCount);
        setLastUpdateTimestamp(payload.timestamp);
      }
    });

    socket.on('booking:update', (update: any) => {
      if (update.bookingRef === bookingRef) {
        setTokensAhead(update.tokensAhead);
        setMyStatus(update.status);
        if (update.counterNumber) {
          setAssignedCounter(update.counterNumber);
        }

        // If called to counter, play audio announcement!
        if (update.status === 'SERVING' && 'speechSynthesis' in window) {
          const announce = new SpeechSynthesisUtterance(
            `Token ${confirmedBooking.tokenNumber}, please proceed to Counter ${update.counterNumber || 1} immediately.`
          );
          announce.rate = 1.0;
          window.speechSynthesis.speak(announce);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [officeId, bookingRef, confirmedBooking, navigate]);

  if (!confirmedBooking) return null;

  const isNowServingMe = myStatus === 'SERVING';
  const isCompleted = myStatus === 'COMPLETED';

  const screenSpeech = isNowServingMe
    ? `Attention! Token ${confirmedBooking.tokenNumber}. ${t('queue.statusServing', { counter: assignedCounter || 1 })}.`
    : `${t('queue.title')}. Your token is ${confirmedBooking.tokenNumber}. There are ${tokensAhead} tokens ahead in queue.`;

  return (
    <Layout stepNumber={10} totalSteps={10} showBack backPath="/booking">
      <VoiceAssistantBar screenTextToRead={screenSpeech} />

      {/* Real-time Connection Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          backgroundColor: 'rgba(16, 21, 36, 0.85)',
          backdropFilter: 'blur(14px)',
          border: '1px solid var(--color-gold-hairline)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: socketConnected ? 'var(--color-success)' : 'var(--color-error)'
            }}
          />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: socketConnected ? 'var(--color-success)' : 'var(--color-text-dim)' }}>
            {socketConnected ? t('queue.livePushBadge') : 'CONNECTING TO QUEUE STREAM...'}
          </span>
        </div>

        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
          {openCounters} Service Desks Active
        </span>
      </div>

      {/* Serving Alert Banner if Called */}
      {isNowServingMe ? (
        <div
          role="alert"
          style={{
            padding: '24px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '2px solid var(--color-success)',
            borderRadius: 'var(--radius-card)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: 'var(--shadow-card-hover)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <Bell size={32} color="var(--color-success)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--color-success)' }}>
              {t('queue.statusServing', { counter: assignedCounter || 1 })}
            </div>
            <p style={{ fontSize: '0.98rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Please present your digital token and verify documentation with the official.
            </p>
          </div>
        </div>
      ) : isCompleted ? (
        <div
          role="status"
          style={{
            padding: '24px',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            border: '2px solid var(--color-gold)',
            borderRadius: 'var(--radius-card)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backdropFilter: 'blur(12px)'
          }}
        >
          <CheckCircle2 size={32} color="var(--color-gold)" />
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FFFFFF' }}>
              {t('queue.statusCompleted')}
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Your public service transaction has concluded. Thank you for utilizing VARISAI.
            </p>
          </div>
        </div>
      ) : null}

      {/* Primary Status Card */}
      <div
        className="card"
        style={{
          padding: '36px 30px',
          border: '1.5px solid var(--color-gold-hairline)',
          marginBottom: '28px'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            alignItems: 'center'
          }}
        >
          {/* Your Token */}
          <div style={{ borderRight: '1px solid var(--color-border)', paddingRight: '20px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              {t('queue.yourToken')}
            </div>
            <div
              className="token-num"
              style={{
                fontSize: '3.6rem',
                fontWeight: 800,
                color: 'var(--color-ink)',
                lineHeight: 1.1,
                marginTop: '4px'
              }}
            >
              {confirmedBooking.tokenNumber}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--color-gold-deep)', fontWeight: 600, marginTop: '4px', textTransform: 'capitalize' }}>
              Priority: {confirmedBooking.priorityCategory.replace('_', ' ')}
            </div>
          </div>

          {/* Tokens Ahead */}
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              {t('queue.tokensAhead')}
            </div>
            <div
              className="token-num"
              style={{
                fontSize: '3.6rem',
                fontWeight: 800,
                color: isNowServingMe ? 'var(--color-success)' : 'var(--color-gold-deep)',
                lineHeight: 1.1,
                marginTop: '4px'
              }}
            >
              {tokensAhead}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--color-ink-soft)', marginTop: '4px' }}>
              {isNowServingMe ? 'You are being served!' : 'Ahead of you in live queue'}
            </div>
          </div>
        </div>

        {/* Dynamic Queue Progress Bar */}
        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-ink-soft)', marginBottom: '8px', fontWeight: 500 }}>
            <span>Queue Advancement</span>
            <span>
              {tokensAhead === 0 ? 'Your Turn' : `${tokensAhead} tickets remaining`}
            </span>
          </div>

          <div
            style={{
              height: '8px',
              backgroundColor: 'var(--color-paper-dim)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-pill)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: isNowServingMe
                  ? '100%'
                  : `${Math.max(10, Math.min(95, 100 - tokensAhead * 15))}%`,
                backgroundColor: isNowServingMe ? 'var(--color-success)' : 'var(--color-gold)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* Now Serving Desks Real-Time Grid */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '14px' }}>{t('queue.nowServing')}</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '14px'
          }}
        >
          {nowServingList.length > 0 ? (
            nowServingList.map((desk, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  padding: '18px',
                  border: desk.tokenNumber === confirmedBooking.tokenNumber
                    ? '2px solid var(--color-gold)'
                    : '1px solid var(--color-gold-hairline)',
                  backgroundColor: desk.tokenNumber === confirmedBooking.tokenNumber
                    ? 'rgba(212, 175, 55, 0.15)'
                    : 'rgba(16, 21, 36, 0.9)',
                  boxShadow: desk.tokenNumber === confirmedBooking.tokenNumber
                    ? '0 0 20px rgba(212, 175, 55, 0.25)'
                    : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(212, 175, 55, 0.2)',
                      color: 'var(--color-gold)',
                      border: '1px solid var(--color-gold-hairline)',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    Counter {desk.counterNumber}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 700 }}>
                    SERVING
                  </span>
                </div>

                <div className="token-num" style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', textShadow: '0 0 16px rgba(212, 175, 55, 0.3)' }}>
                  {desk.tokenNumber}
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {desk.staffName}
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-ink-soft)', gridColumn: '1 / -1' }}>
              Counters are currently ready. Next tokens will be announced shortly.
            </div>
          )}
        </div>
      </div>

      {/* Print Slip Shortcut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)', margin: 0 }}>
          {t('queue.refreshNotice')}
        </p>

        <button
          type="button"
          onClick={() => navigate('/print')}
          className="btn-secondary"
        >
          <Printer size={18} />
          <span>{t('printBtn')}</span>
        </button>
      </div>
    </Layout>
  );
};
