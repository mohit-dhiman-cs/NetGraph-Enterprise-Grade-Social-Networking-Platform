import { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { graphApi } from '../api/client';
import { Loader2, Share2, Target } from 'lucide-react';

export default function GraphVisualization() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    graphApi.getNetwork()
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="card flex items-center justify-center p-12">
      <Loader2 className="animate-spin text-accent" />
    </div>
  );

  if (!data) return null;

  return (
    <div className="card fade-in" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Share2 size={18} className="text-accent" />
          <h3 style={{ fontSize: '0.95rem' }}>Social Network Graph</h3>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="badge badge-accent"><Target size={12} /> Live Clusters</div>
        </div>
      </div>
      
      <div style={{ background: '#0a0a0f', height: 400 }}>
        <ForceGraph2D
          graphData={data}
          nodeLabel="label"
          nodeColor={node => node.color}
          linkColor={() => 'rgba(148, 163, 184, 0.2)'}
          nodeRelSize={6}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          width={800}
          height={400}
          backgroundColor="transparent"
        />
      </div>

      <div style={{ padding: '12px 20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }}></span> You
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span> Friends
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }}></span> Community
        </div>
      </div>
    </div>
  );
}
