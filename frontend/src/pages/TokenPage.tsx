import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, Users, Cpu, ShieldCheck, ArrowRight, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { VoiceAssistantBar } from '../components/VoiceAssistantBar';
import { useAppStore } from '../store';
import type { WaitEstimate } from '../store';

export const TokenPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    email,
    userName,
    selectedOffice,
    selectedService,
    selectedPriority,
    estimate,
    setEstimate,
    setConfirmedBooking
  } = useAppStore();

  const [isLoadingEstimate, setIsLoadingEstimate] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!selectedOffice || !selectedService) {
      navigate('/offices');
      return;
    }

    const fetchEstimate = async () => {
      setIsLoadingEstimate(true);
      setErrorMsg('');

      try {
        const response = await axios.post('/api/bookings/estimate', {
          officeId: selectedOffice.id,
          serviceId: selectedService.id,
          priorityCategory: selectedPriority
        });

        if (response.data.success) {
          setEstimate(response.data);
        } else {
          setErrorMsg(response.data.error || 'Failed to calculate wait-time estimate');
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Error querying ML wait-time service. Please retry.');
      } finally {
        setIsLoadingEstimate(false);
      }
    };

    fetchEstimate();
  }, [selectedOffice, selectedService, selectedPriority]);

  const screenSpeech = estimate
    ? `${t('token.title')}. Currently serving token: ${estimate.currentServingToken}. Tokens ahead: ${estimate.tokensAhead}. ML predicted wait time: ${estimate.predictedWaitMinutes} minutes.`
    : t('token.title');

  const handleVoiceCommand = (cmd: string) => {
    if (cmd.includes('confirm') || cmd.includes('book') || cmd.includes('generate') || cmd.includes('continue')) {
      handleConfirmBooking();
    }
  };

  const handleConfirmBooking = async () => {
    if (isSubmitting || !selectedOffice || !selectedService) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const response = await axios.post('/api/bookings', {
        email: email || 'citizen@example.com',
        citizenName: userName || 'Citizen',
        officeId: selectedOffice.id,
        serviceId: selectedService.id,
        priorityCategory: selectedPriority
      });

      if (response.data.success) {
        setConfirmedBooking(response.data.booking);
        navigate('/booking');
      } else {
        setErrorMsg(response.data.error || 'Failed to issue token');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Server error while generating digital token.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout stepNumber={8} totalSteps={10} showBack backPath="/priority">
      <VoiceAssistantBar screenTextToRead={screenSpeech} onVoiceCommand={handleVoiceCommand} />

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '8px' }}>{t('token.title')}</h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--color-ink-soft)' }}>
          {t('token.subtitle')}
        </p>
      </div>

      {isLoadingEstimate ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', marginBottom: '12px', color: 'var(--color-gold-deep)' }}>
            <Cpu size={32} />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-ink)' }}>
            Calculating Live Queue Depth & ML Wait Prediction...
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-ink-soft)', marginTop: '4px' }}>
            Querying active counter rates and calibrated NHAMCS queue model
          </p>
        </div>
      ) : errorMsg ? (
        <div style={{ padding: '20px', backgroundColor: 'var(--color-error-bg)', border: '1px solid var(--color-error)', color: '#FCA5A5', borderRadius: 'var(--radius-md)' }}>
          {errorMsg}
        </div>
      ) : estimate ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
          {/* Main Computed Metric Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}
          >
            {/* 1. Serving Now */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink-soft)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: '8px' }}>
                <Users size={16} color="var(--color-gold-deep)" />
                <span>{t('token.servingNowLabel')}</span>
              </div>
              <div className="token-num" style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                {estimate.currentServingToken}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-ink-soft)', marginTop: '4px' }}>
                Active desk token
              </div>
            </div>

            {/* 2. Tokens Ahead */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink-soft)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: '8px' }}>
                <Clock size={16} color="var(--color-gold-deep)" />
                <span>{t('token.tokenAheadLabel')}</span>
              </div>
              <div className="token-num" style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                {estimate.tokensAhead}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-ink-soft)', marginTop: '4px' }}>
                Waiting in line before you
              </div>
            </div>

            {/* 3. Average Service Duration */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ink-soft)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: '8px' }}>
                <Building2 size={16} color="var(--color-gold-deep)" />
                <span>{t('token.avgServiceLabel')}</span>
              </div>
              <div className="token-num" style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                {estimate.avgServiceTimeMinutes} <span style={{ fontSize: '1rem', fontWeight: 500 }}>mins</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-ink-soft)', marginTop: '4px' }}>
                Across {estimate.activeCountersCount} active counters
              </div>
            </div>
          </div>

          {/* Primary ML Prediction Highlight Banner */}
          <div
            className="card"
            style={{
              padding: '28px',
              border: '2px solid var(--color-gold)',
              backgroundColor: '#FDFBF7'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={20} color="var(--color-gold-deep)" />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gold-deep)' }}>
                  ML Regression Model Output
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  backgroundColor: '#0A0A0A',
                  color: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {estimate.modelName}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.1rem', color: 'var(--color-ink-soft)', fontWeight: 500 }}>
                {t('token.predictedWaitLabel')}:
              </span>
              <span className="token-num" style={{ fontSize: '2.8rem', fontWeight: 700, color: 'var(--color-gold-deep)' }}>
                {estimate.predictedWaitMinutes}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-ink)' }}>
                minutes
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.88rem', color: 'var(--color-ink-soft)', paddingTop: '12px', borderTop: '1px solid var(--color-gold-hairline)' }}>
              <span>
                <strong>{t('token.ciLabel')}:</strong> [{estimate.confidenceIntervalLow} – {estimate.confidenceIntervalHigh} mins]
              </span>
              <span>
                <strong>Model Error Benchmark:</strong> MAE {estimate.benchmarkMae} mins | RMSE {estimate.benchmarkRmse} mins
              </span>
              {estimate.adaptiveWeightBonus > 0 && (
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                  Priority Boost: +{estimate.adaptiveWeightBonus} mins weight applied
                </span>
              )}
            </div>
          </div>

          {/* Verification of Chosen Service */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-soft)', fontWeight: 600, marginBottom: '6px' }}>
              Target Counter Summary
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-ink)' }}>
              {selectedOffice?.name} — {selectedService?.name}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-ink-soft)', marginTop: '2px' }}>
              Selected Priority Tier: <strong style={{ textTransform: 'capitalize' }}>{selectedPriority.replace('_', ' ')}</strong>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleConfirmBooking}
          disabled={isSubmitting || isLoadingEstimate || !estimate}
          className="btn-primary"
          style={{ width: '100%', maxWidth: '340px' }}
        >
          <span>{isSubmitting ? 'Issuing Token...' : t('token.confirmTokenBtn')}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </Layout>
  );
};
