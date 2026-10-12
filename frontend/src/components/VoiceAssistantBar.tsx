import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';

interface VoiceAssistantBarProps {
  screenTextToRead: string;
  onVoiceCommand?: (command: string) => void;
}

export const VoiceAssistantBar: React.FC<VoiceAssistantBarProps> = ({
  screenTextToRead,
  onVoiceCommand
}) => {
  const { t } = useTranslation();
  const { language } = useAppStore();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [spokenFeedback, setSpokenFeedback] = useState<string>('');

  // Cancel speech on unmount or screen change
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [screenTextToRead]);

  const langCodeMap: Record<string, string> = {
    en: 'en-IN',
    ta: 'ta-IN',
    hi: 'hi-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    ml: 'ml-IN'
  };

  const handleReadScreen = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(screenTextToRead);
    const targetLang = langCodeMap[language] || 'en-IN';
    utterance.lang = targetLang;
    utterance.rate = 0.95; // Slightly slower for elderly clarity

    // Pick best matching voice if available
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === targetLang || v.lang.startsWith(language));
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpokenFeedback('Voice recognition not supported in this browser. Use Chrome or Edge.');
      setTimeout(() => setSpokenFeedback(''), 4000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = langCodeMap[language] || 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpokenFeedback('Listening for command...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpokenFeedback(`Heard: "${transcript}"`);
        if (onVoiceCommand) {
          onVoiceCommand(transcript.toLowerCase());
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setSpokenFeedback('');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Accessibility Voice Assistance Bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 18px',
        backgroundColor: 'rgba(16, 21, 36, 0.88)',
        border: '1px solid var(--color-gold-hairline)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '20px',
        backdropFilter: 'blur(16px)',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: isSpeaking || isListening ? 'var(--color-gold)' : 'var(--color-gold-dim)',
            boxShadow: isSpeaking || isListening ? '0 0 10px var(--color-gold)' : 'none'
          }}
        />
        <span
          style={{
            fontSize: '0.85rem',
            color: 'var(--color-gold)',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }}
        >
          Audio & Accessibility Assistant
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {spokenFeedback && (
          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--color-gold)',
              fontWeight: 600,
              padding: '4px 10px',
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid var(--color-gold-hairline)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {spokenFeedback}
          </span>
        )}

        <button
          type="button"
          onClick={handleReadScreen}
          aria-label={isSpeaking ? "Stop reading screen" : "Read screen content aloud"}
          style={{
            minHeight: '40px',
            padding: '8px 16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isSpeaking ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.08)',
            color: isSpeaking ? '#07090E' : '#FFFFFF',
            border: isSpeaking ? '1px solid var(--color-gold)' : '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
          <span>{isSpeaking ? 'Stop Audio' : t('voiceReadScreen')}</span>
        </button>

        <button
          type="button"
          onClick={handleListen}
          aria-label={isListening ? "Listening for voice command" : "Start voice command"}
          style={{
            minHeight: '40px',
            padding: '8px 16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isListening ? 'var(--color-gold-glow)' : 'rgba(255, 255, 255, 0.08)',
            color: isListening ? '#07090E' : '#FFFFFF',
            border: isListening ? '1px solid var(--color-gold-glow)' : '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          <span>{isListening ? t('voiceListening') : t('voiceSpeak')}</span>
        </button>
      </div>
    </div>
  );
};
