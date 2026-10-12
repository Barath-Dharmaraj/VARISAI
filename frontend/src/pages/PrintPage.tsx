import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ArrowLeft, ShieldCheck, MapPin, Clock } from 'lucide-react';
import axios from 'axios';
import { useAppStore } from '../store';

export const PrintPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { confirmedBooking } = useAppStore();
  const [networkBaseUrl, setNetworkBaseUrl] = useState<string>('');

  useEffect(() => {
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
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const booking = confirmedBooking || {
    bookingRef: 'VAR-2026-0841',
    tokenNumber: 'P-101',
    officeName: 'State Bank of India — Collectorate Complex Branch',
    officeAddress: 'District Collectorate Campus, Rajaji Salai, Chennai',
    serviceName: 'Senior Citizen Pension Disbursement & Life Certificate',
    priorityCategory: 'senior_citizen',
    predictedWaitMinutes: 12.0,
    createdAt: new Date().toISOString()
  };

  const qrVerifyUrl = `${networkBaseUrl || window.location.origin}/token-verify?ref=${booking.bookingRef}`;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F7F6F3',
        padding: '32px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* On-screen navigation controls (hidden on print) */}
      <div
        className="no-print"
        style={{
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/queue')}
          className="btn-secondary"
          style={{ minHeight: '44px', padding: '0 16px', fontSize: '0.92rem' }}
        >
          <ArrowLeft size={16} />
          <span>{t('print.backToLive')}</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="btn-primary"
          style={{ minHeight: '44px', padding: '0 20px', fontSize: '0.92rem' }}
        >
          <Printer size={16} />
          <span>{t('print.printAction')}</span>
        </button>
      </div>

      {/* Official Printed Token Receipt Slip */}
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          border: '2px solid #0A0A0A',
          borderRadius: 'var(--radius-sm)',
          padding: '36px 28px',
          boxShadow: 'var(--shadow-card)',
          color: '#0A0A0A'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px dashed #0A0A0A', paddingBottom: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck size={20} color="#0A0A0A" />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.04em' }}>
              VARISAI
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--color-ink-soft)' }}>
            {t('print.disclaimer')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-soft)', marginTop: '4px' }}>
            Government of Tamil Nadu Public Administration
          </div>
        </div>

        {/* Large Token Number */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: 'var(--color-ink-soft)' }}>
            TOKEN NUMBER
          </div>
          <div
            className="token-num"
            style={{
              fontSize: '4.2rem',
              fontWeight: 800,
              lineHeight: 1,
              marginTop: '6px',
              color: '#0A0A0A'
            }}
          >
            {booking.tokenNumber}
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '2px 10px',
              backgroundColor: '#0A0A0A',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Tier: {booking.priorityCategory.replace('_', ' ')}
          </div>
        </div>

        {/* Verifiable QR Code */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              padding: '10px',
              border: '1px solid #0A0A0A',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-block',
              backgroundColor: '#FFFFFF'
            }}
          >
            <QRCodeSVG
              value={qrVerifyUrl}
              size={135}
              level="M"
              fgColor="#0A0A0A"
              bgColor="#FFFFFF"
            />
          </div>
          <div className="numeral" style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: '6px' }}>
            REF: {booking.bookingRef}
          </div>
        </div>

        {/* Details Table */}
        <div style={{ borderTop: '1px solid #E4E2DC', paddingTop: '16px', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ color: 'var(--color-ink-soft)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
              Office Location
            </div>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>{booking.officeName}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-soft)' }}>{booking.officeAddress}</div>
          </div>

          <div>
            <div style={{ color: 'var(--color-ink-soft)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
              Service Desk
            </div>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>{booking.serviceName}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px dotted #E4E2DC' }}>
            <span style={{ color: 'var(--color-ink-soft)' }}>Booking Issued:</span>
            <span className="numeral" style={{ fontWeight: 600 }}>
              {new Date(booking.createdAt).toLocaleDateString()} {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px dashed #0A0A0A', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-ink-soft)', lineHeight: 1.4 }}>
          Please retain this physical or digital slip. Proceed to the designated desk when your token is called. Present relevant ID credentials if priority assistance is claimed.
        </div>
      </div>
    </div>
  );
};
