import { useState } from 'react';
import {
  Code, BookOpen, Zap, Shield, Server, Globe,
  Copy, CheckCircle, Terminal, ExternalLink, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

const BASE = 'http://localhost/api';

const ENDPOINTS = [
  {
    tag: 'Auth', color: '#10b981',
    routes: [
      { method: 'POST', path: '/auth/register', desc: 'Register a new user', body: '{ "username": "john", "email": "john@x.com", "password": "pass123", "displayName": "John" }', auth: false },
      { method: 'POST', path: '/auth/login',    desc: 'Get JWT token',        body: '{ "username": "john", "password": "pass123" }', auth: false },
    ]
  },
  {
    tag: 'Posts', color: '#8b5cf6',
    routes: [
      { method: 'GET',    path: '/posts/feed?page=0&size=20', desc: 'Your personalized feed', auth: true },
      { method: 'POST',   path: '/posts',                     desc: 'Create a post',           body: '{ "content": "Hello World!" }', auth: true },
      { method: 'POST',   path: '/posts/{id}/like',           desc: 'Like a post',             auth: true },
      { method: 'GET',    path: '/posts/trending',            desc: 'Trending posts',           auth: true },
      { method: 'GET',    path: '/posts/{id}/comments',       desc: 'List comments',           auth: true },
      { method: 'POST',   path: '/posts/{id}/comments',       desc: 'Add a comment',           body: '{ "content": "Nice post!" }', auth: true },
    ]
  },
  {
    tag: 'Users', color: '#06b6d4',
    routes: [
      { method: 'GET',    path: '/users/search?q=john',      desc: 'Search users',           auth: true },
      { method: 'GET',    path: '/users/{id}/profile',       desc: 'Get user profile',        auth: true },
      { method: 'POST',   path: '/users/{id}/follow',        desc: 'Follow a user',           auth: true },
      { method: 'DELETE', path: '/users/{id}/follow',        desc: 'Unfollow a user',         auth: true },
      { method: 'GET',    path: '/users/suggestions',        desc: 'BFS friend suggestions',  auth: true },
    ]
  },
  {
    tag: 'Graph', color: '#f59e0b',
    routes: [
      { method: 'GET', path: '/graph/my-network',          desc: 'Your 2-degree network (nodes + links)', auth: true },
      { method: 'GET', path: '/graph/path?targetId={id}',  desc: 'BFS shortest connection path',          auth: true },
      { method: 'GET', path: '/graph/stats',               desc: 'Community & influence stats',           auth: true },
    ]
  },
  {
    tag: 'AI', color: '#ec4899',
    routes: [
      { method: 'POST', path: '/ai/sentiment',      desc: 'Analyze text sentiment',   body: '{ "text": "I love this!" }', auth: true },
      { method: 'POST', path: '/ai/score',          desc: 'Score post quality (0-100)', body: '{ "content": "Draft text here" }', auth: true },
      { method: 'GET',  path: '/ai/trending-topics', desc: 'Trending keywords & hashtags', auth: true },
      { method: 'GET',  path: '/ai/generate?topic=AI', desc: 'AI post idea generation', auth: true },
      { method: 'GET',  path: '/ai/insights',       desc: 'Platform-wide AI insights',  auth: true },
    ]
  },
  {
    tag: 'Notifications', color: '#94a3b8',
    routes: [
      { method: 'GET',  path: '/notifications',               desc: 'List notifications (paginated)', auth: true },
      { method: 'GET',  path: '/notifications/unread-count',  desc: 'Unread notification count',      auth: true },
      { method: 'PUT',  path: '/notifications/read-all',      desc: 'Mark all as read',               auth: true },
    ]
  },
];

const METHOD_COLOR = { GET: '#10b981', POST: '#8b5cf6', PUT: '#f59e0b', DELETE: '#ef4444', PATCH: '#06b6d4' };

function CodeBlock({ code, language = 'bash' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: 'relative', background: '#07071a', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.72rem', color: '#64748b' }}>
        <span>{language}</span>
        <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10b981' : '#64748b', display: 'flex', gap: 4, alignItems: 'center' }}>
          {copied ? <CheckCircle size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '12px 16px', fontSize: '0.82rem', color: '#e2e8f0', overflowX: 'auto', lineHeight: 1.6 }}><code>{code}</code></pre>
    </div>
  );
}

