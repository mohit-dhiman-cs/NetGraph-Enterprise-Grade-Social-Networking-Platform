import { useState, useEffect, useRef } from 'react';
import { aiApi } from '../api/client';
import toast from 'react-hot-toast';
import {
  Brain, Sparkles, TrendingUp, BarChart2, Zap,
  Copy, RefreshCw, ChevronRight, Hash, MessageSquare,
  ThumbsUp, ThumbsDown, Minus, CheckCircle
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────
const SENTIMENT_CONFIG = {
  POSITIVE: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: ThumbsUp,  label: 'Positive' },
  NEGATIVE: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: ThumbsDown, label: 'Negative' },
  NEUTRAL:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: Minus,      label: 'Neutral'  },
};

function ScoreRing({ score }) {
  const r = 42, cx = 52, cy = 52;
  const circ = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={104} height={104} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x={cx} y={cy + 6} textAnchor="middle" fill={color} fontSize={18} fontWeight={800}>{score}</text>
      <text x={cx} y={cy + 20} textAnchor="middle" fill="#64748b" fontSize={9}>/ 100</text>
    </svg>
  );
}

// ── Section header ─────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, badge, color = '#8b5cf6' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} />
      </div>
      <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{title}</h2>
      {badge && <span className="badge badge-accent" style={{ fontSize: '0.72rem' }}>{badge}</span>}
    </div>
  );
}

