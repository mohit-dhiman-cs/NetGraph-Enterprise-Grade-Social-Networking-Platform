import { useEffect, useState, useRef, useCallback } from 'react';
import { postApi, userApi, aiApi, mediaApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import toast from 'react-hot-toast';

const REACTIONS = ['❤️','😂','😮','😢','😡','👏'];
function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`; return `${Math.floor(s/86400)}d`;
}

// ── Comment Section ───────────────────────────────────────────
function CommentSection({ postId, commentCount }) {
  const { user } = useAuth();
  const [open, setOpen]         = useState(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [text, setText]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await postApi.getComments(postId); setComments(res.data || []); }
    catch { /* silent */ } finally { setLoading(false); }
  };

  const toggle = () => { if (!open) load(); setOpen(o => !o); };

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await postApi.addComment(postId, text.trim());
      setComments(c => [res.data, ...c]); setText('');
      toast.success('Comment posted!');
    } catch { toast.error('Failed to post'); } finally { setSubmitting(false); }
  };

  const deleteComment = async (id) => {
    try { await postApi.deleteComment(postId, id); setComments(c => c.filter(x => x.id !== id)); }
    catch { toast.error('Could not delete'); }
  };

  return (
    <div className="px-lg pb-lg">
      <button className="flex items-center gap-xs group mb-md w-full" onClick={toggle}>
        <span className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors">
          {open ? 'Hide comments' : `View comments (${commentCount})`}
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-md">
          <form onSubmit={submit} className="flex gap-md items-center">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-[12px] flex-shrink-0">
              {user?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 bg-surface-container-low rounded-full px-4 py-2 flex items-center gap-2">
              <input value={text} onChange={e => setText(e.target.value)} placeholder="Write a comment…"
                className="bg-transparent border-none focus:ring-0 flex-1 font-body-md text-body-md text-on-surface p-0" />
              <button type="submit" disabled={!text.trim() || submitting}
                className="text-primary disabled:text-outline-variant transition-colors">
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </form>
          {loading && <div className="h-10 bg-surface-container-high animate-pulse rounded-lg" />}
          {!loading && comments.length === 0 && <p className="text-on-surface-variant text-center font-body-sm text-sm">Be the first to comment!</p>}
          {comments.map(c => (
            <div key={c.id} className="flex gap-md">
              <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-[12px] flex-shrink-0">
                {c.author?.displayName?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 bg-surface-container-low rounded-2xl rounded-tl-sm p-3">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-label-md text-label-md font-bold">{c.author?.displayName}</span>
                  <div className="flex gap-2 items-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{timeAgo(c.createdAt)}</span>
                    {c.author?.id === user?.userId && (
                      <button onClick={() => deleteComment(c.id)} className="text-on-surface-variant hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Emoji Reaction Bar ────────────────────────────────────────
function ReactionBar({ postId }) {
  const [reactions, setReactions] = useState({});
  const [myReaction, setMyReaction] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(`reactions_${postId}`) || '{}');
    setReactions(stored.reactions || {});
    setMyReaction(stored.mine || null);
  }, [postId]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setPickerOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const react = (emoji) => {
    const newReactions = { ...reactions };
    if (myReaction === emoji) {
      newReactions[emoji] = Math.max(0, (newReactions[emoji] || 1) - 1);
      if (newReactions[emoji] === 0) delete newReactions[emoji];
      setMyReaction(null);
      setReactions(newReactions);
      localStorage.setItem(`reactions_${postId}`, JSON.stringify({ reactions: newReactions, mine: null }));
    } else {
      if (myReaction) {
        newReactions[myReaction] = Math.max(0, (newReactions[myReaction] || 1) - 1);
        if (newReactions[myReaction] === 0) delete newReactions[myReaction];
      }
      newReactions[emoji] = (newReactions[emoji] || 0) + 1;
      setMyReaction(emoji);
      setReactions(newReactions);
      localStorage.setItem(`reactions_${postId}`, JSON.stringify({ reactions: newReactions, mine: emoji }));
    }
    setPickerOpen(false);
  };

  const hasAny = Object.keys(reactions).length > 0;

  return (
    <div ref={ref} className="relative mt-2 mb-2 px-lg">
      <div className="flex gap-2 flex-wrap items-center">
        {Object.entries(reactions).map(([emoji, count]) => count > 0 && (
          <button key={emoji} className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 border ${myReaction === emoji ? 'bg-primary-container/20 border-primary/30' : 'bg-surface-container-low border-transparent'}`} onClick={() => react(emoji)}>
            {emoji} <span className="font-bold text-on-surface-variant">{count}</span>
          </button>
        ))}
      </div>
      {pickerOpen && (
        <div className="absolute bottom-full left-0 mb-2 glass-panel p-2 rounded-xl shadow-xl flex gap-1 z-10">
          {REACTIONS.map(e => (
            <button key={e} className="hover:scale-125 transition-transform p-1 text-xl" onClick={() => react(e)}>{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sentiment Badge ───────────────────────────────────────────
function SentimentBadge({ content }) {
  const [sentiment, setSentiment] = useState(null);
  useEffect(() => {
    aiApi.sentiment(content).then(r => setSentiment(r.data?.label)).catch(() => {});
  }, [content]);
  if (!sentiment || sentiment === 'NEUTRAL') return null;
  const cfg = sentiment === 'POSITIVE'
    ? { color: 'text-secondary', bg: 'bg-secondary/10', icon: 'mood' }
    : { color: 'text-error', bg: 'bg-error/10',  icon: 'mood_bad' };
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-label-sm text-xs`}>
      <span className="material-symbols-outlined text-[14px]">{cfg.icon}</span>
      {sentiment === 'POSITIVE' ? 'Positive' : 'Negative'}
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────
function PostCard({ post, onLike }) {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const liked     = post.likedByUserIds?.includes(user?.userId);
  const [bookmarked, setBookmarked] = useState(() =>
    JSON.parse(localStorage.getItem('ng_bookmarks') || '[]').includes(post.id)
  );

  const toggleBookmark = () => {
    const bms = JSON.parse(localStorage.getItem('ng_bookmarks') || '[]');
    const next = bookmarked ? bms.filter(id => id !== post.id) : [...bms, post.id];
    localStorage.setItem('ng_bookmarks', JSON.stringify(next));
    setBookmarked(!bookmarked);
    toast(bookmarked ? 'Removed from bookmarks' : '🔖 Bookmarked!', { icon: bookmarked ? '🗑️' : '✅' });
  };

  return (
    <article className="glass-panel rounded-2xl overflow-hidden mb-lg">
      <div className="p-lg flex justify-between items-start">
        <div className="flex gap-md items-center cursor-pointer" onClick={() => navigate(`/profile/${post.author?.id}`)}>
          <div className="w-12 h-12 rounded-full border border-primary/20 object-cover bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg">
            {post.author?.displayName?.[0] || '?'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-title-lg text-title-lg text-on-surface leading-tight hover:text-primary transition-colors">{post.author?.displayName}</h3>
              <SentimentBadge content={post.content} />
              {post.trendScore > 1 && <span className="bg-tertiary-container/20 text-tertiary px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase">Trending</span>}
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              @{post.author?.username} • {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>
        <button className="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-full hover:bg-surface-container-low">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      <div className="px-lg pb-md">
        <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
          {post.content}
        </p>
      </div>
      
      {post.imageUrl && (
        <div className="mx-lg mb-lg rounded-xl overflow-hidden group relative">
          <img src={post.imageUrl} alt="Post media" className="w-full object-cover max-h-[500px] transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      )}

      <ReactionBar postId={post.id} />

      <div className="px-lg pb-lg pt-2">
        <div className="flex items-center justify-between border-t border-outline-variant/10 pt-md">
          <div className="flex gap-md">
            <button className={`flex items-center gap-xs group px-2 py-1 -ml-2 rounded-lg transition-colors ${liked ? 'text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`} onClick={() => onLike(post.id, liked)}>
              <span className={`material-symbols-outlined ${liked ? 'fill-icon text-primary' : 'group-hover:text-primary transition-colors'}`}>thumb_up</span>
              <span className="font-label-md text-label-md">{post.likeCount}</span>
            </button>
            <button className="flex items-center gap-xs group px-2 py-1 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant hover:text-secondary">
              <span className="material-symbols-outlined group-hover:text-secondary transition-colors">chat_bubble</span>
              <span className="font-label-md text-label-md">{post.commentCount}</span>
            </button>
            <button className="flex items-center gap-xs group px-2 py-1 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant hover:text-tertiary" onClick={() => { navigator.clipboard.writeText(window.location.origin + `/profile/${post.author?.id}`); toast.success('Link copied!'); }}>
              <span className="material-symbols-outlined group-hover:text-tertiary transition-colors">share</span>
              <span className="font-label-md text-label-md">{post.shareCount}</span>
            </button>
          </div>
          <button className={`flex items-center gap-xs group p-2 rounded-full transition-colors ${bookmarked ? 'text-secondary bg-secondary/10' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-secondary'}`} onClick={toggleBookmark}>
            <span className={`material-symbols-outlined ${bookmarked ? 'fill-icon' : ''}`}>bookmark</span>
          </button>
        </div>
      </div>
      
      <CommentSection postId={post.id} commentCount={post.commentCount} />
    </article>
  );
}

// ── @Mention Autocomplete in Compose ─────────────────────────
function MentionInput({ value, onChange, placeholder, style }) {
  const [mentions, setMentions]   = useState([]);
  const [query, setQuery]         = useState('');
  const inputRef = useRef(null);
  const debRef   = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    const pos = e.target.selectionStart;
    const before = val.slice(0, pos);
    const match = before.match(/@(\w*)$/);
    if (match) {
      setQuery(match[1]);
      clearTimeout(debRef.current);
      debRef.current = setTimeout(async () => {
        if (match[1].length >= 1) {
          try { const r = await userApi.search(match[1]); setMentions(r.data?.slice(0, 5) || []); }
          catch { setMentions([]); }
        } else { setMentions([]); }
      }, 300);
    } else { setMentions([]); }
  };

  const insertMention = (username) => {
    const pos = inputRef.current.selectionStart;
    const before = value.slice(0, pos);
    const after  = value.slice(pos);
    const newVal = before.replace(/@\w*$/, `@${username} `) + after;
    onChange(newVal);
    setMentions([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="relative flex-1">
      <textarea
        ref={inputRef}
        className="w-full bg-transparent border-none focus:ring-0 text-body-lg font-body-lg resize-none placeholder:text-on-surface-variant/50 p-0"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        style={style}
      />
      {mentions.length > 0 && (
        <div className="absolute top-full left-0 right-0 glass-panel mt-2 rounded-xl shadow-xl overflow-hidden z-20">
          {mentions.map(u => (
            <div key={u.id} className="p-3 hover:bg-surface-container-low cursor-pointer flex gap-3 items-center border-b border-outline-variant/10" onMouseDown={() => insertMention(u.username)}>
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">{u.displayName?.[0]?.toUpperCase()}</div>
              <div>
                <div className="font-label-md text-label-md font-bold">{u.displayName}</div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">@{u.username}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Compose Box ───────────────────────────────────────────────
function ComposePost({ onPost }) {
  const { user }  = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [score, setScore]     = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const debRef = useRef(null);

  useEffect(() => {
    clearTimeout(debRef.current);
    if (!content.trim()) { setScore(null); return; }
    debRef.current = setTimeout(async () => {
      try { const r = await aiApi.scoreContent(content); setScore(r.data?.score); } catch { /* */ }
    }, 600);
  }, [content]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    setLoading(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await mediaApi.upload(formData);
        imageUrl = uploadRes.data.url;
      }
      
      const res = await postApi.create({ content, imageUrl });
      onPost(res.data); 
      setContent(''); 
      setScore(null);
      setImageFile(null);
      setImagePreview(null);
      toast.success('Posted!');
    } catch { toast.error('Failed to post'); } finally { setLoading(false); }
  };

  const scoreColor = score == null ? 'text-on-surface-variant' : score >= 70 ? 'text-secondary' : score >= 40 ? 'text-tertiary' : 'text-error';

  return (
    <div className="glass-panel p-lg rounded-2xl mb-lg relative z-10">
      <form onSubmit={submit}>
        <div className="flex gap-md">
          <div className="w-10 h-10 rounded-full border border-primary/20 bg-primary text-on-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
            {user?.displayName?.[0] || 'U'}
          </div>
          <MentionInput value={content} onChange={setContent}
            placeholder="Share an insight or update..."
            style={{ minHeight: 60, outline: 'none' }} />
        </div>
        
        {imagePreview && (
          <div className="relative mt-3 ml-14 inline-block">
            <img src={imagePreview} alt="preview" className="max-h-[200px] rounded-xl border border-outline-variant/20 object-cover" />
            <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute -top-2 -right-2 bg-error text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        )}
        
        <div className="mt-md pt-md border-t border-outline-variant/10 flex justify-between items-center">
          <div className="flex gap-sm">
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
            <button type="button" className="flex items-center gap-xs px-md py-sm hover:bg-surface-container-low transition-colors rounded-full text-primary" onClick={() => fileInputRef.current?.click()}>
              <span className="material-symbols-outlined text-[20px]">image</span>
              <span className="font-label-md text-label-md hidden sm:inline">Media</span>
            </button>
            <button type="button" className="flex items-center gap-xs px-md py-sm hover:bg-surface-container-low transition-colors rounded-full text-tertiary">
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              <span className="font-label-md text-label-md hidden sm:inline">Event</span>
            </button>
            {score != null && (
              <div className={`flex items-center gap-1 px-3 py-1 bg-surface-container-low rounded-full ${scoreColor}`}>
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                <span className="font-label-sm text-xs font-bold">{score}/100</span>
              </div>
            )}
          </div>
          <button type="submit" disabled={loading || (!content.trim() && !imageFile)}
            className="px-lg py-sm bg-gradient-to-r from-primary to-secondary text-white rounded-full font-bold shadow-md shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2">
            {loading ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> : null}
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Panels ────────────────────────────────────────────────────
function SuggestionsPanel() {
  const [sugg, setSugg] = useState([]);
  const [fState, setFState] = useState({});
  const navigate = useNavigate();
  
  useEffect(() => { userApi.getSuggestions(3).then(r => setSugg(r.data || [])).catch(() => {}); }, []);
  
  const toggle = async (u) => {
    const isF = fState[u.id] ?? u.followedByCurrentUser;
    try {
      isF ? await userApi.unfollow(u.id) : await userApi.follow(u.id);
      setFState(f => ({ ...f, [u.id]: !isF }));
      if (!isF) toast.success(`Following ${u.displayName}!`);
    } catch { toast.error('Action failed'); }
  };
  
  if (!sugg.length) return null;
  
  return (
    <div className="glass-panel p-lg rounded-2xl mb-lg">
      <h3 className="font-title-lg text-title-lg text-on-surface mb-lg">Recommended for You</h3>
      <div className="space-y-md">
        {sugg.map(u => {
          const isF = fState[u.id] ?? u.followedByCurrentUser;
          return (
            <div key={u.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-md cursor-pointer" onClick={() => navigate(`/profile/${u.id}`)}>
                <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold">
                  {u.displayName?.[0]}
                </div>
                <div className="max-w-[120px]">
                  <h4 className="font-label-md text-label-md text-on-surface truncate hover:text-primary transition-colors">{u.displayName}</h4>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{u.followerCount} connections</p>
                </div>
              </div>
              <button 
                className={`p-2 rounded-full transition-colors ${isF ? 'text-on-surface-variant bg-surface-container-high' : 'text-primary hover:bg-primary-container/10'}`} 
                onClick={() => toggle(u)}
                title={isF ? 'Unfollow' : 'Follow'}
              >
                <span className="material-symbols-outlined">{isF ? 'person_remove' : 'person_add'}</span>
              </button>
            </div>
          );
        })}
      </div>
      <button className="w-full mt-lg pt-md border-t border-outline-variant/10 font-label-md text-label-md text-primary hover:text-primary-container transition-colors text-center">
        Show More
      </button>
    </div>
  );
}

function TrendingPanel() {
  const [trending, setTrending] = useState([]);
  
  useEffect(() => { postApi.getTrending().then(r => setTrending(r.data || [])).catch(() => {}); }, []);
  
  if (!trending.length) return null;
  
  return (
    <div className="glass-panel p-lg rounded-2xl">
      <h3 className="font-title-lg text-title-lg text-on-surface mb-lg">Trending Network</h3>
      <div className="space-y-lg">
        {trending.slice(0, 4).map((p, i) => (
          <div key={p.id} className="cursor-pointer group">
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">Trending in Network</p>
            <h4 className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors line-clamp-2">{p.content}</h4>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">{p.likeCount} likes • {p.commentCount} comments</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Feed ─────────────────────────────────────────────────
export default function FeedPage() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [page, setPage]       = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const r    = await postApi.getFeed(page, 20);
      const data = r.data;
      setPosts(prev => page === 0 ? (data.content || []) : [...prev, ...(data.content || [])]);
      setHasMore(!data.last);
      if (!data.last) setPage(p => p + 1);
    } catch (err) { 
      setError(err.response?.data?.message || 'Could not load feed. Please try again.');
      toast.error('Could not load feed'); 
    }
    finally { setLoading(false); setInitialLoading(false); }
  }, [page, loading]);

  useEffect(() => { loadMore(); }, []); // eslint-disable-line

  const sentinelRef = useInfiniteScroll(loadMore, hasMore, loading);

  const handleLike = async (postId, isLiked) => {
    try {
      const res = isLiked ? await postApi.unlike(postId) : await postApi.like(postId);
      setPosts(ps => ps.map(p => p.id === postId ? res.data : p));
    } catch { toast.error('Action failed'); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-lg">
      <div className="col-span-1 lg:col-span-7 flex flex-col">
        {/* Stories Row (Static UI placeholder) */}
        <div className="flex gap-md overflow-x-auto no-scrollbar pb-lg mb-4">
          <div className="flex-shrink-0 w-24 flex flex-col items-center gap-sm">
            <div className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-outline-variant flex items-center justify-center bg-white group cursor-pointer hover:border-primary transition-colors">
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">add</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Your Story</span>
          </div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-24 flex flex-col items-center gap-sm cursor-pointer group">
              <div className="w-20 h-20 rounded-2xl p-[3px] bg-gradient-to-tr from-primary to-tertiary">
                <div className="w-full h-full rounded-[13px] border-2 border-white overflow-hidden shadow-inner bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-xl">
                  {['SJ', 'AC', 'MW', 'RK'][i-1]}
                </div>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface truncate w-full text-center group-hover:text-primary transition-colors">
                {['Sarah', 'Alex', 'Maya', 'Raj'][i-1]}
              </span>
            </div>
          ))}
        </div>

        <ComposePost onPost={p => setPosts(ps => [p, ...ps])} />
        
        {initialLoading
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass-panel rounded-2xl h-48 mb-lg animate-pulse bg-surface-container-high/50" />)
          : error
            ? <div className="glass-panel p-12 text-center rounded-2xl border border-error/30 bg-error/5"><p className="font-body-lg text-error">{error}</p><button className="mt-4 px-4 py-2 bg-error text-white rounded-lg" onClick={() => { setInitialLoading(true); loadMore(); }}>Retry</button></div>
            : posts.length === 0
              ? <div className="glass-panel p-12 text-center rounded-2xl"><p className="font-body-lg text-on-surface-variant">No posts yet. Follow people or post something!</p></div>
              : posts.map(p => <PostCard key={p.id} post={p} onLike={handleLike} />)
        }
        
        <div ref={sentinelRef} className="h-4" />
        {loading && page > 0 && (
          <div className="text-center py-4 text-primary">
            <span className="material-symbols-outlined animate-spin text-[24px]">refresh</span>
          </div>
        )}
      </div>

      <aside className="hidden lg:block lg:col-span-3">
        <div className="sticky top-24">
          <SuggestionsPanel />
          <TrendingPanel />
          
          <footer className="mt-lg px-md">
            <div className="flex flex-wrap gap-md justify-center opacity-80 hover:opacity-100 transition-opacity">
              <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy</a>
              <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms</a>
              <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Help</a>
            </div>
            <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-sm">© 2024 NetGraph</p>
          </footer>
        </div>
      </aside>
    </div>
  );
}
