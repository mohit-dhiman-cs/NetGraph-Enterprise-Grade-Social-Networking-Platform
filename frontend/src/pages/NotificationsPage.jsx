import { useEffect, useState } from 'react';
import { notificationApi } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const TYPE_CONFIG = {
  LIKE:    { icon: 'favorite',     color: 'bg-pink-500',      text: 'text-white', label: 'liked your post' },
  FOLLOW:  { icon: 'person_add',   color: 'bg-purple-500',    text: 'text-white', label: 'followed you'    },
  COMMENT: { icon: 'chat_bubble',  color: 'bg-cyan-500',      text: 'text-white', label: 'commented'       },
  MENTION: { icon: 'alternate_email', color: 'bg-amber-500',  text: 'text-white', label: 'mentioned you'   },
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
  return (
    <div
      onClick={() => onClick(n)}
      className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low ${n.read ? 'bg-transparent' : 'bg-primary/5'}`}
    >
      {/* Icon badge */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
          {n.actor?.displayName?.[0]?.toUpperCase() || '?'}
        </div>
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${cfg.color} flex items-center justify-center border-2 border-surface`}>
          <span className={`material-symbols-outlined text-[10px] ${cfg.text}`}>{cfg.icon}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="m-0 text-sm text-on-surface leading-snug">
          <strong className="font-bold">{n.actor?.displayName}</strong>
          {' '}{n.message || cfg.label}
        </p>
        {n.preview && (
          <p className="mt-1 text-xs text-on-surface-variant truncate">"{n.preview}"</p>
        )}
        <span className="text-xs text-on-surface-variant mt-1 block">
          {timeAgo(n.createdAt)}
        </span>
      </div>

      {/* Unread dot */}
      {!n.read && (
        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const { unreadCount, markAllRead: contextMarkAllRead } = useNotifications();
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [page, setPage]         = useState(0);
  const [hasMore, setHasMore]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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
    }
    finally { setLoading(false); }
  }

  const handleMarkAllRead = async () => {
    await contextMarkAllRead();
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  };

  const handleClick = (n) => {
    if (n.referenceId) navigate(`/profile/${n.actor?.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-on-surface m-0 tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-primary text-on-primary rounded-full px-2.5 py-0.5 text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-semibold px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors" onClick={handleMarkAllRead}>
            <span className="material-symbols-outlined text-[18px]">done_all</span> Mark all read
          </button>
        )}
      </div>

      {/* Skeleton */}
      {loading && page === 0 && (
        <div className="glass-panel overflow-hidden">
          {Array.from({length: 5}).map((_, i) => (
            <div key={i} className="animate-pulse flex items-start gap-3 p-4 border-b border-outline-variant/10 last:border-0">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-surface-container-highest rounded w-3/4" />
                <div className="h-3 bg-surface-container-highest rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty / Error state */}
      {loading && notifications.length === 0 ? null : error ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-error/30 bg-error/5">
          <p className="font-body-lg text-error">{error}</p>
          <button className="mt-4 px-4 py-2 bg-error text-white rounded-lg font-bold" onClick={() => loadPage(0)}>Retry</button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-panel">
          <span className="material-symbols-outlined text-[64px] text-outline-variant mb-6">notifications_off</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">No notifications yet</h3>
          <p className="text-on-surface-variant font-medium max-w-[280px]">When you get likes or mentions, they will appear here.</p>
        </div>
      ) : null}

      {/* Notifications list */}
      {notifications.length > 0 && (
        <div className="glass-panel overflow-hidden p-0">
          {notifications.map(n => <NotificationItem key={n.id} n={n} onClick={handleClick} />)}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && notifications.length > 0 && (
        <button
          className="w-full mt-4 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-semibold rounded-xl transition-colors border border-outline-variant/20"
          onClick={() => { const next = page + 1; setPage(next); loadPage(next); }}
        >
          Load more
        </button>
      )}
    </div>
  );
}
