import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userApi, postApi } from '../api/client';

function UserResult({ user, onNavigate }) {
  return (
    <button
      onClick={() => onNavigate(`/profile/${user.id}`)}
      className="w-full flex items-center gap-3 p-4 bg-transparent border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors text-left last:border-0"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
        {user.displayName?.[0]?.toUpperCase() || 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-on-surface">{user.displayName}</div>
        <div className="text-xs text-on-surface-variant">@{user.username} · {user.followerCount} followers</div>
      </div>
      {user.followedByCurrentUser && <span className="text-[0.7rem] bg-secondary/10 text-secondary px-2 py-1 rounded-full font-medium">Following</span>}
    </button>
  );
}

function PostResult({ post, onNavigate }) {
  return (
    <button
      onClick={() => onNavigate(`/profile/${post.author?.id}`)}
      className="w-full flex items-start gap-3 p-4 bg-transparent border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors text-left last:border-0"
    >
      <span className="material-symbols-outlined text-[16px] text-on-surface-variant mt-1 flex-shrink-0">article</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-on-surface leading-snug line-clamp-2">{post.content}</div>
        <div className="text-xs text-on-surface-variant mt-1">
          by @{post.author?.username} · ❤️ {post.likeCount}
        </div>
      </div>
    </button>
  );
}

export default function SearchPage() {
  const location = useLocation();
  const initialQuery = new URLSearchParams(location.search).get('q') || '';
  const [query, setQuery]       = useState(initialQuery);
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
    <div className="max-w-2xl mx-auto py-6 px-4 pb-20">
      <h1 className="text-2xl font-extrabold text-on-surface mb-6 px-1 tracking-tight">Search</h1>

      {/* Search input */}
      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
        <input
          ref={inputRef}
          className="w-full bg-surface-container-highest border border-outline-variant/30 rounded-full py-3 pl-12 pr-12 focus:ring-2 focus:ring-primary/50 focus:bg-surface-container-high transition-all font-body-lg text-on-surface placeholder:text-on-surface-variant/70 shadow-sm"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            // Update URL synchronously when typing (without reloading)
            navigate(`/search?q=${encodeURIComponent(e.target.value)}`, { replace: true });
          }}
          placeholder="Search people, posts, topics…"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); navigate('/search', { replace: true }); }} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Tabs (only when results exist) */}
      {hasResults && (
        <div className="flex gap-2 mb-6 border-b border-outline-variant/20 pb-0">
          {[
            { key: 'users', label: 'People', icon: 'person',       count: users.length },
            { key: 'posts', label: 'Posts',  icon: 'article',   count: posts.length },
          ].map(({ key, label, icon, count }) => (
            <button key={key} onClick={() => setTab(key)} 
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-all -mb-[1px]
                ${tab === key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              {label}
              <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full text-xs font-semibold">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="animate-pulse bg-surface-container-highest rounded-xl h-16 w-full" />)}
        </div>
      )}

      {/* Results */}
      {!loading && query && (
        <div className="glass-panel overflow-hidden">
          {tab === 'users' && (
            users.length ? users.map(u => <UserResult key={u.id} user={u} onNavigate={go} />)
              : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-[48px] text-outline-variant mb-4">search_off</span>
                  <p className="text-on-surface-variant font-medium">No users found for "{query}"</p>
                </div>
              )
          )}
          {tab === 'posts' && (
            posts.length ? posts.map(p => <PostResult key={p.id} post={p} onNavigate={go} />)
              : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-[48px] text-outline-variant mb-4">search_off</span>
                  <p className="text-on-surface-variant font-medium">No posts found for "{query}"</p>
                </div>
              )
          )}
        </div>
      )}

      {/* Trending (default state) */}
      {showTrending && trending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="material-symbols-outlined text-primary">trending_up</span>
            <span className="font-bold text-sm text-on-surface tracking-wide uppercase">Trending Posts</span>
          </div>
          <div className="glass-panel overflow-hidden">
            {trending.slice(0, 8).map(p => <PostResult key={p.id} post={p} onNavigate={go} />)}
          </div>
        </div>
      )}
    </div>
  );
}
