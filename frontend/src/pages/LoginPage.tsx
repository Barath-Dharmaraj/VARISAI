import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  UserPlus,
  ShieldCheck,
  Building,
  KeyRound,
  Sparkles,
  Cpu,
  Lock,
  LogOut,
  Play,
  Eye,
  EyeOff,
  QrCode,
  Volume2,
  Clock,
  Check
} from 'lucide-react';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { VoiceAssistantBar } from '../components/VoiceAssistantBar';
import { StartupPreloader } from '../components/StartupPreloader';
import { useAppStore, type PriorityCategory, type Office } from '../store';

const TAMIL_NADU_DISTRICTS = [
  'Chennai',
  'Chengalpattu',
  'Kanchipuram',
  'Thiruvallur',
  'Coimbatore',
  'Madurai',
  'Tiruchirappalli',
  'Salem',
  'Tirunelveli',
  'Vellore'
];

const PRESET_STAFF_ACCOUNTS = [
  { label: 'Tahsildar Desk', email: 'officer@tn.gov.in', staffId: 'TN-OFFICER-001', dept: 'Revenue Administration' },
  { label: 'Bank Desk Lead', email: 'staff@sbi.co.in', staffId: 'SBI-DESK-101', dept: 'Pension Disbursement' },
  { label: 'VAO Official', email: 'vao.velachery@tn.gov.in', staffId: 'TN-VAO-042', dept: 'Village Administration' },
  { label: 'State Admin', email: 'admin@varisai.gov.in', staffId: 'VAR-ADMIN-999', dept: 'Public Grievance Desk' }
];

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Preloader state
  const [showPreloader, setShowPreloader] = useState<boolean>(() => {
    return !sessionStorage.getItem('varisai_intro_seen');
  });

  const {
    citizenUser,
    setCitizenUser,
    setEmail,
    setUserName,
    setOtpVerified,
    logoutCitizen,
    staffUser,
    setStaffUser,
    logoutStaff,
    isOtpVerified,
    isStaffVerified,
    setSelectedPriority
  } = useAppStore();

  // Portal type: 'CITIZEN' vs 'STAFF'
  const initialPortal = searchParams.get('type') === 'staff' ? 'STAFF' : 'CITIZEN';
  const [portalType, setPortalType] = useState<'CITIZEN' | 'STAFF'>(initialPortal);

  // Mode: 'signin' vs 'register'
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  // Citizen Sign-In state
  const [signInEmail, setSignInEmail] = useState<string>(citizenUser?.email || '');
  const [signInPassword, setSignInPassword] = useState<string>('password123');
  const [showSignInPassword, setShowSignInPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [existingUserLookup, setExistingUserLookup] = useState<any>(null);

  // Citizen Register state
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [regPhone, setRegPhone] = useState<string>('');
  const [regDistrict, setRegDistrict] = useState<string>('Chennai');
  const [regPriority, setRegPriority] = useState<PriorityCategory>('none');

  // Staff Sign-In state
  const [staffEmail, setStaffEmail] = useState<string>('officer@tn.gov.in');
  const [staffId, setStaffId] = useState<string>('TN-OFFICER-001');
  const [staffPassword, setStaffPassword] = useState<string>('password123');
  const [showStaffPassword, setShowStaffPassword] = useState<boolean>(false);

  // Staff Register state
  const [staffRegName, setStaffRegName] = useState<string>('');
  const [staffRegEmail, setStaffRegEmail] = useState<string>('');
  const [staffRegPassword, setStaffRegPassword] = useState<string>('');
  const [staffRegId, setStaffRegId] = useState<string>('');
  const [staffRegDept, setStaffRegDept] = useState<string>('Revenue Administration');
  const [staffRegOfficeId, setStaffRegOfficeId] = useState<string>('');
  const [offices, setOffices] = useState<Office[]>([]);

  // UI status
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState<boolean>(false);

  const handlePreloaderComplete = () => {
    sessionStorage.setItem('varisai_intro_seen', 'true');
    setShowPreloader(false);
  };

  const handleReplayIntro = () => {
    setShowPreloader(true);
  };

  // Load offices for staff registration
  useEffect(() => {
    axios.get('/api/offices')
      .then((res) => {
        if (res.data.success && res.data.offices.length > 0) {
          setOffices(res.data.offices);
          setStaffRegOfficeId(res.data.offices[0].id);
        }
      })
      .catch((err) => console.error('Offices load error:', err));
  }, []);

  const handleSwitchPortal = (type: 'CITIZEN' | 'STAFF') => {
    setPortalType(type);
    setErrorMsg('');
    setSuccessMsg('');
    setSearchParams(type === 'STAFF' ? { type: 'staff' } : {});
  };

  // Check email dynamically on blur or change
  const handleLookupCitizenEmail = async (emailToCheck: string) => {
    const trimmed = emailToCheck.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setExistingUserLookup(null);
      return;
    }
    try {
      const res = await axios.post('/api/auth/citizen-lookup', { email: trimmed });
      if (res.data.success && res.data.exists) {
        setExistingUserLookup(res.data.user);
      } else {
        setExistingUserLookup(null);
      }
    } catch {
      setExistingUserLookup(null);
    }
  };

  useEffect(() => {
    if (signInEmail) {
      handleLookupCitizenEmail(signInEmail);
    }
  }, []);

  // 1. CITIZEN PASSWORD SIGN IN (NO OTP!)
  const handleCitizenSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = signInEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    if (!signInPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await axios.post('/api/auth/citizen-password-login', {
        email: trimmedEmail,
        password: signInPassword
      });

      if (response.data.success && response.data.user) {
        setCitizenUser(response.data.user);
        setEmail(response.data.user.email);
        setUserName(response.data.user.name);
        setOtpVerified(false);
        sessionStorage.removeItem('varisai_citizen_verified');
        if (response.data.user.priorityCategory) {
          setSelectedPriority(response.data.user.priorityCategory);
        }
        setSuccessMsg('Authentication verified. Welcome to VARISAI!');
        const targetUrl = (location.state as any)?.from || '/language';
        setTimeout(() => {
          navigate(targetUrl);
        }, 350);
      } else {
        setErrorMsg(response.data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
        'Account not recognized or password incorrect. Please create an account if you are a new citizen.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 2. CITIZEN REGISTRATION WITH PASSWORD (STORED IN DB!)
  const handleCitizenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || regName.trim().length < 2) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }
    const trimmedEmail = regEmail.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await axios.post('/api/auth/citizen-password-register', {
        name: regName.trim(),
        email: trimmedEmail,
        password: regPassword,
        phone: regPhone.trim(),
        district: regDistrict,
        priorityCategory: regPriority
      });

      if (response.data.success && response.data.user) {
        setCitizenUser(response.data.user);
        setEmail(response.data.user.email);
        setUserName(response.data.user.name);
        setOtpVerified(false);
        sessionStorage.removeItem('varisai_citizen_verified');
        setSelectedPriority(regPriority);
        setSuccessMsg('Account created and credentials registered in database! Welcome to VARISAI!');
        const targetUrl = (location.state as any)?.from || '/language';
        setTimeout(() => {
          navigate(targetUrl);
        }, 500);
      } else {
        setErrorMsg(response.data.error || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
        'Unable to create profile in database. Email might already be registered.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 3. STAFF PASSWORD SIGN IN
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = staffEmail.trim().toLowerCase();
    if (!trimmed) {
      setErrorMsg('Official government email address is required.');
      return;
    }
    if (!staffPassword) {
      setErrorMsg('Staff authorization password is required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await axios.post('/api/auth/staff-password-login', {
        email: trimmed,
        password: staffPassword,
        staffId: staffId.trim()
      });

      if (response.data.success && response.data.staff) {
        setStaffUser(response.data.staff);
        setSuccessMsg('Official clearance granted. Transferring to Admin Desk...');
        setTimeout(() => {
          navigate('/admin');
        }, 400);
      } else {
        setErrorMsg(response.data.error || 'Staff authorization failed.');
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
        'Access Denied: Not registered as authorized government staff or password incorrect.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 4. STAFF REGISTRATION
  const handleStaffRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffRegName.trim() || !staffRegEmail.trim() || !staffRegId.trim() || !staffRegPassword) {
      setErrorMsg('All official onboarding fields and password are required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await axios.post('/api/auth/staff-password-register', {
        name: staffRegName.trim(),
        email: staffRegEmail.trim().toLowerCase(),
        password: staffRegPassword,
        staffId: staffRegId.trim(),
        department: staffRegDept.trim(),
        officeId: staffRegOfficeId
      });

      if (response.data.success && response.data.staff) {
        setStaffUser(response.data.staff);
        setSuccessMsg('Official staff profile onboarded successfully in database!');
        setTimeout(() => {
          navigate('/admin');
        }, 400);
      } else {
        setErrorMsg(response.data.error || 'Staff onboarding failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to onboard staff record.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStaffPreset = (preset: typeof PRESET_STAFF_ACCOUNTS[0]) => {
    setStaffEmail(preset.email);
    setStaffId(preset.staffId);
    setStaffPassword('password123');
    setErrorMsg('');
  };

  const screenSpeech = portalType === 'CITIZEN'
    ? 'VARISAI Smart Queue Portal. Sign in with your registered email and password, or register as a new citizen to generate queue tokens.'
    : 'Government Staff Desk. Authenticate with official government credentials to access counter administration.';

  return (
    <>
      {/* 1. LIVELY PRELOADER ANIMATION */}
      {showPreloader && <StartupPreloader onComplete={handlePreloaderComplete} />}

      <Layout showBack={false}>
        {/* VOICE ASSISTANT BAR (HIGH CONTRAST DARK-LUXE) */}
        <VoiceAssistantBar
          screenTextToRead={screenSpeech}
          onVoiceCommand={(cmd) => {
            if (cmd.includes('staff') || cmd.includes('official') || cmd.includes('admin')) handleSwitchPortal('STAFF');
            if (cmd.includes('citizen') || cmd.includes('user') || cmd.includes('public')) handleSwitchPortal('CITIZEN');
            if (cmd.includes('register') || cmd.includes('sign up') || cmd.includes('new')) setMode('register');
            if (cmd.includes('login') || cmd.includes('sign in')) setMode('signin');
          }}
        />

        {/* ACTIVE SESSION ALERTS */}
        {citizenUser && isOtpVerified && (
          <div
            style={{
              padding: '16px 22px',
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1.5px solid var(--color-gold)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ✓ ACTIVE CITIZEN SESSION DETECTED
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                Signed in as {citizenUser.name} ({citizenUser.email})
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => navigate('/language')}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.9rem', minHeight: '44px' }}
              >
                <span>Continue to Queue Portal</span>
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={logoutCitizen}
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {staffUser && isStaffVerified && (
          <div
            style={{
              padding: '16px 22px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1.5px solid var(--color-gold-glow)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gold-glow)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🛡️ ACTIVE OFFICIAL STAFF CLEARANCE
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                Authorized as {staffUser.name} ({staffUser.staffId || staffUser.email})
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="btn-gold"
                style={{ padding: '8px 18px', fontSize: '0.9rem', minHeight: '44px' }}
              >
                <span>Access Admin Desk</span>
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={logoutStaff}
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* FEEDBACK NOTICES */}
        {errorMsg && (
          <div
            role="alert"
            style={{
              maxWidth: '1200px',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 18px',
              backgroundColor: 'var(--color-error-bg)',
              border: '1.5px solid var(--color-error)',
              borderRadius: 'var(--radius-md)',
              color: '#FCA5A5',
              fontSize: '0.94rem',
              backdropFilter: 'blur(10px)'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, color: 'var(--color-error)' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            style={{
              maxWidth: '1200px',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 18px',
              backgroundColor: 'var(--color-success-bg)',
              border: '1.5px solid var(--color-success)',
              borderRadius: 'var(--radius-md)',
              color: '#86EFAC',
              fontSize: '0.94rem',
              backdropFilter: 'blur(10px)'
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0, color: 'var(--color-success)' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {forgotPasswordNotice && (
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto 20px',
              padding: '14px 18px',
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid var(--color-gold)',
              borderRadius: 'var(--radius-md)',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>
              ℹ️ Default test accounts use password: <strong style={{ color: 'var(--color-gold)' }}>password123</strong>. For new accounts, choose any password with 6+ characters.
            </span>
            <button
              type="button"
              onClick={() => setForgotPasswordNotice(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-gold)', cursor: 'pointer', fontWeight: 700 }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* OPENARTISTIC SPLIT-SCREEN LAYOUT (Dribbble shot 24852452 Inspired)        */}
        {/* ========================================================================= */}
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto 40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '32px',
            alignItems: 'stretch'
          }}
        >
          {/* ===================================================================== */}
          {/* LEFT COLUMN: HIGH-AESTHETIC BRAND SHOWCASE & LIVE IMPACT METRICS       */}
          {/* ===================================================================== */}
          <div
            className="card"
            style={{
              padding: '44px 36px',
              background: 'linear-gradient(145deg, rgba(16, 21, 36, 0.95) 0%, rgba(10, 13, 22, 0.98) 100%)',
              border: '1.5px solid var(--color-gold-hairline)',
              borderRadius: 'var(--radius-card)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Ambient Background Glow Effect */}
            <div
              style={{
                position: 'absolute',
                top: '-20%',
                right: '-20%',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none'
              }}
            />

            <div>
              {/* Top Badge & Live Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid var(--color-gold-hairline)'
                  }}
                >
                  <span className="badge-live-dot" />
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    TN STATE QUEUE DISPATCH
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleReplayIntro}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-dim)',
                    fontSize: '0.76rem',
                    cursor: 'pointer'
                  }}
                  title="Replay intro animation"
                >
                  <Play size={10} />
                  <span>Replay Intro</span>
                </button>
              </div>

              {/* Large Headline */}
              <h1
                style={{
                  fontSize: 'clamp(2rem, 3.2vw, 2.8rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.2,
                  marginBottom: '16px',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #E5C158 50%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Adaptive Public Service Gateway
              </h1>

              <p
                style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.6,
                  color: 'var(--color-text-muted)',
                  marginBottom: '32px'
                }}
              >
                Next-generation intelligent queue system powering fair, dignified citizen access. Smart prioritization guarantees minimal waiting times for seniors, expectant mothers, and disabled individuals.
              </p>

              {/* Feature Highlights Grid */}
              <div style={{ display: 'grid', gap: '16px', marginBottom: '32px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: 'rgba(212, 175, 55, 0.15)',
                      color: 'var(--color-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
                      AI Dynamic Priority Scheduling
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', marginTop: '2px', lineHeight: 1.4 }}>
                      Weighted queue reordering automatically elevates vulnerable citizens while maintaining balanced FIFO service throughput.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--color-success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <QrCode size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
                      Live Mobile QR Fast Pass
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', marginTop: '2px', lineHeight: 1.4 }}>
                      Scan QR code on any smartphone to check live token position, estimated wait countdown, and counter assignments on the go.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60A5FA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Volume2 size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
                      Accessibility & Multi-Language Audio
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', marginTop: '2px', lineHeight: 1.4 }}>
                      Full speech narration and voice command recognition in Tamil (தமிழ்), English, Hindi, Telugu, Kannada, and Malayalam.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Live Metrics & Seal */}
            <div
              style={{
                paddingTop: '24px',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-gold)' }}>
                  99.4%
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Priority Model Accuracy
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>
                  4 Hubs
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  District Grid Active
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-gold)' }}>
                  0-Wait
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Emergency Acceleration
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* RIGHT COLUMN: OPENARTISTIC HIGH-CONVERTING AUTHENTICATION CARD        */}
          {/* ===================================================================== */}
          <div
            className="card"
            style={{
              padding: '40px 36px',
              background: 'rgba(12, 15, 25, 0.95)',
              border: '1.5px solid var(--color-gold-hairline)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card-hover)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            {/* 1. ROLE SWITCHER (Segmented Control: Citizen vs Staff) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                padding: '4px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--color-border)',
                marginBottom: '26px'
              }}
            >
              <button
                type="button"
                onClick={() => handleSwitchPortal('CITIZEN')}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: portalType === 'CITIZEN' ? 'var(--color-gold)' : 'transparent',
                  color: portalType === 'CITIZEN' ? '#07090E' : 'var(--color-text-muted)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <User size={16} />
                <span>Citizen Portal</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchPortal('STAFF')}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: 'none',
                  background: portalType === 'STAFF' ? 'var(--color-gold)' : 'transparent',
                  color: portalType === 'STAFF' ? '#07090E' : 'var(--color-text-muted)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <ShieldCheck size={16} />
                <span>Staff Desk</span>
              </button>
            </div>

            {/* 2. CARD HEADER */}
            <div style={{ marginBottom: '24px' }}>
              <h2
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: '6px',
                  letterSpacing: '-0.02em'
                }}
              >
                {portalType === 'CITIZEN'
                  ? mode === 'signin'
                    ? 'Sign in to your account'
                    : 'Create citizen profile'
                  : 'Government staff clearance'}
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-muted)', margin: 0 }}>
                {portalType === 'CITIZEN'
                  ? mode === 'signin'
                    ? 'Welcome back! Please enter your email and password.'
                    : 'Fill in your details to register in the Tamil Nadu database.'
                  : 'Authorized personnel login for counter management.'}
              </p>
            </div>

            {/* =================================================================== */}
            {/* A. CITIZEN SIGN IN FORM (NO OTP!)                                   */}
            {/* =================================================================== */}
            {portalType === 'CITIZEN' && mode === 'signin' && (
              <form onSubmit={handleCitizenSignIn}>
                {/* Email Address */}
                <div style={{ marginBottom: '18px' }}>
                  <label
                    htmlFor="citizen-signin-email"
                    style={{
                      display: 'block',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      marginBottom: '8px'
                    }}
                  >
                    Email Address <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--color-border)',
                      backgroundColor: 'var(--bg-input)',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ padding: '0 14px', color: 'var(--color-gold)' }}>
                      <Mail size={18} />
                    </div>
                    <input
                      id="citizen-signin-email"
                      type="email"
                      value={signInEmail}
                      onChange={(e) => {
                        setSignInEmail(e.target.value);
                        handleLookupCitizenEmail(e.target.value);
                      }}
                      onBlur={() => handleLookupCitizenEmail(signInEmail)}
                      placeholder="citizen@example.com"
                      required
                      autoFocus
                      style={{
                        flex: 1,
                        height: '48px',
                        border: 'none',
                        padding: '0 12px 0 0',
                        fontSize: '1rem',
                        backgroundColor: 'transparent',
                        color: '#FFFFFF'
                      }}
                    />
                  </div>
                </div>

                {/* Password with Show/Hide Toggle */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label
                      htmlFor="citizen-signin-pass"
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      Password <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotPasswordNotice(true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-gold)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--color-border)',
                      backgroundColor: 'var(--bg-input)'
                    }}
                  >
                    <div style={{ padding: '0 14px', color: 'var(--color-gold)' }}>
                      <Lock size={18} />
                    </div>
                    <input
                      id="citizen-signin-pass"
                      type={showSignInPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      style={{
                        flex: 1,
                        height: '48px',
                        border: 'none',
                        padding: '0 8px 0 0',
                        fontSize: '1rem',
                        backgroundColor: 'transparent',
                        color: '#FFFFFF'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      style={{
                        padding: '0 14px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-dim)',
                        cursor: 'pointer'
                      }}
                      title={showSignInPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignInPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Real-time DB Recognition pill if registered */}
                {existingUserLookup && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(212, 175, 55, 0.08)',
                      border: '1px solid var(--color-gold)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '16px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--color-gold)'
                    }}
                  >
                    <Check size={16} />
                    <span>Welcome back, <strong>{existingUserLookup.name}</strong>! Ready to sign in.</span>
                  </div>
                )}

                {/* Remember Me */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: 'var(--color-gold)',
                      cursor: 'pointer'
                    }}
                  />
                  <label
                    htmlFor="remember-me"
                    style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                  >
                    Remember me on this browser
                  </label>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading || !signInEmail || !signInPassword}
                  className="btn-primary"
                  style={{ width: '100%', minHeight: '50px' }}
                >
                  <span>{isLoading ? 'Verifying Credentials...' : 'Sign In'}</span>
                  <ArrowRight size={18} />
                </button>

                {/* Switch to Register link */}
                <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg('');
                      setRegEmail(signInEmail);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-gold)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Create an account
                  </button>
                </div>
              </form>
            )}

            {/* =================================================================== */}
            {/* B. CITIZEN REGISTRATION FORM (NEW USER - DETAILS STORED IN DB!)      */}
            {/* =================================================================== */}
            {portalType === 'CITIZEN' && mode === 'register' && (
              <form onSubmit={handleCitizenRegister}>
                {/* Full Legal Name */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                    Full Legal Name <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', backgroundColor: 'var(--bg-input)' }}>
                    <div style={{ padding: '0 12px', color: 'var(--color-gold)' }}><User size={16} /></div>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Ramanathan Kumar"
                      style={{ flex: 1, height: '44px', border: 'none', padding: '0 10px 0 0', fontSize: '0.95rem', background: 'transparent', color: '#FFFFFF' }}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                    Email Address <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', backgroundColor: 'var(--bg-input)' }}>
                    <div style={{ padding: '0 12px', color: 'var(--color-gold)' }}><Mail size={16} /></div>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="citizen@example.com"
                      style={{ flex: 1, height: '44px', border: 'none', padding: '0 10px 0 0', fontSize: '0.95rem', background: 'transparent', color: '#FFFFFF' }}
                    />
                  </div>
                </div>

                {/* Password with Show/Hide */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                    Create Password (6+ characters) <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', backgroundColor: 'var(--bg-input)' }}>
                    <div style={{ padding: '0 12px', color: 'var(--color-gold)' }}><Lock size={16} /></div>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a secure password"
                      style={{ flex: 1, height: '44px', border: 'none', padding: '0 10px 0 0', fontSize: '0.95rem', background: 'transparent', color: '#FFFFFF' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      style={{ padding: '0 12px', background: 'transparent', border: 'none', color: 'var(--color-text-dim)', cursor: 'pointer' }}
                    >
                      {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Phone & District */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                      Phone (Optional)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', backgroundColor: 'var(--bg-input)' }}>
                      <div style={{ padding: '0 10px', color: 'var(--color-gold)' }}><Phone size={15} /></div>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="98401XXXXX"
                        style={{ flex: 1, height: '42px', border: 'none', padding: '0 8px 0 0', fontSize: '0.9rem', background: 'transparent', color: '#FFFFFF' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                      District <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', backgroundColor: 'var(--bg-input)' }}>
                      <div style={{ padding: '0 10px', color: 'var(--color-gold)' }}><MapPin size={15} /></div>
                      <select
                        value={regDistrict}
                        onChange={(e) => setRegDistrict(e.target.value)}
                        style={{ flex: 1, height: '42px', border: 'none', padding: '0 8px 0 0', fontSize: '0.88rem', fontWeight: 600, background: 'transparent', color: '#FFFFFF' }}
                      >
                        {TAMIL_NADU_DISTRICTS.map((d) => (
                          <option key={d} value={d} style={{ backgroundColor: '#0C0F19', color: '#FFFFFF' }}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Priority Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    Priority Category (Qualifies for Faster Service)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { id: 'none', label: 'General Public' },
                      { id: 'senior_citizen', label: 'Senior (60+)' },
                      { id: 'pregnant_woman', label: 'Expecting Mother' },
                      { id: 'differently_abled', label: 'Differently Abled' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRegPriority(item.id as PriorityCategory)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: regPriority === item.id ? '1.5px solid var(--color-gold)' : '1px solid var(--color-border)',
                          backgroundColor: regPriority === item.id ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-input)',
                          color: regPriority === item.id ? 'var(--color-gold)' : 'var(--color-text-muted)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s'
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Register */}
                <button
                  type="submit"
                  disabled={isLoading || !regName || !regEmail || !regPassword}
                  className="btn-primary"
                  style={{ width: '100%', minHeight: '50px' }}
                >
                  <span>{isLoading ? 'Storing in Database...' : 'Create Account & Enter Portal'}</span>
                  <ArrowRight size={18} />
                </button>

                {/* Switch back to Sign In */}
                <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                  <span>Already registered? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg('');
                      setSignInEmail(regEmail);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-gold)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Sign in to your account
                  </button>
                </div>
              </form>
            )}

            {/* =================================================================== */}
            {/* C. GOVERNMENT STAFF AUTHENTICATION FORM                             */}
            {/* =================================================================== */}
            {portalType === 'STAFF' && (
              <div>
                {/* Staff Sub-Tabs: Sign In vs Onboard */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setErrorMsg(''); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: mode === 'signin' ? 'var(--color-gold)' : 'var(--color-text-dim)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      borderBottom: mode === 'signin' ? '2px solid var(--color-gold)' : 'none',
                      paddingBottom: '6px'
                    }}
                  >
                    Official Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setErrorMsg(''); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: mode === 'register' ? 'var(--color-gold)' : 'var(--color-text-dim)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      borderBottom: mode === 'register' ? '2px solid var(--color-gold)' : 'none',
                      paddingBottom: '6px'
                    }}
                  >
                    Onboard New Staff
                  </button>
                </div>

                {mode === 'signin' ? (
                  <>
                    {/* Preset Staff Accounts for Instant Demo Testing */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                        Quick Select Official Account:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {PRESET_STAFF_ACCOUNTS.map((preset) => (
                          <button
                            key={preset.email}
                            type="button"
                            onClick={() => handleSelectStaffPreset(preset)}
                            style={{
                              padding: '8px 10px',
                              border: staffEmail === preset.email ? '1.5px solid var(--color-gold)' : '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: staffEmail === preset.email ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-input)',
                              textAlign: 'left',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>{preset.label}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-gold)' }}>{preset.staffId}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleStaffLogin}>
                      {/* Government Email */}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                          Official Government Email <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', backgroundColor: 'var(--bg-input)' }}>
                          <div style={{ padding: '0 12px', color: 'var(--color-gold)' }}><Mail size={16} /></div>
                          <input
                            type="email"
                            required
                            value={staffEmail}
                            onChange={(e) => setStaffEmail(e.target.value)}
                            placeholder="officer@tn.gov.in"
                            style={{ flex: 1, height: '44px', border: 'none', padding: '0 10px 0 0', fontSize: '0.95rem', background: 'transparent', color: '#FFFFFF' }}
                          />
                        </div>
                      </div>

                      {/* Staff ID */}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                          Staff Identification ID <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', backgroundColor: 'var(--bg-input)' }}>
                          <div style={{ padding: '0 12px', color: 'var(--color-gold)' }}><KeyRound size={16} /></div>
                          <input
                            type="text"
                            required
                            value={staffId}
                            onChange={(e) => setStaffId(e.target.value)}
                            placeholder="TN-OFFICER-001"
                            style={{ flex: 1, height: '44px', border: 'none', padding: '0 10px 0 0', fontSize: '0.95rem', background: 'transparent', color: '#FFFFFF' }}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div style={{ marginBottom: '22px' }}>
                        <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                          Password <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', backgroundColor: 'var(--bg-input)' }}>
                          <div style={{ padding: '0 12px', color: 'var(--color-gold)' }}><Lock size={16} /></div>
                          <input
                            type={showStaffPassword ? 'text' : 'password'}
                            required
                            value={staffPassword}
                            onChange={(e) => setStaffPassword(e.target.value)}
                            placeholder="password123"
                            style={{ flex: 1, height: '44px', border: 'none', padding: '0 10px 0 0', fontSize: '0.95rem', background: 'transparent', color: '#FFFFFF' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowStaffPassword(!showStaffPassword)}
                            style={{ padding: '0 12px', background: 'transparent', border: 'none', color: 'var(--color-text-dim)', cursor: 'pointer' }}
                          >
                            {showStaffPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !staffEmail || !staffPassword}
                        className="btn-gold"
                        style={{ width: '100%', minHeight: '50px' }}
                      >
                        <span>{isLoading ? 'Authorizing Clearance...' : 'Authenticate Official Clearance'}</span>
                        <ArrowRight size={18} />
                      </button>
                    </form>
                  </>
                ) : (
                  /* Staff Register Mode */
                  <form onSubmit={handleStaffRegister}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                          Official Name <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={staffRegName}
                          onChange={(e) => setStaffRegName(e.target.value)}
                          placeholder="K. Sundaramoorthy"
                          style={{ width: '100%', height: '42px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', padding: '0 10px', fontSize: '0.9rem', background: 'var(--bg-input)', color: '#FFFFFF' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                          Official Email <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={staffRegEmail}
                          onChange={(e) => setStaffRegEmail(e.target.value)}
                          placeholder="sundar@tn.gov.in"
                          style={{ width: '100%', height: '42px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', padding: '0 10px', fontSize: '0.9rem', background: 'var(--bg-input)', color: '#FFFFFF' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                          Staff ID <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={staffRegId}
                          onChange={(e) => setStaffRegId(e.target.value)}
                          placeholder="TN-REV-701"
                          style={{ width: '100%', height: '42px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', padding: '0 10px', fontSize: '0.9rem', background: 'var(--bg-input)', color: '#FFFFFF' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                          Password <span style={{ color: 'var(--color-error)' }}>*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={staffRegPassword}
                          onChange={(e) => setStaffRegPassword(e.target.value)}
                          placeholder="Password"
                          style={{ width: '100%', height: '42px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', padding: '0 10px', fontSize: '0.9rem', background: 'var(--bg-input)', color: '#FFFFFF' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                        Department <span style={{ color: 'var(--color-error)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={staffRegDept}
                        onChange={(e) => setStaffRegDept(e.target.value)}
                        placeholder="Revenue & Land Records"
                        style={{ width: '100%', height: '42px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', padding: '0 10px', fontSize: '0.9rem', background: 'var(--bg-input)', color: '#FFFFFF' }}
                      />
                    </div>

                    <div style={{ marginBottom: '22px' }}>
                      <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                        Assigned Public Office <span style={{ color: 'var(--color-error)' }}>*</span>
                      </label>
                      <select
                        value={staffRegOfficeId}
                        onChange={(e) => setStaffRegOfficeId(e.target.value)}
                        style={{ width: '100%', height: '42px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', padding: '0 10px', fontSize: '0.9rem', fontWeight: 600, background: 'var(--bg-input)', color: '#FFFFFF' }}
                      >
                        {offices.map((off) => (
                          <option key={off.id} value={off.id} style={{ backgroundColor: '#0C0F19', color: '#FFFFFF' }}>
                            {off.name} ({off.category} - {off.district})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-gold"
                      style={{ width: '100%', minHeight: '50px' }}
                    >
                      <span>{isLoading ? 'Onboarding...' : 'Save Official Record & Enter'}</span>
                      <ArrowRight size={18} />
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};
