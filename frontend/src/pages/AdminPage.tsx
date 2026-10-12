import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Play,
  SkipForward,
  XCircle,
  CheckCircle,
  RotateCw,
  BarChart3,
  Monitor,
  Building,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import axios from 'axios';
import { Layout } from '../components/Layout';
import { useAppStore, type Office } from '../store';

const GOLD_PALETTE = ['#0A0A0A', '#B8923F', '#8C6D2E', '#D9CBA3'];

export const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { staffUser, logoutStaff } = useAppStore();

  const [activeTab, setActiveTab] = useState<'console' | 'analytics'>('console');
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');
  const [selectedCounterNum, setSelectedCounterNum] = useState<number>(1);

  // Auth Guard: Require logged in staff
  useEffect(() => {
    if (!staffUser) {
      navigate('/staff-login');
    }
  }, [staffUser, navigate]);
  const [liveQueue, setLiveQueue] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [actionMessage, setActionMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch offices
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await axios.get('/api/offices');
        if (res.data.success && res.data.offices.length > 0) {
          setOffices(res.data.offices);
          setSelectedOfficeId(res.data.offices[0].id);
        }
      } catch (err) {
        console.error('Error fetching offices:', err);
      }
    };
    fetchOffices();
  }, []);

  // Fetch live queue for selected office
  const fetchQueueData = async (officeId: string) => {
    if (!officeId) return;
    try {
      const res = await axios.get(`/api/bookings/live-queue/${officeId}`);
      if (res.data.success) {
        setLiveQueue(res.data);
      }
    } catch (err) {
      console.error('Error fetching live queue:', err);
    }
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      const res = await axios.get('/api/admin/analytics');
      if (res.data.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  useEffect(() => {
    if (selectedOfficeId) {
      fetchQueueData(selectedOfficeId);
    }
    fetchAnalyticsData();
    setIsLoading(false);
  }, [selectedOfficeId]);

  // Actions
  const handleCallNext = async () => {
    try {
      const res = await axios.post('/api/admin/call-next', {
        officeId: selectedOfficeId,
        counterNumber: selectedCounterNum
      });
      if (res.data.success) {
        setActionMessage(res.data.message);
        await fetchQueueData(selectedOfficeId);
      }
    } catch (e: any) {
      setActionMessage(e.response?.data?.error || 'Failed to call token');
    }
  };

  const handleCompleteCurrent = async () => {
    try {
      const res = await axios.post('/api/admin/complete', {
        officeId: selectedOfficeId
      });
      if (res.data.success) {
        setActionMessage(res.data.message);
        await fetchQueueData(selectedOfficeId);
        await fetchAnalyticsData();
      }
    } catch (e: any) {
      setActionMessage(e.response?.data?.error || 'Failed to complete token');
    }
  };

  const handleSkip = async (bookingRef: string) => {
    try {
      const res = await axios.post('/api/admin/skip', { bookingRef });
      if (res.data.success) {
        setActionMessage(res.data.message);
        await fetchQueueData(selectedOfficeId);
      }
    } catch (e: any) {
      setActionMessage('Failed to skip token');
    }
  };

  const handleCancel = async (bookingRef: string) => {
    try {
      const res = await axios.post('/api/admin/cancel', { bookingRef });
      if (res.data.success) {
        setActionMessage(res.data.message);
        await fetchQueueData(selectedOfficeId);
      }
    } catch (e: any) {
      setActionMessage('Failed to cancel token');
    }
  };

  const handleToggleCounter = async (counterId: string) => {
    try {
      const res = await axios.post('/api/admin/toggle-counter', { counterId });
      if (res.data.success) {
        setActionMessage('Counter status updated');
        await fetchQueueData(selectedOfficeId);
      }
    } catch (e) {
      setActionMessage('Failed to toggle counter');
    }
  };

  const handleAdaptiveReschedule = async () => {
    try {
      const res = await axios.post('/api/admin/reschedule', {
        officeId: selectedOfficeId
      });
      if (res.data.success) {
        setActionMessage(res.data.message);
        await fetchQueueData(selectedOfficeId);
      }
    } catch (e) {
      setActionMessage('Failed to reschedule queue');
    }
  };

  return (
    <Layout showBack backPath="/login?type=staff">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.9rem', marginBottom: '4px' }}>{t('admin.title')}</h1>
            <p style={{ fontSize: '1rem', color: 'var(--color-ink-soft)' }}>
              {t('admin.subtitle')}
            </p>
          </div>

          {/* Right Controls: Staff Info + Office Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {staffUser && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 16px',
                  backgroundColor: 'rgba(16, 21, 36, 0.85)',
                  backdropFilter: 'blur(12px)',
                  border: '1.5px solid var(--color-gold)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                    {staffUser.name}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-gold)', fontWeight: 600 }}>
                    {staffUser.staffId || staffUser.email} • {staffUser.department || 'Officer'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logoutStaff();
                    navigate('/login?type=staff');
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>
            )}

            {/* Office Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={18} color="var(--color-gold)" />
              <select
                value={selectedOfficeId}
                onChange={(e) => setSelectedOfficeId(e.target.value)}
                aria-label="Select office to administer"
                style={{
                  height: '44px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--color-gold)',
                  backgroundColor: 'var(--bg-input)',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {offices.map((o) => (
                  <option key={o.id} value={o.id} style={{ backgroundColor: '#0C0F19', color: '#FFFFFF' }}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          role="tablist"
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--color-border)',
            marginTop: '20px'
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'console'}
            onClick={() => setActiveTab('console')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === 'console' ? 'var(--color-gold-deep)' : 'var(--color-ink-soft)',
              borderBottom: activeTab === 'console' ? '2px solid var(--color-gold-deep)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Monitor size={17} />
            <span>{t('admin.consoleTab')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === 'analytics' ? 'var(--color-gold-deep)' : 'var(--color-ink-soft)',
              borderBottom: activeTab === 'analytics' ? '2px solid var(--color-gold-deep)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <BarChart3 size={17} />
            <span>{t('admin.analyticsTab')}</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          role="status"
          style={{
            padding: '12px 18px',
            backgroundColor: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid var(--color-gold)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            fontSize: '0.92rem',
            fontWeight: 600,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backdropFilter: 'blur(10px)'
          }}
        >
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage('')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-gold)', fontWeight: 700 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: LIVE COUNTER DESK CONSOLE */}
      {activeTab === 'console' && liveQueue && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Action Control Bar */}
          <div
            className="card"
            style={{
              padding: '24px',
              border: '1.5px solid var(--color-gold)',
              backgroundColor: 'var(--bg-card)',
              backdropFilter: 'blur(18px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                  Active Counter Desk:
                </span>
                <select
                  value={selectedCounterNum}
                  onChange={(e) => setSelectedCounterNum(Number(e.target.value))}
                  aria-label="Select desk number"
                  style={{
                    height: '44px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--color-gold)',
                    backgroundColor: 'var(--bg-input)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {liveQueue.counters.map((c: any) => (
                    <option key={c.id} value={c.counterNumber} style={{ backgroundColor: '#0C0F19', color: '#FFFFFF' }}>
                      Desk {c.counterNumber} ({c.staffName}) {c.isOpen ? '• Open' : '• Closed'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleCallNext}
                  className="btn-gold"
                  style={{ minHeight: '48px', padding: '0 20px' }}
                >
                  <Play size={16} />
                  <span>{t('admin.callNextBtn')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompleteCurrent}
                  className="btn-secondary"
                  style={{ minHeight: '48px', padding: '0 18px' }}
                >
                  <CheckCircle size={16} />
                  <span>{t('admin.completeBtn')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAdaptiveReschedule}
                  className="btn-secondary"
                  title="Re-sort queue using ML scores (waited time + priority weight + FIFO)"
                  style={{ minHeight: '48px', padding: '0 16px' }}
                >
                  <RotateCw size={16} />
                  <span>{t('admin.rescheduleBtn')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Counters Status */}
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>{t('admin.countersTitle')}</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '14px'
              }}
            >
              {liveQueue.counters.map((counter: any) => (
                <div
                  key={counter.id}
                  className="card"
                  style={{
                    padding: '18px',
                    border: counter.isOpen ? '1.5px solid var(--color-gold)' : '1px dashed var(--color-border)',
                    backgroundColor: counter.isOpen ? 'rgba(16, 21, 36, 0.95)' : 'rgba(10, 13, 22, 0.6)',
                    boxShadow: counter.isOpen ? '0 0 16px rgba(212, 175, 55, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: counter.isOpen ? 'var(--color-gold)' : 'var(--color-text-dim)' }}>
                      Desk {counter.counterNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleCounter(counter.id)}
                      aria-label="Toggle counter status"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: counter.isOpen ? 'var(--color-success)' : 'var(--color-text-dim)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      {counter.isOpen ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      <span>{counter.isOpen ? 'Open' : 'Closed'}</span>
                    </button>
                  </div>

                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
                    {counter.staffName}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    Serving:{' '}
                    <strong className="token-num" style={{ fontSize: '1.2rem', color: counter.currentToken ? 'var(--color-gold)' : 'var(--color-text-dim)' }}>
                      {counter.currentToken || 'None'}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Waiting Queue Table Sorted by Adaptive Priority Score */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>
                Live Waiting Queue ({liveQueue.totalWaiting} citizens)
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-gold-deep)', fontWeight: 600 }}>
                Sorted by Adaptive Priority Score
              </span>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto', border: '1.5px solid var(--color-gold-hairline)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(22, 29, 49, 0.95)', borderBottom: '1.5px solid var(--color-gold-hairline)', color: 'var(--color-gold)' }}>
                    <th style={{ padding: '14px 16px', fontWeight: 700 }}>Rank</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700 }}>Token</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700 }}>Service</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700 }}>Category</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700 }}>Priority Score</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700 }}>Pred. Wait</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {liveQueue.waitingTokens.length > 0 ? (
                    liveQueue.waitingTokens.map((item: any, idx: number) => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          backgroundColor: idx === 0 ? 'rgba(212, 175, 55, 0.12)' : (idx % 2 === 0 ? 'rgba(16, 21, 36, 0.9)' : 'rgba(11, 15, 26, 0.9)'),
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-gold)' }}>
                          #{item.currentRank}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                          {item.tokenNumber}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)' }}>
                          {item.serviceName}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              textTransform: 'capitalize',
                              backgroundColor: item.priorityCategory === 'none' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(212, 175, 55, 0.15)',
                              color: item.priorityCategory === 'none' ? '#FFFFFF' : 'var(--color-gold)',
                              border: '1px solid var(--color-gold-hairline)'
                            }}
                          >
                            {item.priorityCategory.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-gold)' }}>
                          {item.priorityScore.toFixed(1)} pts
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: '#FFFFFF', fontWeight: 600 }}>
                          {item.predictedWaitMinutes} mins
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleSkip(item.bookingRef)}
                              title="Skip Token"
                              style={{
                                padding: '6px 12px',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(255, 255, 255, 0.08)',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: '#FFFFFF'
                              }}
                            >
                              Skip
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancel(item.bookingRef)}
                              title="Cancel Token"
                              style={{
                                padding: '6px 12px',
                                border: '1px solid var(--color-error)',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(239, 68, 68, 0.12)',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                color: 'var(--color-error)'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No waiting tokens currently in line for this office.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REAL ANALYTICS DASHBOARD (STRICTLY INK AND GOLD ONLY) */}
      {activeTab === 'analytics' && analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Summary Stat Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}
          >
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-soft)', fontWeight: 600 }}>
                Total Tokens Handled
              </div>
              <div className="token-num" style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '4px' }}>
                {analytics.summary.totalBookings}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-ink-soft)', marginTop: '2px' }}>
                All recorded sessions
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-soft)', fontWeight: 600 }}>
                Tokens Completed
              </div>
              <div className="token-num" style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--color-success)' }}>
                {analytics.summary.completedBookings}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-ink-soft)', marginTop: '2px' }}>
                Successfully served
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-soft)', fontWeight: 600 }}>
                Currently Waiting
              </div>
              <div className="token-num" style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '4px', color: 'var(--color-gold-deep)' }}>
                {analytics.summary.waitingBookings}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-ink-soft)', marginTop: '2px' }}>
                In active queue
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-ink-soft)', fontWeight: 600 }}>
                Priority Ratio
              </div>
              <div className="token-num" style={{ fontSize: '2.4rem', fontWeight: 800, marginTop: '4px' }}>
                {analytics.summary.priorityRatio}%
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-ink-soft)', marginTop: '2px' }}>
                Senior / Maternity / Disability
              </div>
            </div>
          </div>

          {/* Chart 1: Priority Tier Distribution (Pie Chart in Ink & Gold) */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Priority Tier Distribution</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-ink-soft)', marginBottom: '20px' }}>
              Computed from actual bookings in database
            </p>

            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.priorityDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={50}
                    label={(entry) => `${entry.name} (${entry.count})`}
                  >
                    {analytics.priorityDistribution.map((_e: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={GOLD_PALETTE[index % GOLD_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(16, 21, 36, 0.95)',
                      border: '1px solid var(--color-gold)',
                      borderRadius: '8px',
                      color: '#FFFFFF'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Daily Volume (Bar Chart in Ink & Gold) */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Daily Volume (Last 7 Days)</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              Total issued tokens vs completed public service transactions
            </p>

            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailyVolume}>
                  <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.4)" fontSize={12} />
                  <YAxis stroke="rgba(255, 255, 255, 0.4)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(16, 21, 36, 0.95)',
                      border: '1px solid var(--color-gold)',
                      borderRadius: '8px',
                      color: '#FFFFFF'
                    }}
                  />
                  <Bar dataKey="total" fill="rgba(212, 175, 55, 0.35)" name="Total Issued" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#D4AF37" name="Completed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Average Wait Time by Priority Category (Horizontal Bar in Gold) */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Average Wait Time by Priority Category</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              Demonstrates empirical wait reduction for vulnerable citizens through adaptive scheduling
            </p>

            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.waitTimeTrend} layout="vertical">
                  <XAxis type="number" stroke="rgba(255, 255, 255, 0.4)" unit=" min" fontSize={12} />
                  <YAxis dataKey="category" type="category" stroke="rgba(255, 255, 255, 0.4)" width={140} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(16, 21, 36, 0.95)',
                      border: '1px solid var(--color-gold)',
                      borderRadius: '8px',
                      color: '#FFFFFF'
                    }}
                  />
                  <Bar dataKey="avgWaitMinutes" fill="#B8923F" name="Avg Wait Time (mins)" radius={[0, 4, 4, 0]}>
                    {analytics.waitTimeTrend.map((_e: any, index: number) => (
                      <Cell key={`bar-${index}`} fill={index === 0 ? '#8C6D2E' : index === 3 ? '#0A0A0A' : '#B8923F'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
