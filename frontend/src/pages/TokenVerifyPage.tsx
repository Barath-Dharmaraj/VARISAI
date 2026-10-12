import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, Clock, MapPin, Building, User, Mail, ArrowRight, Printer, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { Layout } from '../components/Layout';

export const TokenVerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingRef = searchParams.get('ref') || '';

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!bookingRef) {
      setErrorMsg('No booking reference provided in QR scan URL.');
      setIsLoading(false);
      return;
    }

    const fetchTokenDetails = async () => {
      try {
        const response = await axios.get(`/api/bookings/${bookingRef}`);
        if (response.data.success) {
          setBooking(response.data.booking);
        } else {
          setErrorMsg('Token not found in official registry.');
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Invalid or unverified token reference.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenDetails();
  }, [bookingRef]);

  return (
    <Layout>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Verification Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--color-success)',
              border: '1px solid var(--color-success)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.88rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              marginBottom: '10px'
            }}
          >
            <ShieldCheck size={18} />
            <span>OFFICIAL QR VERIFICATION SUCCESSFUL</span>
          </div>
          <h1 style={{ fontSize: '1.9rem', marginBottom: '6px' }}>Digital Token Verified</h1>
          <p style={{ fontSize: '0.98rem', color: 'var(--color-ink-soft)' }}>
            Official Government Public Service Digital Queue Record
          </p>
        </div>

        {isLoading ? (
          <div className="card" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-ink-soft)' }}>
            Verifying token credentials with central registry...
          </div>
        ) : errorMsg ? (
          <div className="card" style={{ padding: '36px 24px', textAlign: 'center', borderColor: 'var(--color-error)' }}>
            <AlertTriangle size={36} color="var(--color-error)" style={{ margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '1.3rem', color: 'var(--color-error)', marginBottom: '8px' }}>Verification Error</h2>
            <p style={{ color: 'var(--color-ink-soft)', marginBottom: '20px' }}>{errorMsg}</p>
            <button type="button" onClick={() => navigate('/language')} className="btn-secondary">
              Back to Home
            </button>
          </div>
        ) : booking ? (
          <div
            className="card"
            style={{
              padding: '36px 28px',
              border: '2px solid var(--color-gold)',
              boxShadow: '0 0 30px rgba(212, 175, 55, 0.2)',
              backgroundColor: 'var(--bg-card)',
              backdropFilter: 'blur(16px)',
              marginBottom: '24px'
            }}
          >
            {/* Top Seal & Token Number */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                paddingBottom: '24px',
                borderBottom: '2px solid var(--color-gold-hairline)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-gold)' }}>
                  AUTHENTICATED QUEUE TOKEN
                </span>
                <div
                  className="token-num"
                  style={{
                    fontSize: '4rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    marginTop: '4px',
                    color: '#FFFFFF'
                  }}
                >
                  {booking.tokenNumber}
                </div>
                <div style={{ marginTop: '6px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-gold)', textTransform: 'uppercase' }}>
                  Priority Tier: {booking.priorityCategory.replace('_', ' ')}
                </div>
              </div>

              {/* Status Pill */}
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor: booking.status === 'SERVING' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                    color: booking.status === 'SERVING' ? 'var(--color-success)' : 'var(--color-gold)',
                    border: booking.status === 'SERVING' ? '1px solid var(--color-success)' : '1px solid var(--color-gold)'
                  }}
                >
                  Status: {booking.status}
                </span>
                <div className="numeral" style={{ fontSize: '0.82rem', color: 'var(--color-ink-soft)', marginTop: '8px' }}>
                  Ref: {booking.bookingRef}
                </div>
              </div>
            </div>

            {/* Token Scanned Details Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingTop: '24px' }}>
              {/* Citizen Information */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <User size={18} color="var(--color-gold-deep)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-soft)', fontWeight: 600 }}>
                    Citizen Credential
                  </div>
                  <div style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                    {booking.citizenName || 'Registered Citizen'}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--color-ink-soft)' }}>
                    {booking.email}
                  </div>
                </div>
              </div>

              {/* Office Details */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Building size={18} color="var(--color-gold-deep)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-soft)', fontWeight: 600 }}>
                    Office & Location
                  </div>
                  <div style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                    {booking.officeName}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--color-ink-soft)' }}>
                    {booking.officeAddress} • {booking.officeDistrict}, {booking.officeState}
                  </div>
                </div>
              </div>

              {/* Service Desk Details */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Clock size={18} color="var(--color-gold-deep)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-soft)', fontWeight: 600 }}>
                    Service Desk & Wait Dynamics
                  </div>
                  <div style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                    {booking.serviceName}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--color-ink-soft)' }}>
                    Tokens Ahead in Queue: <strong className="numeral">{booking.tokensAhead}</strong> | ML Wait Prediction: <strong className="numeral">{booking.predictedWaitMinutes} mins</strong>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--color-ink-soft)' }}>
                <span>Booking Generated:</span>
                <span className="numeral" style={{ fontWeight: 600 }}>
                  {new Date(booking.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/queue')}
                className="btn-primary"
                style={{ flex: 1, minWidth: '200px' }}
              >
                <span>Track Live Queue</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/print')}
                className="btn-secondary"
                style={{ flex: 1, minWidth: '180px' }}
              >
                <Printer size={16} />
                <span>Print Official Slip</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};
