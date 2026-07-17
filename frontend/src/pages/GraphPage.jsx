import { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { graphApi, userApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function PathVisualizer({ path, users }) {
  if (!path || path.length === 0) return (
    <div className="text-center py-4 text-on-surface-variant font-body-sm text-sm">
      No connection path found within 6 hops.
    </div>
  );

  return (
    <div className="flex items-center gap-2 flex-wrap py-3">
      {path.map((id, i) => {
        const u = users[id];
        return (
          <div key={id} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md"
                   style={{ background: i === 0 ? '#0058bc' : i === path.length - 1 ? '#8a2bb9' : '#0070eb' }}>
                {(u?.displayName || id)?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="font-label-sm text-[10px] text-on-surface-variant max-w-[60px] truncate text-center">
                {u?.displayName || id.slice(0, 8)}
              </span>
            </div>
            {i < path.length - 1 && <span className="material-symbols-outlined text-outline-variant text-[16px]">chevron_right</span>}
          </div>
        );
      })}
      <div className="ml-auto">
        <span className="bg-tertiary-container/20 text-tertiary px-2 py-1 rounded-full text-xs font-bold">
          {path.length - 1}° of separation
        </span>
      </div>
    </div>
  );
}

export default function GraphPage() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const fgRef = useRef();

  const [graphData, setGraphData]     = useState({ nodes: [], links: [] });
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [stats, setStats]             = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [userMap, setUserMap]         = useState({});

  const [allUsers, setAllUsers]         = useState([]);
  const [pathSearch, setPathSearch]     = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [pathResult, setPathResult]     = useState(null);
  const [pathLoading, setPathLoading]   = useState(false);

  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode]       = useState(null);

  const loadGraph = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      graphApi.getNetwork(),
      userApi.getSuggestions(6),
      userApi.getCommunity(me?.userId),
    ]).then(([gRes, sRes, cRes]) => {
      const map = {};
      const rawNodes = gRes.data.nodes || [];
      rawNodes.forEach(n => { map[n.id] = n; });
      setUserMap(map);

      setGraphData({
        nodes: rawNodes.map(n => ({ ...n, val: n.color === '#3b82f6' ? 8 : 4 })),
        links: (gRes.data.links || []).map(l => ({
          source: l.source, target: l.target,
          color: 'rgba(0,88,188,0.2)'
        }))
      });
      setStats({
        nodes:     rawNodes.length,
        links:     (gRes.data.links || []).length,
        community: cRes.data?.communitySize || 0,
      });
      setSuggestions(sRes.data || []);
    }).catch((err) => {
      setError(err.response?.data?.message || 'Could not load graph');
      toast.error('Could not load graph');
    }).finally(() => setLoading(false));

    userApi.getSuggestions(50).then(r => setAllUsers(r.data || [])).catch(() => {});
  }, [me?.userId]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  useEffect(() => {
    if (!pathSearch.trim()) { setFilteredUsers([]); return; }
    setFilteredUsers(allUsers.filter(u =>
      u.displayName?.toLowerCase().includes(pathSearch.toLowerCase()) ||
      u.username?.toLowerCase().includes(pathSearch.toLowerCase())
    ).slice(0, 6));
  }, [pathSearch, allUsers]);

  const findPath = async () => {
    if (!selectedTarget) return;
    setPathLoading(true);
    setPathResult(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    try {
      const r = await userApi.getPath(selectedTarget.id);
      const p = r.data.path || [];
      setPathResult({ path: p, degrees: r.data.degrees });

      const hn = new Set(p);
      const hl = new Set();
      for (let i = 0; i < p.length - 1; i++) {
        hl.add(`${p[i]}-${p[i+1]}`);
        hl.add(`${p[i+1]}-${p[i]}`);
      }
      setHighlightNodes(hn);
      setHighlightLinks(hl);
    } catch { toast.error('Path search failed'); }
    finally { setPathLoading(false); }
  };

  const paintNode = useCallback((node, ctx, globalScale) => {
    const isHighlighted = highlightNodes.has(node.id);
    const isHovered = node === hoverNode;
    const r = node.val || 4;
    const fontSize = Math.max(10 / globalScale, 2);

    ctx.beginPath();
    ctx.arc(node.x, node.y, r + (isHighlighted || isHovered ? 3 : 0), 0, 2 * Math.PI);
    ctx.fillStyle = isHighlighted
      ? '#a649d5'
      : node.color === '#3b82f6' ? '#0058bc' : '#6664e4';
    ctx.fill();

    if (isHighlighted || isHovered || globalScale > 1.5) {
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = '#414755';
      ctx.textAlign = 'center';
      ctx.fillText(node.label || '', node.x, node.y + r + fontSize + 1);
    }
  }, [highlightNodes, hoverNode]);

  const getLinkColor = useCallback((link) => {
    const key1 = `${link.source.id || link.source}-${link.target.id || link.target}`;
    const key2 = `${link.target.id || link.target}-${link.source.id || link.source}`;
    return highlightLinks.has(key1) || highlightLinks.has(key2)
      ? '#a649d5'
      : 'rgba(0,112,235,0.2)';
  }, [highlightLinks]);

  const handleFollow = async (u) => {
    try {
      await userApi.follow(u.id);
      setSuggestions(s => s.filter(x => x.id !== u.id));
      toast.success(`Following ${u.displayName}!`);
    } catch { toast.error('Follow failed'); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full min-h-[600px]">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
    </div>
  );

  if (error) return (
    <div className="glass-panel p-12 text-center rounded-2xl border border-error/30 bg-error/5 m-lg">
      <h2 className="font-title-lg text-title-lg text-error mb-2">Error Loading Graph</h2>
      <p className="font-body-lg text-error">{error}</p>
      <button className="mt-4 px-4 py-2 bg-error text-white rounded-lg" onClick={loadGraph}>Retry</button>
    </div>
  );

  return (
    <div className="pb-xxl max-w-max-width mx-auto">
      {/* Header Section */}
      <section className="mb-xl flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mt-8">
        <div>
          <h2 className="font-display text-[32px] md:text-display text-on-surface mb-xs">Relationship Graph</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Visualizing your social ecosystem through organic connection nodes. Zoom in to explore deep-level interactions.
          </p>
        </div>
        <div className="flex gap-sm">
          <div className="glass-panel px-md py-sm rounded-full flex items-center gap-sm text-label-md">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            {stats ? `${stats.nodes} Nodes` : 'Loading...'}
          </div>
        </div>
      </section>

      {/* Graph Canvas Container */}
      <section className="relative w-full aspect-[16/11] lg:aspect-[21/9] glass-panel rounded-[32px] overflow-hidden shadow-2xl group border border-white/50 mb-xl flex flex-col">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #0058bc 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
        
        <div className="absolute top-6 left-6 z-10 flex gap-sm bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-white/50">
          <div className="flex items-center gap-2 px-2">
             <span className="w-3 h-3 rounded bg-primary"></span>
             <span className="font-label-sm text-xs">You</span>
          </div>
          <div className="flex items-center gap-2 px-2 border-l border-outline-variant/30">
             <span className="w-3 h-3 rounded bg-secondary-container"></span>
             <span className="font-label-sm text-xs">Connections</span>
          </div>
          <div className="flex items-center gap-2 px-2 border-l border-outline-variant/30">
             <span className="w-3 h-3 rounded bg-tertiary-container"></span>
             <span className="font-label-sm text-xs">Path</span>
          </div>
        </div>
        
        <div className="flex-1 w-full h-full relative" style={{ minHeight: 400 }}>
          {loading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-primary">
               <span className="material-symbols-outlined text-[48px] animate-spin mb-4">refresh</span>
               <span className="font-label-md">Mapping network...</span>
             </div>
          ) : (
             <div className="absolute inset-0 cursor-move">
                <ForceGraph2D
                  ref={fgRef}
                  graphData={graphData}
                  nodeCanvasObject={paintNode}
                  nodeCanvasObjectMode={() => 'replace'}
                  linkColor={getLinkColor}
                  linkWidth={link => {
                    const k1 = `${link.source?.id || link.source}-${link.target?.id || link.target}`;
                    return highlightLinks.has(k1) ? 2.5 : 1;
                  }}
                  linkDirectionalParticles={2}
                  linkDirectionalParticleSpeed={0.006}
                  linkDirectionalParticleColor={getLinkColor}
                  onNodeHover={setHoverNode}
                  onNodeClick={node => navigate(`/profile/${node.id}`)}
                  width={fgRef.current?.parentElement?.clientWidth || window.innerWidth}
                  height={fgRef.current?.parentElement?.clientHeight || 500}
                  backgroundColor="transparent"
                  cooldownTicks={80}
                />
             </div>
          )}
        </div>
      </section>

      {/* Path Finder & Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-xl">
        <div className="lg:col-span-2 glass-panel p-lg rounded-[24px] shadow-sm border border-white/40">
           <div className="flex items-center gap-sm mb-md">
             <span className="p-xs bg-primary-container text-on-primary-container rounded-lg material-symbols-outlined">route</span>
             <h3 className="font-title-lg text-title-lg">Shortest Path Finder</h3>
           </div>
           <p className="font-body-md text-body-md text-on-surface-variant mb-md">
             Discover how you're connected to anyone in the network using BFS routing.
           </p>
           
           <div className="relative mb-md">
             <div className="flex gap-2">
               <div className="relative flex-1">
                 <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                 <input 
                   className="w-full bg-surface-container-low border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20"
                   placeholder="Search for a person..."
                   value={pathSearch}
                   onChange={e => { setPathSearch(e.target.value); setSelectedTarget(null); setPathResult(null); }}
                 />
               </div>
               <button onClick={findPath} disabled={!selectedTarget || pathLoading} className="bg-primary text-white px-6 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                 {pathLoading ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : <span className="material-symbols-outlined text-[18px]">travel_explore</span>}
                 Find Path
               </button>
             </div>
             
             {filteredUsers.length > 0 && !selectedTarget && (
               <div className="absolute top-full left-0 right-[120px] mt-2 glass-panel rounded-xl shadow-xl overflow-hidden z-20">
                 {filteredUsers.map(u => (
                   <button key={u.id} onClick={() => { setSelectedTarget(u); setPathSearch(u.displayName); setFilteredUsers([]); }} className="w-full flex items-center gap-3 p-3 hover:bg-surface-container-low transition-colors text-left border-b border-outline-variant/10 last:border-0">
                     <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs">{u.displayName?.[0]}</div>
                     <div>
                       <div className="font-label-md font-bold text-on-surface">{u.displayName}</div>
                       <div className="font-label-sm text-on-surface-variant">@{u.username}</div>
                     </div>
                   </button>
                 ))}
               </div>
             )}
           </div>
           
           {pathResult && (
             <div className="bg-surface-container-low/50 rounded-xl p-4 border border-outline-variant/10">
               <PathVisualizer path={pathResult.path} users={userMap} />
             </div>
           )}
        </div>
        
        <div className="glass-panel p-lg rounded-[24px] shadow-sm border border-white/40 flex flex-col gap-md">
           <div className="flex justify-between items-center mb-2">
             <span className="font-label-md text-label-md text-on-surface-variant">Network Influence</span>
             <span className="text-primary font-bold">High</span>
           </div>
           <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden mb-4">
             <div className="h-full bg-primary rounded-full transition-all duration-1000 w-[78%]"></div>
           </div>
           <div className="grid grid-cols-2 gap-md mt-auto">
             <div className="text-center p-sm rounded-xl bg-surface-container-low">
               <div className="font-headline-md text-headline-md text-on-surface">{stats ? stats.links : '-'}</div>
               <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Connections</div>
             </div>
             <div className="text-center p-sm rounded-xl bg-surface-container-low">
               <div className="font-headline-md text-headline-md text-on-surface">{stats ? stats.community : '-'}</div>
               <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">Community</div>
             </div>
           </div>
        </div>
      </div>

      {/* Suggested Nodes */}
      {suggestions.length > 0 && (
        <section className="mb-xl">
          <div className="flex items-center gap-sm mb-md">
             <span className="p-xs bg-tertiary-container text-on-tertiary-container rounded-lg material-symbols-outlined">person_add</span>
             <h3 className="font-title-lg text-title-lg">Recommended Nodes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
             {suggestions.map(u => (
               <div key={u.id} className="glass-panel p-md rounded-2xl flex items-center justify-between group hover:-translate-y-1 transition-transform">
                 <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${u.id}`)}>
                   <div className="w-12 h-12 rounded-full bg-secondary-container text-white flex items-center justify-center font-bold text-lg shadow-inner border-2 border-white">{u.displayName?.[0]}</div>
                   <div>
                     <h4 className="font-label-md font-bold text-on-surface group-hover:text-primary transition-colors">{u.displayName}</h4>
                     <p className="font-label-sm text-on-surface-variant">{u.followerCount} connections</p>
                   </div>
                 </div>
                 <button onClick={() => handleFollow(u)} className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-white transition-colors flex items-center justify-center">
                   <span className="material-symbols-outlined text-[18px]">add</span>
                 </button>
               </div>
             ))}
          </div>
        </section>
      )}
    </div>
  );
}
