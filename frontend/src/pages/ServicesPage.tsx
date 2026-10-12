import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, ArrowRight, Check, Users } from 'lucide-react';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { VoiceAssistantBar } from '../components/VoiceAssistantBar';
import { useAppStore } from '../store';
import type { Service } from '../store';

export const ServicesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedOffice, selectedService, setSelectedService } = useAppStore();

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!selectedOffice) {
      navigate('/offices');
      return;
    }

    const fetchServices = async () => {
      try {
        const response = await axios.get(`/api/services?officeId=${selectedOffice.id}`);
        if (response.data.success) {
          setServices(response.data.services);
          if (!selectedService && response.data.services.length > 0) {
            setSelectedService(response.data.services[0]);
          }
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to load services for the selected office.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [selectedOffice]);

  const screenSpeech = `${t('service.title')}. ${t('service.subtitle')}. ${
    services.map((s) => `${s.name}, estimated ${s.avgServiceMinutes} minutes`).join('. ')
  }`;

  const handleVoiceCommand = (cmd: string) => {
    const found = services.find(
      (s) =>
        cmd.includes(s.name.toLowerCase()) ||
        cmd.includes(s.prefix.toLowerCase()) ||
        (cmd.includes('pension') && s.name.includes('Pension')) ||
        (cmd.includes('disability') && s.name.includes('Disability')) ||
        (cmd.includes('certificate') && s.name.includes('Certificate')) ||
        (cmd.includes('patta') && s.name.includes('Patta')) ||
        (cmd.includes('tax') && s.name.includes('Tax'))
    );
    if (found) {
      setSelectedService(found);
    } else if (cmd.includes('continue') || cmd.includes('next')) {
      handleContinue();
    }
  };

  const handleContinue = () => {
    if (!selectedService && services.length > 0) {
      setSelectedService(services[0]);
    }
    navigate('/priority');
  };

  return (
    <Layout stepNumber={6} totalSteps={10} showBack backPath="/offices">
      <VoiceAssistantBar screenTextToRead={screenSpeech} onVoiceCommand={handleVoiceCommand} />

      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-gold-deep)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
          {selectedOffice?.name}
        </div>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '8px' }}>{t('service.title')}</h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--color-ink-soft)' }}>
          {t('service.subtitle')}
        </p>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-soft)' }}>
          Loading services for {selectedOffice?.name}...
        </div>
      ) : errorMsg ? (
        <div style={{ padding: '20px', backgroundColor: 'var(--color-error-bg)', border: '1px solid var(--color-error)', color: '#FCA5A5', borderRadius: 'var(--radius-md)' }}>
          {errorMsg}
        </div>
      ) : (
        <div
          role="radiogroup"
          aria-label="Service options"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '36px'
          }}
        >
          {services.map((service) => {
            const isSelected = selectedService?.id === service.id;
            return (
              <div
                key={service.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => setSelectedService(service)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedService(service)}
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
                  <FileText size={24} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        backgroundColor: '#0A0A0A',
                        color: '#FFFFFF',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      Prefix {service.prefix}
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
                    {service.name}
                  </h3>

                  <p style={{ fontSize: '0.94rem', color: 'var(--color-ink-soft)', marginBottom: '12px', lineHeight: 1.45 }}>
                    {service.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', fontSize: '0.88rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--color-gold-deep)', fontWeight: 600 }}>
                      <Clock size={14} />
                      <span className="numeral">{service.avgServiceMinutes}</span> mins avg service duration
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--color-ink-soft)' }}>
                      <Users size={14} />
                      <span className="numeral" style={{ fontWeight: 600 }}>{service.currentWaitingCount}</span> in queue
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
          disabled={!selectedService || isLoading}
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
