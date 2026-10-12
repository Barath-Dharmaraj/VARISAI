import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Clock, MapPin, Printer, ArrowRight, ShieldCheck, FileText, Smartphone } from 'lucide-react';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { VoiceAssistantBar } from '../components/VoiceAssistantBar';
import { useAppStore } from '../store';

export const BookingConfirmationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { confirmedBooking } = useAppStore();
  const [networkBaseUrl, setNetworkBaseUrl] = useState<string>('');

  useEffect(() => {
    if (!confirmedBooking) {
      navigate('/token');
      return;
    }

    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setNetworkBaseUrl(window.location.origin);
      return;
    }

    axios.get('/api/system/network-info')
      .then((res) => {
        if (res.data.success && res.data.mobileBaseUrl) {
          setNetworkBaseUrl(res.data.mobileBaseUrl);
        }
      })
      .catch(() => {
        setNetworkBaseUrl(window.location.origin);
      });
  }, [confirmedBooking, navigate]);

  if (!confirmedBooking) {
    return null;
  }

  // Calculate recommended arrival time based on current time + predicted wait - 10 minutes
  const arrivalDate = new Date(Date.now() + Math.max(0, confirmedBooking.predictedWaitMinutes - 10) * 60 * 1000);
  const formattedArrivalTime = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const screenSpeech = `${t('booking.title')}. Your token number is ${confirmedBooking.tokenNumber}. Booking reference is ${confirmedBooking.bookingRef}. ${t('booking.arrivalInstruction', { time: formattedArrivalTime })}.`;

  const handleVoiceCommand = (cmd: string) => {
    if (cmd.includes('queue') || cmd.includes('track') || cmd.includes('live')) {
      navigate('/queue');
    } else if (cmd.includes('print')) {
      navigate('/print');
    }
  };

  const qrVerifyUrl = `${networkBaseUrl || window.location.origin}/token-verify?ref=${confirmedBooking.bookingRef}`;

  return (
    <Layout stepNumber={9} totalSteps={10} showBack backPath="/token">
      <VoiceAssistantBar screenTextToRead={screenSpeech} onVoiceCommand={handleVoiceCommand} />

      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success)', color: 'var(--color-success)', padding: '6px 14px', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>
          <CheckCircle2 size={16} />
          <span>TOKEN ALLOCATED SUCCESSFULLY</span>
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#FFFFFF' }}>{t('booking.title')}</h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)' }}>
          {t('booking.subtitle')}
        </p>
      </div>

      {/* Main Token Display Card (AgentFlow Dark-Luxe High-Contrast) */}
      <div
        className="card"
        style={{
          padding: '36px 32px',
          border: '1.5px solid var(--color-gold)',
          boxShadow: 'var(--shadow-card-hover)',
          marginBottom: '28px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(18px)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
            paddingBottom: '28px',
            borderBottom: '1px solid var(--color-gold-hairline)'
          }}
        >
          {/* Token Number */}
          <div>
            <div style={{ fontSize: '0.88rem', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              {t('booking.tokenNumberLabel')}
            </div>
            <div
              className="token-num"
              style={{
                fontSize: '3.8rem',
                fontWeight: 800,
                color: '#FFFFFF',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                marginTop: '4px',
                textShadow: '0 0 24px rgba(212, 175, 55, 0.35)'
              }}
            >
              {confirmedBooking.tokenNumber}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                marginTop: '8px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--color-gold)',
                color: 'var(--color-gold)',
                fontSize: '0.82rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Priority Tier: {confirmedBooking.priorityCategory.replace('_', ' ')}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
              Citizen Email: <strong style={{ color: '#FFFFFF' }}>{confirmedBooking.email}</strong>
            </div>
          </div>

          {/* Verifiable QR Code (High-Contrast Camera Scannable) */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                padding: '12px',
                backgroundColor: '#FFFFFF',
                border: '2px solid var(--color-gold)',
                borderRadius: 'var(--radius-md)',
                display: 'inline-block',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.25)'
              }}
              title="Click or scan to view verified token details"
              onClick={() => navigate(`/token-verify?ref=${confirmedBooking.bookingRef}`)}
            >
              <QRCodeSVG
                value={qrVerifyUrl}
                size={130}
                level="M"
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
            <div className="numeral" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', marginTop: '8px' }}>
              Ref: {confirmedBooking.bookingRef}
            </div>
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', color: 'var(--color-gold)', fontSize: '0.82rem', fontWeight: 600 }}>
              <Smartphone size={14} />
              <span>Scan with mobile camera</span>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/token-verify?ref=${confirmedBooking.bookingRef}`)}
              style={{
                marginTop: '4px',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                fontSize: '0.78rem',
                textDecoration: 'underline',
                cursor: 'pointer',
                display: 'block',
                margin: '4px auto 0'
              }}
            >
              Desktop preview →
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            paddingTop: '24px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              {t('booking.officeLabel')}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', marginTop: '4px' }}>
              {confirmedBooking.officeName}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={14} color="var(--color-gold)" />
              <span>{confirmedBooking.officeAddress}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              {t('booking.serviceLabel')}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF', marginTop: '4px' }}>
              {confirmedBooking.serviceName}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Average Duration: <strong style={{ color: 'var(--color-gold)' }}>{confirmedBooking.avgServiceMinutes} mins</strong>
            </div>
          </div>
        </div>

        {/* Real Computed Arrive 10 Mins Before Warning */}
        <div
          style={{
            marginTop: '28px',
            padding: '18px 22px',
            backgroundColor: 'rgba(212, 175, 55, 0.08)',
            border: '1.5px solid var(--color-gold)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Clock size={24} color="var(--color-gold)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gold)' }}>
              {t('booking.recommendedArrival')}
            </div>
            <div style={{ fontSize: '0.98rem', color: '#FFFFFF', fontWeight: 600, marginTop: '2px' }}>
              {t('booking.arrivalInstruction', { time: formattedArrivalTime })}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/print')}
          className="btn-secondary"
          style={{ minWidth: '200px' }}
        >
          <Printer size={18} />
          <span>{t('booking.printBtn')}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/queue')}
          className="btn-primary"
          style={{ minWidth: '240px' }}
        >
          <span>{t('booking.trackLiveBtn')}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </Layout>
  );
};
