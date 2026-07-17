import { useEffect, useState } from 'react';
import { notificationApi } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { Heart, UserPlus, MessageCircle, Bell, BellOff } from 'lucide-react';

const TYPE_CONFIG = {
  LIKE:    { icon: Heart,          color: '#ec4899', label: 'liked your post' },
  FOLLOW:  { icon: UserPlus,       color: '#8b5cf6', label: 'followed you'    },
  COMMENT: { icon: MessageCircle,  color: '#06b6d4', label: 'commented'       },
  MENTION: { icon: Bell,           color: '#f59e0b', label: 'mentioned you'   },
};

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function NotificationItem({ n, onClick }) {
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.LIKE;
  const Icon = cfg.icon;
  return (
    <div
      onClick={() => onClick(n)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 20px',
        cursor: 'pointer', transition: 'background 0.15s',
        background: n.read ? 'transparent' : 'rgba(139,92,246,0.06)',
        borderBottom: '1px solid var(--border)',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
      onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(139,92,246,0.06)'}
    >
      {/* Icon badge */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div className="avatar avatar-sm">
          {n.actor?.displayName?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{
          position: 'absolute', bottom: -2, right: -2, width: 18, height: 18,
          borderRadius: '50%', background: cfg.color, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--bg-primary)'
        }}>
          <Icon size={9} color="#fff" />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
          <strong>{n.actor?.displayName}</strong>
          {' '}{n.message || cfg.label}
        </p>
        {n.preview && (
          <p style={{
            margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)',
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
          }}>"{n.preview}"</p>
        )}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
          {timeAgo(n.createdAt)}
        </span>
      </div>

      {/* Unread dot */}
      {!n.read && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: 6, flexShrink: 0 }} />
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [page, setPage]         = useState(0);
  const [hasMore, setHasMore]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    notificationApi.getUnreadCount().then(r => setUnread(r.data || 0)).catch(() => {});
    loadPage(0);
  }, []);

  async function loadPage(p) {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationApi.getNotifications(p);
      const data = res.data;
      const items = data.content || [];
      setNotifications(prev => p === 0 ? items : [...prev, ...items]);
      setHasMore(!data.last);
    } catch (err) { 
      setError(err.response?.data?.message || 'Could not load notifications');
      toast.error('Could not load notifications'); 
    }
    finally { setLoading(false); }
  }

  const markAllRead = async () => {
    await notificationApi.markAsRead();
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const handleClick = (n) => {
    if (n.referenceId) navigate(`/profile/${n.actor?.id}`);
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Notifications</h1>
          {unread > 0 && (
            <span style={{
              background: 'var(--accent)', color: '#fff', borderRadius: 99,
              padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700
            }}>{unread}</span>
          )}
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
            <BellOff size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Skeleton */}
      {loading && page === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({length: 5}).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 0 }} />
          ))}
        </div>
      )}

      {/* Empty / Error state */}
      {loading && notifications.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-error/30 bg-error/5">
          <p className="font-body-lg text-error">{error}</p>
          <button className="mt-4 px-4 py-2 bg-error text-white rounded-lg" onClick={() => loadPage(0)}>Retry</button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <h3>No notifications yet</h3>
          <p>When you get likes or mentions, they will appear here.</p>
        </div>
      ) : null}

      {/* Notifications list */}
      {notifications.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {notifications.map(n => <NotificationItem key={n.id} n={n} onClick={handleClick} />)}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && notifications.length > 0 && (
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
          onClick={() => { const next = page + 1; setPage(next); loadPage(next); }}
        >
          Load more
        </button>
      )}
    </div>
  );
}
