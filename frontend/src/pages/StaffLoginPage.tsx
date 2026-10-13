import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Building,
  Mail,
  BadgeCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  UserCheck,
  UserPlus
} from 'lucide-react';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { useAppStore, type Office } from '../store';

const PRESET_STAFF_ACCOUNTS = [
  { label: 'Tahsildar Desk', email: 'officer@tn.gov.in', staffId: 'TN-OFFICER-001', dept: 'Revenue Administration' },
  { label: 'Bank Desk Lead', email: 'staff@sbi.co.in', staffId: 'SBI-DESK-101', dept: 'Pension Disbursement' },
  { label: 'VAO Official', email: 'vao.velachery@tn.gov.in', staffId: 'TN-VAO-042', dept: 'Village Administration' },
  { label: 'State Admin', email: 'admin@varisai.gov.in', staffId: 'VAR-ADMIN-999', dept: 'Public Grievance Desk' }
];

export const StaffLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setStaffUser } = useAppStore();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');

  // Sign In fields
  const [emailInput, setEmailInput] = useState<string>('officer@tn.gov.in');
  const [staffIdInput, setStaffIdInput] = useState<string>('TN-OFFICER-001');

  // Register fields
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regStaffId, setRegStaffId] = useState<string>('');
  const [regDept, setRegDept] = useState<string>('Revenue Administration');
  const [regOfficeId, setRegOfficeId] = useState<string>('');
  const [offices, setOffices] = useState<Office[]>([]);

  // OTP step
  const [activeVerifyEmail, setActiveVerifyEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [staffOtp, setStaffOtp] = useState<string>('5678');
  const [demoCodeNotice, setDemoCodeNotice] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Fetch available offices for registration dropdown
    axios.get('/api/offices', { timeout: 6000 })
      .then((res) => {
        if (res.data.success && res.data.offices.length > 0) {
          setOffices(res.data.offices);
          setRegOfficeId(res.data.offices[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSelectPreset = (preset: typeof PRESET_STAFF_ACCOUNTS[0]) => {
    setEmailInput(preset.email);
    setStaffIdInput(preset.staffId);
    setErrorMsg('');
  };

  const handleSendStaffOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMsg('Official government email address is required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post('/api/auth/staff-login', {
        email: emailInput.trim().toLowerCase(),
        staffId: staffIdInput.trim()
      }, { timeout: 5000 });

      if (response.data.success) {
        setActiveVerifyEmail(emailInput.trim().toLowerCase());
        const code = response.data.otp || '5678';
        setStaffOtp(code);
        setDemoCodeNotice(response.data.demoMessage || `Official verification code: ${code}`);
        setStep('otp');
      } else {
        setErrorMsg(response.data.error || 'Staff authorization failed.');
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
        'Access Denied: Email address is not registered in the authorized government staff directory.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regStaffId.trim()) {
      setErrorMsg('All registration fields are required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post('/api/auth/staff-register', {
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        staffId: regStaffId.trim(),
        department: regDept.trim(),
        officeId: regOfficeId
      }, { timeout: 5000 });

      if (response.data.success) {
        setActiveVerifyEmail(regEmail.trim().toLowerCase());
        const code = response.data.otp || '5678';
        setStaffOtp(code);
        setDemoCodeNotice(response.data.demoMessage || `Staff verification code: ${code}`);
        setStep('otp');
      } else {
        setErrorMsg(response.data.error || 'Staff registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save staff official to database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyStaffOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 4) {
      setErrorMsg('Please enter the 4-digit authorization code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post('/api/auth/staff-verify', {
        email: activeVerifyEmail,
        otp: otpCode.trim()
      }, { timeout: 5000 });

      if (response.data.success) {
        setStaffUser(response.data.staff);
        navigate('/admin');
      } else {
        setErrorMsg(response.data.error || 'Verification code failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Incorrect authorization code. Please retry or click Auto-fill.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showBack backPath="/login-type">
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#0A0A0A',
              color: '#FFFFFF',
              padding: '4px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}
          >
            <ShieldCheck size={16} color="var(--color-gold)" />
            <span>GOVERNMENT OF TAMIL NADU • OFFICIAL DESK</span>
          </div>

          <h1 style={{ fontSize: '1.95rem', marginBottom: '6px' }}>Staff & Administration Portal</h1>
          <p style={{ fontSize: '0.98rem', color: 'var(--color-ink-soft)' }}>
            Authorizes designated tahsildars, counter officials, and desk operators
          </p>

          {/* Mode Switcher */}
          {step === 'credentials' && (
            <div
              role="tablist"
              style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '2px solid var(--color-border)',
                marginTop: '20px'
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'signin'}
                onClick={() => { setActiveTab('signin'); setErrorMsg(''); }}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: activeTab === 'signin' ? 'var(--color-gold-deep)' : 'var(--color-ink-soft)',
                  borderBottom: activeTab === 'signin' ? '3px solid var(--color-gold-deep)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '-2px'
                }}
              >
                <UserCheck size={18} />
                <span>Officer Sign In</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'register'}
                onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: activeTab === 'register' ? 'var(--color-gold-deep)' : 'var(--color-ink-soft)',
                  borderBottom: activeTab === 'register' ? '3px solid var(--color-gold-deep)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '-2px'
                }}
              >
                <UserPlus size={18} />
                <span>Onboard New Staff</span>
              </button>
            </div>
          )}
        </div>

        {/* ERROR DISPLAY */}
        {errorMsg && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: '#FDF2F2',
              border: '1px solid var(--color-error)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-error)',
              fontSize: '0.92rem',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1A: OFFICER SIGN IN                                  */}
        {/* ========================================================= */}
        {step === 'credentials' && activeTab === 'signin' && (
          <div>
            {/* Registered Profiles Selector */}
            <div
              className="card"
              style={{
                padding: '14px 18px',
                backgroundColor: '#FDFBF7',
                border: '1px solid var(--color-gold-hairline)',
                marginBottom: '20px'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-gold-deep)', marginBottom: '8px' }}>
                Pre-registered Staff Profiles in Database (Click to Auto-fill):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PRESET_STAFF_ACCOUNTS.map((preset) => (
                  <button
                    key={preset.email}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: emailInput === preset.email ? '1.5px solid var(--color-gold-deep)' : '1px solid var(--color-border)',
                      backgroundColor: emailInput === preset.email ? '#FFFFFF' : 'var(--color-paper-dim)',
                      color: emailInput === preset.email ? 'var(--color-gold-deep)' : 'var(--color-ink)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '30px 26px', backgroundColor: '#FFFFFF' }}>
              <form onSubmit={handleSendStaffOtp}>
                <div style={{ marginBottom: '18px' }}>
                  <label htmlFor="staff-email" style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px' }}>
                    Official Government Email Address
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ padding: '0 14px', color: 'var(--color-gold-deep)' }}><Mail size={18} /></div>
                    <input
                      id="staff-email"
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="officer@tn.gov.in"
                      required
                      style={{ flex: 1, height: '48px', border: 'none', padding: '0 10px', fontSize: '1rem', background: 'transparent' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label htmlFor="staff-id" style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px' }}>
                    Staff Identification ID
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ padding: '0 14px', color: 'var(--color-gold-deep)' }}><BadgeCheck size={18} /></div>
                    <input
                      id="staff-id"
                      type="text"
                      value={staffIdInput}
                      onChange={(e) => setStaffIdInput(e.target.value)}
                      placeholder="TN-OFFICER-001"
                      required
                      style={{ flex: 1, height: '48px', border: 'none', padding: '0 10px', fontSize: '1rem', background: 'transparent' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary"
                  style={{ width: '100%', minHeight: '52px' }}
                >
                  <span>{isLoading ? 'Verifying Authorization...' : 'Verify Staff Credentials in Database'}</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 1B: ONBOARD / REGISTER NEW STAFF                     */}
        {/* ========================================================= */}
        {step === 'credentials' && activeTab === 'register' && (
          <div className="card" style={{ padding: '30px 26px', backgroundColor: '#FFFFFF' }}>
            <form onSubmit={handleRegisterStaffSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px' }}>
                    Official Full Name <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. R. Subramanian (Tahsildar)"
                    style={{ width: '100%', height: '46px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', padding: '0 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px' }}>
                    Government Email <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="officer.desk@tn.gov.in"
                    style={{ width: '100%', height: '46px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', padding: '0 12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px' }}>
                    Staff ID Code <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regStaffId}
                    onChange={(e) => setRegStaffId(e.target.value)}
                    placeholder="TN-OFFICER-099"
                    style={{ width: '100%', height: '46px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', padding: '0 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px' }}>
                    Department <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value)}
                    placeholder="Revenue Administration"
                    style={{ width: '100%', height: '46px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--color-border)', padding: '0 12px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px' }}>
                  Assigned Government Office / Division <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ padding: '0 12px', color: 'var(--color-gold-deep)' }}><Building size={18} /></div>
                  <select
                    value={regOfficeId}
                    onChange={(e) => setRegOfficeId(e.target.value)}
                    style={{ flex: 1, height: '48px', border: 'none', padding: '0 10px', fontSize: '0.95rem', fontWeight: 600, background: 'transparent' }}
                  >
                    {offices.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ width: '100%', minHeight: '52px' }}
              >
                <span>{isLoading ? 'Registering Staff...' : 'Save Officer to Database & Authorize'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: 2-STEP STAFF OTP VERIFICATION                     */}
        {/* ========================================================= */}
        {step === 'otp' && (
          <div className="card" style={{ padding: '32px 28px', backgroundColor: '#FFFFFF' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                backgroundColor: '#FDFBF7',
                border: '1.5px solid var(--color-gold)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px'
              }}
            >
              <KeyRound size={22} color="var(--color-gold-deep)" />
              <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: 600 }}>
                {demoCodeNotice}
              </div>
            </div>

            <form onSubmit={handleVerifyStaffOtp}>
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <label
                  htmlFor="staff-otp"
                  style={{
                    display: 'block',
                    fontSize: '1rem',
                    fontWeight: 600,
                    marginBottom: '12px'
                  }}
                >
                  Enter 4-Digit Staff Authorization Code
                </label>
                <input
                  id="staff-otp"
                  type="text"
                  maxLength={4}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  autoFocus
                  className="numeral"
                  style={{
                    width: '180px',
                    height: '58px',
                    textAlign: 'center',
                    fontSize: '2rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--color-gold-deep)',
                    backgroundColor: '#FDFBF7',
                    letterSpacing: '0.2em',
                    margin: '0 auto',
                    display: 'block'
                  }}
                />

                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setOtpCode(staffOtp || '5678')}
                    style={{
                      background: 'rgba(184, 146, 63, 0.12)',
                      border: '1px solid var(--color-gold-deep)',
                      borderRadius: 'var(--radius-pill)',
                      color: 'var(--color-gold-deep)',
                      padding: '5px 16px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>⚡ Auto-fill Code: <strong>{staffOtp || '5678'}</strong></span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-ink-soft)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.9rem'
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Credentials</span>
                </button>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 4}
                  className="btn-primary"
                  style={{ minWidth: '180px' }}
                >
                  <span>{isLoading ? 'Authorizing...' : 'Enter Admin Desk'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};
