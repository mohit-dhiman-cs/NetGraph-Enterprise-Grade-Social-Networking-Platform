import { useEffect, useState } from 'react';
import { userApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Search, Users, GitBranch } from 'lucide-react';
import GraphVisualization from '../components/GraphVisualization';

export default function DiscoverPage() {
  const { user } = useAuth();
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [pathTarget, setPathTarget] = useState('');
  const [path, setPath]             = useState(null);
  const [searching, setSearching]   = useState(false);
  const [pathLoading, setPathLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  useEffect(() => {
    userApi.getSuggestions(8)
      .then(r => setSuggestions(r.data))
      .catch(() => {})
      .finally(() => setSuggestionsLoading(false));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try { const r = await userApi.search(query); setResults(r.data); }
    catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  };

  const handleFollow = async (id, isFollowing) => {
    try {
      isFollowing ? await userApi.unfollow(id) : await userApi.follow(id);
      const update = list => list.map(u => u.id === id ? { ...u, isFollowing: !isFollowing, followerCount: u.followerCount + (isFollowing ? -1 : 1) } : u);
      setSuggestions(update); setResults(update);
      toast.success(isFollowing ? 'Unfollowed' : 'Followed!');
    } catch { toast.error('Action failed'); }
  };

  const findPath = async (e) => {
    e.preventDefault();
    if (!pathTarget.trim()) return;
    setPathLoading(true);
    setPath(null);
    try { 
      const r = await userApi.getPath(pathTarget); 
      setPath(r.data); 
    }
    catch (err) { 
      toast.error(err.response?.data?.message || 'Path not found'); 
      setPath({ error: 'Path not found' });
    }
    finally { setPathLoading(false); }
  };

  const displayList = results.length ? results : suggestions;

  return (
    <div className="page-container">
      {/* Search */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Discover People</h1>
        <p>BFS-powered friend recommendations & connection paths</p>
      </div>

      <GraphVisualization />

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, margin: '24px 0' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" placeholder="Search users by name or username…" value={query}
            onChange={e => { setQuery(e.target.value); if (!e.target.value) setResults([]); }}
            style={{ paddingLeft: 38 }} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={searching}>
          {searching ? '…' : <><Search size={15}/> Search</>}
        </button>
      </form>

      {/* BFS Path Finder */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.06))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <GitBranch size={18} style={{ color: 'var(--accent-light)' }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>BFS Connection Path Finder</h3>
          <span className="badge badge-accent">Shortest Path Algorithm</span>
        </div>
        <p style={{ fontSize: '0.85rem', marginBottom: 14 }}>Like LinkedIn's "2nd degree connections" — enter a User ID to find your shortest connection path.</p>
        <form onSubmit={findPath} style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="Enter target User ID…" value={pathTarget} onChange={e => setPathTarget(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-secondary" type="submit" disabled={pathLoading}>{pathLoading ? 'Searching…' : 'Find Path'}</button>
        </form>
        {path && (
          <div style={{ marginTop: 16 }}>
            {path.error ? (
              <span className="badge badge-warning">{path.error}</span>
            ) : path.path?.length > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {path.path.map((id, i) => (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="chip">{id.slice(0, 8)}…</span>
                      {i < path.path.length - 1 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                    </div>
                  ))}
                </div>
                <span className="badge badge-success">✓ {path.degrees} degree{path.degrees !== 1 ? 's' : ''} of separation</span>
              </>
            ) : <span className="badge badge-warning">No path found within 6 hops</span>}
          </div>
        )}
      </div>

      {/* User grid */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Users size={16} style={{ color: 'var(--text-muted)' }} />
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>
          {results.length ? `${results.length} results for "${query}"` : 'Recommended for You'}
        </h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {searching || (suggestionsLoading && !query) ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="user-card skeleton" style={{ height: '88px', border: 'none' }} />
          ))
        ) : displayList.map(u => (
          <div key={u.id} className="user-card">
            <div className="avatar avatar-lg">{u.displayName?.[0] || '?'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{u.displayName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>@{u.username}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}><b>{u.followerCount}</b> followers</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}><b>{u.postCount}</b> posts</span>
              </div>
            </div>
            <button className={`btn btn-sm ${u.isFollowing ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => handleFollow(u.id, u.isFollowing)}>
              {u.isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          </div>
        ))}
        {!displayList.length && !searching && !suggestionsLoading && (
          <div className="card" style={{ textAlign: 'center', gridColumn: '1/-1', padding: 40 }}>
            <span className="material-symbols-outlined text-[48px] text-outline-variant mb-4">search_off</span>
            <p>No users found. Try a different search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