function EndpointRow({ route }) {
  const [open, setOpen] = useState(false);
  const curlCmd = `curl -X ${route.method} '${BASE}${route.path}' \\
  ${route.auth ? "-H 'Authorization: Bearer YOUR_TOKEN' \\\n  " : ''}-H 'Content-Type: application/json'${route.body ? ` \\\n  -d '${route.body}'` : ''}`;

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', transition: 'background 0.12s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.75rem', color: METHOD_COLOR[route.method] || '#94a3b8', width: 55, flexShrink: 0 }}>{route.method}</span>
        <code style={{ fontSize: '0.82rem', color: 'var(--text-primary)', flex: 1 }}>{route.path}</code>
        {route.auth && <Lock size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} title="Requires JWT" />}
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>{route.desc}</span>
      </div>
      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          <CodeBlock code={curlCmd} language="bash — cURL example" />
        </div>
      )}
    </div>
  );
}

export default function DevPortalPage() {
  const [activeTag, setActiveTag] = useState('Auth');

  const quickstart = `# 1. Register
curl -X POST '${BASE}/auth/register' \\
  -H 'Content-Type: application/json' \\
  -d '{"username":"dev","email":"dev@test.com","password":"secret","displayName":"Dev"}'

# 2. Login → get token
curl -X POST '${BASE}/auth/login' \\
  -H 'Content-Type: application/json' \\
  -d '{"username":"dev","password":"secret"}'

# 3. Use token
curl '${BASE}/posts/feed' -H 'Authorization: Bearer <token>'`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 0 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Code size={22} style={{ color: '#06b6d4' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Developer Portal</h1>
          <span className="badge badge-success">v2.0</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          REST API reference, quickstart guide, and live cURL examples for building on the NetGraph platform.
        </p>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { icon: Zap,      label: 'Rate Limited',      sub: '200 req/min per IP',        color: '#f59e0b' },
          { icon: Shield,   label: 'JWT Auth',          sub: 'Bearer token required',     color: '#8b5cf6' },
          { icon: Server,   label: 'REST + WebSocket',  sub: 'Real-time messaging',       color: '#10b981' },
          { icon: Globe,    label: 'OpenAPI Docs',      sub: '/swagger-ui.html',          color: '#06b6d4', link: 'http://localhost/api-docs/swagger-ui.html' },
          { icon: Terminal, label: 'Health Check',      sub: '/actuator/health',          color: '#ec4899', link: 'http://localhost/api/actuator/health' },
          { icon: BookOpen, label: 'Graph Algorithms',  sub: 'BFS, DFS, PageRank',        color: '#94a3b8' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: '14px 16px', cursor: c.link ? 'pointer' : 'default' }}
            onClick={() => c.link && window.open(c.link, '_blank')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: c.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <c.icon size={16} color={c.color} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {c.label} {c.link && <ExternalLink size={10} style={{ color: 'var(--text-muted)' }} />}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick start */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 4 }}>⚡ Quick Start</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 0 }}>Get an access token in 3 steps:</p>
        <CodeBlock code={quickstart} language="bash" />
      </div>

      {/* Auth note */}
      <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Lock size={16} style={{ color: '#8b5cf6', marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#8b5cf6', marginBottom: 2 }}>Authentication</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            All protected endpoints require <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }}>Authorization: Bearer &lt;jwt_token&gt;</code> header.
            Tokens expire after 24 hours. Use the <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }}>POST /auth/login</code> endpoint to refresh.
          </div>
        </div>
      </div>

      {/* API Reference */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>📘 API Reference</h2>
        </div>

        {/* Tag filter */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 16px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
          {ENDPOINTS.map(g => (
            <button key={g.tag} onClick={() => setActiveTag(g.tag)} style={{
              padding: '4px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
              background: activeTag === g.tag ? g.color + '25' : 'var(--bg-secondary)',
              color: activeTag === g.tag ? g.color : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}>{g.tag}</button>
          ))}
        </div>

        {/* Routes */}
        {ENDPOINTS.filter(g => g.tag === activeTag).map(group => (
          <div key={group.tag}>
            {group.routes.map((r, i) => <EndpointRow key={i} route={r} />)}
          </div>
        ))}
      </div>

      {/* Rate limits */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12 }}>🚦 Rate Limits</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Endpoint Group', 'Limit', 'Window', 'Header'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['/api/auth/**',  '15 requests',  '1 minute', 'X-RateLimit-Remaining'],
              ['All other APIs', '200 requests', '1 minute', 'X-RateLimit-Remaining'],
            ].map(([ep, lim, win, hdr], i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 0' }}><code style={{ fontSize: '0.8rem', color: 'var(--accent-light)' }}>{ep}</code></td>
                <td style={{ padding: '10px 0', fontWeight: 700, color: '#f59e0b' }}>{lim}</td>
                <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>{win}</td>
                <td style={{ padding: '10px 0' }}><code style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{hdr}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
