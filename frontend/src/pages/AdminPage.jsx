import { useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';
import {
  Users, FileText, UserCheck, AlertTriangle, Shield,
  Activity, RefreshCw, CheckCircle, XCircle, Clock,
  Hash, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// Chart tooltip style
const TT = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.82rem' };

function StatCard({ icon: Icon, label, value, delta, color, sub }) {
  return (
    <div className="stat-card" style={{ transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="stat-label">{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="stat-value">{value?.toLocaleString() ?? '—'}</div>
      {delta && <div className="stat-delta">↑ {delta}</div>}
      {sub   && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const mockWeekly = [
  { day: 'Mon', posts: 40, follows: 24, logins: 88 },
  { day: 'Tue', posts: 85, follows: 57, logins: 142 },
  { day: 'Wed', posts: 62, follows: 90, logins: 110 },
  { day: 'Thu', posts: 112, follows: 43, logins: 198 },
  { day: 'Fri', posts: 98, follows: 76, logins: 165 },
  { day: 'Sat', posts: 130, follows: 102, logins: 230 },
  { day: 'Sun', posts: 78, follows: 65, logins: 120 },
];

const ACTION_COLOR = {
  USER_DEACTIVATED:      '#ef4444',
  USER_REACTIVATED:      '#10b981',
  ROLE_CHANGED:          '#f59e0b',
  POST_DELETED_BY_ADMIN: '#ef4444',
  POST_CREATED:          '#8b5cf6',
  USER_FOLLOWED:         '#06b6d4',
  COMMENT_DELETED:       '#f59e0b',
};

export default function AdminPage() {
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [audit, setAudit]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overview');
  const [actionLoading, setActionLoading] = useState({});

  const reload = () => {
    setLoading(true);
    Promise.all([
      adminApi.getStats(),
      adminApi.getAllUsers(),
      adminApi.getRecentAudit(),
    ])
      .then(([s, u, a]) => {
        setStats(s.data);
        setUsers(u.data.content || []);
        setAudit(a.data || []);
      })
      .catch(e => toast.error('Admin load failed: ' + (e.response?.status === 403 ? 'Forbidden (need ADMIN role)' : e.message)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const userAction = async (action, userId, label) => {
    setActionLoading(l => ({ ...l, [userId]: true }));
    try {
      await adminApi[action](userId);
      toast.success(label);
      reload();
    } catch { toast.error('Action failed'); }
    finally { setActionLoading(l => ({ ...l, [userId]: false })); }
  };

  const TABS = ['overview', 'users', 'audit'];

  if (loading) return (
    <div style={{ padding: 40 }}>
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 12, borderRadius: 'var(--radius-lg)' }} />)}
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <Shield size={22} style={{ color: '#f59e0b' }} /> Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>Platform analytics, moderation, and audit logs</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={reload} style={{ gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t ? 'var(--accent-light)' : 'var(--text-muted)',
            fontWeight: tab === t ? 700 : 500, fontSize: '0.88rem', marginBottom: -1, textTransform: 'capitalize',
          }}>
            {t === 'overview' ? '📊 Overview' : t === 'users' ? '👥 Users' : '🔍 Audit Log'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
            <StatCard icon={Users}         label="Total Users"      value={stats?.totalUsers}     color="#8b5cf6" delta="growing" />
            <StatCard icon={UserCheck}     label="Active Users"     value={stats?.activeUsers}    color="#06b6d4" />
            <StatCard icon={FileText}      label="Total Posts"      value={stats?.totalPosts}     color="#10b981" />
            <StatCard icon={AlertTriangle} label="Inactive Accounts" value={stats?.inactiveUsers} color="#f59e0b" />
            <StatCard icon={Activity}      label="Audit Events (24h)" value={stats?.auditEvents24h} color="#ec4899" sub="Admin actions" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div className="card">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16 }}>📈 Weekly Activity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mockWeekly}>
                  <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TT} />
                  <Bar dataKey="posts"   fill="#8b5cf6" radius={[4,4,0,0]} name="Posts" />
                  <Bar dataKey="follows" fill="#06b6d4" radius={[4,4,0,0]} name="Follows" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 16 }}>🟢 Daily Logins</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={mockWeekly}>
                  <defs>
                    <linearGradient id="loginGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TT} />
                  <Area type="monotone" dataKey="logins" stroke="#8b5cf6" strokeWidth={2} fill="url(#loginGrad)" name="Logins" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Audit */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>🔍 Recent Admin Actions</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setTab('audit')}>View all <ChevronRight size={13} /></button>
            </div>
            {audit.slice(0, 8).map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ACTION_COLOR[e.action] || '#94a3b8', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: ACTION_COLOR[e.action] || 'var(--text-primary)' }}>{e.action}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> by @{e.actorUsername}</span>
                  {e.detail && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> — {e.detail.substring(0,50)}</span>}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {e.createdAt ? new Date(e.createdAt).toLocaleTimeString() : ''}
                </span>
              </div>
            ))}
            {audit.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>No audit events yet.</p>}
          </div>
        </>
      )}

      {/* ── USERS ── */}
      {tab === 'users' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>All Users ({users.length})</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  {['User', 'Email', 'Role', 'Posts', 'Followers', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm">{u.displayName?.[0]}</div>
                        <span style={{ fontWeight: 600 }}>{u.displayName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-warning' : 'badge-accent'}`}>{u.role}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{u.postCount}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{u.followerCount}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {u.active
                          ? <><CheckCircle size={14} style={{ color: '#10b981' }} /> <span className="badge badge-success">Active</span></>
                          : <><XCircle size={14} style={{ color: '#ef4444' }} />   <span className="badge badge-danger">Banned</span></>
                        }
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {u.active ? (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={actionLoading[u.id]}
                            onClick={() => userAction('deactivateUser', u.id, `Banned ${u.displayName}`)}
                          >
                            {actionLoading[u.id] ? '…' : 'Ban'}
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm"
                            style={{ background: '#10b981', color: '#fff' }}
                            disabled={actionLoading[u.id]}
                            onClick={() => userAction('reactivateUser', u.id, `Reactivated ${u.displayName}`)}
                          >
                            {actionLoading[u.id] ? '…' : 'Unban'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users.length && <p style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No users found.</p>}
          </div>
        </div>
      )}

      {/* ── AUDIT LOG ── */}
      {tab === 'audit' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Audit Log</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{audit.length} recent events</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  {['Time', 'Actor', 'Action', 'Entity', 'Detail'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audit.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={12} />
                        {e.createdAt ? new Date(e.createdAt).toLocaleString() : 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>@{e.actorUsername}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.78rem', color: ACTION_COLOR[e.action] || 'var(--accent-light)', background: (ACTION_COLOR[e.action] || '#8b5cf6') + '15', padding: '2px 8px', borderRadius: 99 }}>
                        {e.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{e.entityType}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.detail || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!audit.length && <p style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No audit events yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