// ── 1. AI Post Generator ──────────────────────────────────────
function PostGenerator({ onUse }) {
  const [topic, setTopic]     = useState('');
  const [ideas, setIdeas]     = useState([]);
  const [loading, setLoading] = useState(false);

  const topics = ['technology', 'startups', 'AI', 'productivity', 'design', 'career', 'open source', 'crypto', 'climate', 'health'];

  const generate = async (t) => {
    const q = t || topic;
    setLoading(true);
    try {
      const r = await aiApi.generate(q);
      setIdeas(r.data || []);
    } catch { toast.error('Could not generate ideas'); }
    finally { setLoading(false); }
  };

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <SectionHeader icon={Sparkles} title="AI Post Generator" badge="Smart Templates" color="#f59e0b" />

      {/* Quick topic chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {topics.map(t => (
          <button key={t} className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: 99,
              background: topic === t ? 'rgba(139,92,246,0.2)' : 'var(--bg-secondary)',
              border: `1px solid ${topic === t ? 'var(--accent)' : 'var(--border)'}`,
              color: topic === t ? 'var(--accent)' : 'var(--text-muted)' }}
            onClick={() => { setTopic(t); generate(t); }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input className="input" placeholder="Or enter your own topic…"
          value={topic} onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generate()} style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => generate()} disabled={loading || !topic.trim()}>
          {loading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={15} />}
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {ideas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ideas.map((idea, i) => (
            <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '1px solid var(--border)', position: 'relative' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6, paddingRight: 60 }}>{idea}</p>
              <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" style={{ padding: '3px 8px' }}
                  onClick={() => { navigator.clipboard.writeText(idea); toast.success('Copied!'); }}>
                  <Copy size={13} />
                </button>
                {onUse && (
                  <button className="btn btn-primary btn-sm" style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                    onClick={() => onUse(idea)}>
                    Use <ChevronRight size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── 2. Content Scorer ─────────────────────────────────────────
function ContentScorer() {
  const [text, setText]       = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const score = async (content) => {
    if (!content.trim()) { setResult(null); return; }
    setLoading(true);
    try {
      const r = await aiApi.scoreContent(content);
      setResult(r.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleChange = (val) => {
    setText(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => score(val), 500);
  };

  const sentCfg = result ? SENTIMENT_CONFIG[result.sentiment] || SENTIMENT_CONFIG.NEUTRAL : null;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <SectionHeader icon={Zap} title="Post Quality Scorer" badge="Real-time" color="#06b6d4" />
      <textarea className="input"
        placeholder="Type or paste your post draft here to get an instant quality score…"
        value={text} onChange={e => handleChange(e.target.value)}
        style={{ minHeight: 100, resize: 'vertical', marginBottom: 16 }} />

      {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Analyzing…</div>}

      {result && !loading && (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <ScoreRing score={result.score} />
          <div style={{ flex: 1, minWidth: 200 }}>
            {/* Sentiment */}
            {sentCfg && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: sentCfg.bg, marginBottom: 12 }}>
                <sentCfg.icon size={13} color={sentCfg.color} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: sentCfg.color }}>{sentCfg.label} Tone</span>
              </div>
            )}
            {/* Tips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.tips?.map((tip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={13} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />
                  {tip}
                </div>
              ))}
            </div>
            {/* Char count */}
            <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {text.length} chars · {text.trim().split(/\s+/).length} words
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 3. Sentiment Analyzer (free text) ────────────────────────
function SentimentAnalyzer() {
  const [text, setText]       = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const r = await aiApi.sentiment(text);
      setResult(r.data);
    } catch { toast.error('Analysis failed'); }
    finally { setLoading(false); }
  };

  const cfg = result ? SENTIMENT_CONFIG[result.label] || SENTIMENT_CONFIG.NEUTRAL : null;

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <SectionHeader icon={MessageSquare} title="Sentiment Analyzer" badge="NLP Powered" color="#ec4899" />
      <div style={{ display: 'flex', gap: 8, marginBottom: cfg ? 16 : 0 }}>
        <input className="input" placeholder="Paste any text to analyze its sentiment…"
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyze()} style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={analyze} disabled={loading || !text.trim()}>
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      {cfg && result && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: cfg.bg, borderRadius: 'var(--radius-md)', border: `1px solid ${cfg.color}33` }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: cfg.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <cfg.icon size={26} color={cfg.color} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Confidence score: <strong>{Math.abs(result.score)}</strong> ·
              🟢 {result.positiveWords} positive · 🔴 {result.negativeWords} negative keywords found
            </div>
          </div>
          {/* Mini score bar */}
          <div style={{ width: 80 }}>
            <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: cfg.color, borderRadius: 99, width: `${Math.abs(result.score) * 100}%`, transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>{(Math.abs(result.score) * 100).toFixed(0)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 4. Platform Insights Dashboard ───────────────────────────
function InsightsDashboard() {
  const [insights, setInsights]   = useState(null);
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([aiApi.insights(), aiApi.sentimentDashboard()])
      .then(([iRes, pRes]) => { setInsights(iRes.data); setPosts(pRes.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card"><div className="skeleton" style={{ height: 200 }} /></div>;
  if (!insights) return null;

  const total = insights.positive + insights.negative + insights.neutral || 1;
  const bars = [
    { label: 'Positive', value: insights.positive, color: '#10b981' },
    { label: 'Neutral',  value: insights.neutral,  color: '#94a3b8' },
    { label: 'Negative', value: insights.negative, color: '#ef4444' },
  ];

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <SectionHeader icon={BarChart2} title="Platform Sentiment Dashboard" badge="Live" color="#8b5cf6" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Health score */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <ScoreRing score={insights.healthScore} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Community Health</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{insights.totalAnalyzed} posts analyzed</div>
          </div>
        </div>

        {/* Sentiment bars */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
          {bars.map(b => (
            <div key={b.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 3 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{b.label}</span>
                <span style={{ color: b.color, fontWeight: 700 }}>{b.value}</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: b.color, borderRadius: 99, width: `${(b.value / total) * 100}%`, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending topics */}
      {insights.topics?.keywords?.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Trending Keywords</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {insights.topics.keywords.map((k, i) => (
              <span key={i} style={{
                padding: '4px 10px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 600,
                background: `hsl(${250 + i * 12}, 70%, 25%)`,
                color: `hsl(${250 + i * 12}, 90%, 75%)`,
                border: `1px solid hsl(${250 + i * 12}, 70%, 35%)`
              }}>
                {k.word} <span style={{ opacity: 0.7 }}>×{k.count}</span>
              </span>
            ))}
          </div>
        </>
      )}

      {/* Trending hashtags */}
      {insights.topics?.hashtags?.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Hash size={14} style={{ color: '#06b6d4' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Trending Hashtags</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {insights.topics.hashtags.map((h, i) => (
              <span key={i} className="badge badge-accent">{h.tag} ×{h.count}</span>
            ))}
          </div>
        </>
      )}

      {/* Post sentiment list */}
      {posts.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>Trending Post Analysis</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {posts.slice(0, 5).map(p => {
              const cfg = SENTIMENT_CONFIG[p.label] || SENTIMENT_CONFIG.NEUTRAL;
              return (
                <div key={p.postId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: `1px solid ${cfg.color}22` }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.preview}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color, flexShrink: 0 }}>{cfg.label}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>❤️ {p.likeCount}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main AI Page ──────────────────────────────────────────────
export default function AiPage() {
  const [activeTab, setActiveTab] = useState('insights');

  const tabs = [
    { key: 'insights',   label: '📊 Insights',   component: <InsightsDashboard /> },
    { key: 'generator',  label: '✨ Post Ideas',  component: <PostGenerator /> },
    { key: 'scorer',     label: '⚡ Score Post',  component: <ContentScorer /> },
    { key: 'sentiment',  label: '🧠 Sentiment',   component: <SentimentAnalyzer /> },
  ];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 0 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={22} style={{ color: '#8b5cf6' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>AI & Intelligence</h1>
          <span className="badge badge-accent">Beta</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Sentiment analysis, post quality scoring, AI-generated content ideas, and platform-wide insights
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === t.key ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: activeTab === t.key ? 700 : 500, fontSize: '0.88rem', marginBottom: -1,
            transition: 'all 0.15s'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tabs.find(t => t.key === activeTab)?.component}
    </div>
  );
}
