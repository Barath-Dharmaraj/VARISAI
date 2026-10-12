import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Landmark, Building2, MapPin, Clock, ArrowRight, Check, Users } from 'lucide-react';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { VoiceAssistantBar } from '../components/VoiceAssistantBar';
import { useAppStore } from '../store';
import type { Office } from '../store';

export const OfficesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedOffice, setSelectedOffice } = useAppStore();

  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await axios.get('/api/offices');
        if (response.data.success) {
          setOffices(response.data.offices);
          // Default to first office if none selected
          if (!selectedOffice && response.data.offices.length > 0) {
            setSelectedOffice(response.data.offices[0]);
          }
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to load government offices from server. Please retry.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffices();
  }, []);

  const screenSpeech = `${t('office.title')}. ${t('office.subtitle')}. ${
    offices.map((o) => `${o.category}: ${o.name}`).join('. ')
  }`;

  const handleVoiceCommand = (cmd: string) => {
    const found = offices.find(
      (o) =>
        cmd.includes(o.category.toLowerCase()) ||
        cmd.includes(o.name.toLowerCase()) ||
        (cmd.includes('bank') && o.category.includes('Bank')) ||
        (cmd.includes('taluk') && o.category.includes('Taluk')) ||
        (cmd.includes('vao') && o.category.includes('VAO')) ||
        (cmd.includes('municipal') && o.category.includes('Municipal'))
    );
    if (found) {
      setSelectedOffice(found);
    } else if (cmd.includes('continue') || cmd.includes('next')) {
      handleContinue();
    }
  };

  const handleContinue = () => {
    if (!selectedOffice && offices.length > 0) {
      setSelectedOffice(offices[0]);
    }
    navigate('/services');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Government Bank':
        return <Landmark size={24} />;
      case 'Taluk Office':
      case 'VAO Office':
      case 'Municipal Office':
      default:
        return <Building2 size={24} />;
    }
  };

  return (
    <Layout stepNumber={3} totalSteps={10} showBack backPath="/otp">
      <VoiceAssistantBar screenTextToRead={screenSpeech} onVoiceCommand={handleVoiceCommand} />

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '8px' }}>{t('office.title')}</h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)' }}>
          {t('office.subtitle')}
        </p>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading live government offices from database...
        </div>
      ) : errorMsg ? (
        <div style={{ padding: '20px', backgroundColor: 'var(--color-error-bg)', border: '1px solid var(--color-error)', color: '#FCA5A5', borderRadius: 'var(--radius-md)' }}>
          {errorMsg}
        </div>
      ) : (
        <div
          role="radiogroup"
          aria-label="Government offices selection"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '36px'
          }}
        >
          {offices.map((office) => {
            const isSelected = selectedOffice?.id === office.id;
            return (
              <div
                key={office.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => setSelectedOffice(office)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedOffice(office)}
                className={`card card-interactive ${isSelected ? 'selected' : ''}`}
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
                  {getCategoryIcon(office.category)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--color-gold-deep)',
                        backgroundColor: '#F7F6F3',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      {office.category}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-ink-soft)' }}>
                      • {office.district}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      color: isSelected ? 'var(--color-gold-deep)' : 'var(--color-ink)',
                      marginBottom: '6px'
                    }}
                  >
                    {office.name}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--color-ink-soft)', marginBottom: '10px' }}>
                    <MapPin size={14} />
                    <span>{office.address}</span>
                  </div>

                  {/* Real Computed Queue and Counter State from DB */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.88rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--color-success)', fontWeight: 500 }}>
                      <Clock size={14} />
                      {office.openCountersCount} / {office.totalCountersCount} Counters Active
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--color-ink-soft)' }}>
                      <Users size={14} />
                      <span className="numeral" style={{ fontWeight: 600 }}>{office.currentWaitingQueue}</span> Citizens in Queue
                    </span>
                  </div>
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
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedOffice || isLoading}
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
