import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi, postApi } from '../api/client';
import { Search, X, User, FileText, TrendingUp } from 'lucide-react';

function UserResult({ user, onNavigate }) {
  return (
    <button
      onClick={() => onNavigate(`/profile/${user.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
        textAlign: 'left', transition: 'background 0.15s', borderRadius: 8,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      <div className="avatar avatar-sm">{user.displayName?.[0]?.toUpperCase()}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user.displayName}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{user.username} · {user.followerCount} followers</div>
      </div>
      {user.followedByCurrentUser && <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>Following</span>}
    </button>
  );
}

function PostResult({ post, onNavigate }) {
  return (
    <button
      onClick={() => onNavigate(`/profile/${post.author?.id}`)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%',
        padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
        textAlign: 'left', borderRadius: 8, transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      <FileText size={16} style={{ color: 'var(--text-muted)', marginTop: 3, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
        }}>{post.content}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
          by @{post.author?.username} · ❤️ {post.likeCount}
        </div>
      </div>
    </button>
  );
}

export default function SearchPage() {
  const [query, setQuery]       = useState('');
  const [tab, setTab]           = useState('users'); // 'users' | 'posts'
  const [users, setUsers]       = useState([]);
  const [posts, setPosts]       = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();
  const inputRef                = useRef(null);
  const debounceRef             = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Load trending on mount
  useEffect(() => {
    postApi.getTrending().then(r => setTrending(r.data || [])).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setUsers([]); setPosts([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [uRes, pRes] = await Promise.all([
          userApi.search(query),
          postApi.search(query),
        ]);
        setUsers(uRes.data || []);
        setPosts(pRes.data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }, 350);
  }, [query]);

  const go = (path) => navigate(path);
  const hasResults = users.length > 0 || posts.length > 0;
  const showTrending = !query.trim();

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 0 40px' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 20, padding: '0 4px' }}>Search</h1>

      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          ref={inputRef}
          className="input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search people, posts, topics…"
          style={{ paddingLeft: 44, paddingRight: query ? 40 : 14, fontSize: '1rem' }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tabs (only when results exist) */}
      {hasResults && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {[
            { key: 'users', label: 'People', icon: User,       count: users.length },
            { key: 'posts', label: 'Posts',  icon: FileText,   count: posts.length },
          ].map(({ key, label, icon: Icon, count }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === key ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: tab === key ? 700 : 500, fontSize: '0.88rem', marginBottom: -1,
              transition: 'all 0.15s'
            }}>
              <Icon size={14} />
              {label}
              <span style={{ background: 'var(--bg-secondary)', borderRadius: 99, padding: '0 6px', fontSize: '0.75rem' }}>{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56 }} />)}
        </div>
      )}

      {/* Results */}
      {!loading && query && (
        <div className="card" style={{ padding: '8px 0' }}>
          {tab === 'users' && (
            users.length ? users.map(u => <UserResult key={u.id} user={u} onNavigate={go} />)
              : <p style={{ padding: '20px 16px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.88rem' }}>No users found for "{query}"</p>
          )}
          {tab === 'posts' && (
            posts.length ? posts.map(p => <PostResult key={p.id} post={p} onNavigate={go} />)
              : <p style={{ padding: '20px 16px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.88rem' }}>No posts found for "{query}"</p>
          )}
        </div>
      )}

      {/* Trending (default state) */}
      {showTrending && trending.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Trending Posts</span>
          </div>
          <div className="card" style={{ padding: '8px 0' }}>
            {trending.slice(0, 8).map(p => <PostResult key={p.id} post={p} onNavigate={go} />)}
          </div>
        </div>
      )}
    </div>
  );
}
