import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userApi, mediaApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function sanitizeUrl(url) {
  if (!url) return '';
  const str = String(url).trim();
  if (str.startsWith('data:image/')) return str;
  try {
    const parsed = new URL(str, window.location.origin);
    if (['http:', 'https:', 'blob:'].includes(parsed.protocol)) {
      return parsed.href;
    }
  } catch {
    return '';
  }
  return '';
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [following, setFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '', location: '', website: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  
  const avatarInputRef = useRef(null);

  const isMe = !id || id === me?.id;
  const targetId = id || me?.id;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profileRes = await userApi.getUser(targetId);
      setProfile(profileRes.data);
      setFollowing(profileRes.data.followedByCurrentUser || false);
      setEditForm({
        displayName: profileRes.data.displayName || '',
        bio: profileRes.data.bio || '',
        location: profileRes.data.location || '',
        website: profileRes.data.website || ''
      });
      setAvatarPreview(profileRes.data.avatarUrl || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load profile');
      toast.error('Could not load profile');
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => { load(); }, [load]);

  const toggleFollow = async () => {
    setActionLoading(true);
    try {
      if (following) {
        await userApi.unfollow(targetId);
        setFollowing(false);
        setProfile(p => ({ ...p, followerCount: Math.max(0, (p.followerCount || 1) - 1) }));
        toast('Unfollowed');
      } else {
        await userApi.follow(targetId);
        setFollowing(true);
        setProfile(p => ({ ...p, followerCount: (p.followerCount || 0) + 1 }));
        toast.success('Following!');
      }
    } catch { toast.error('Action failed'); }
    finally { setActionLoading(false); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      let finalAvatarUrl = profile.avatarUrl;
      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        const res = await mediaApi.upload(fd);
        finalAvatarUrl = res.data.url;
      }
      
      const updateData = { ...editForm, avatarUrl: finalAvatarUrl };
      const res = await userApi.updateProfile(updateData);
      setProfile(res.data);
      setIsEditing(false);
      setAvatarFile(null);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  if (loading) return (
    <div className="flex flex-col gap-lg px-4 lg:px-0">
      <div className="h-64 md:h-80 w-full rounded-[32px] skeleton" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg mt-24">
        <div className="lg:col-span-4 space-y-lg">
          <div className="h-64 rounded-2xl skeleton" />
          <div className="h-48 rounded-2xl skeleton" />
        </div>
        <div className="lg:col-span-8 space-y-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl skeleton" />)}
          </div>
          <div className="h-64 rounded-2xl skeleton" />
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="glass-panel p-12 text-center rounded-2xl border border-error/30 bg-error/5">
      <h2 className="font-title-lg text-title-lg text-error mb-2">Error Loading Profile</h2>
      <p className="font-body-lg text-error">{error}</p>
      <button className="mt-4 px-4 py-2 bg-error text-white rounded-lg" onClick={load}>Retry</button>
    </div>
  );

  if (!profile) return <div className="p-10 text-on-surface-variant text-center">User not found.</div>;

  return (
    <div className="pb-xxl">
      {/* Hero Section: Cover & Avatar */}
      <section className="relative mb-xxl">
        <div className="h-64 md:h-80 w-full rounded-[32px] overflow-hidden shadow-2xl relative bg-gradient-to-r from-primary to-secondary">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        </div>

        {/* Avatar & Identity Info */}
        <div className="absolute -bottom-16 left-6 md:left-12 flex flex-col md:flex-row items-end gap-lg">
          <div className="relative group perspective-1000">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[32px] overflow-hidden border-4 border-white glass-panel p-1 transition-transform duration-500 group-hover:rotate-y-12 group-hover:-rotate-x-12 bg-white/50">
              {sanitizeUrl(profile.avatarUrl) ? (
                <img alt="Avatar" className="w-full h-full object-cover rounded-[28px]" src={sanitizeUrl(profile.avatarUrl)} />
              ) : (
                <div className="w-full h-full rounded-[28px] bg-primary text-white flex items-center justify-center font-bold text-5xl">
                  {profile.displayName?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-[16px] fill-icon">verified</span>
            </div>
          </div>
          
          <div className="mb-2 pb-1">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">{profile.displayName}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant flex items-center gap-xs">
              <span className="material-symbols-outlined text-[18px]">person</span> @{profile.username}
              {profile.location && (
                <>
                  <span className="mx-2">•</span>
                  <span className="material-symbols-outlined text-[18px]">location_on</span> {profile.location}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Profile Actions */}
        <div className="absolute -bottom-12 right-6 md:right-12 flex gap-sm">
          {!isMe ? (
            <>
              <button 
                onClick={toggleFollow} 
                disabled={actionLoading}
                className={`px-lg py-md rounded-xl font-label-md text-label-md flex items-center gap-sm transition-all shadow-lg hover:-translate-y-1 ${following ? 'bg-surface-container-high text-on-surface' : 'bg-primary text-white shadow-primary/20'}`}
              >
                <span className="material-symbols-outlined text-[20px]">{following ? 'person_remove' : 'person_add'}</span>
                {following ? 'Unfollow' : 'Connect'}
              </button>
              <button className="glass-panel px-lg py-md rounded-xl font-label-md text-label-md flex items-center gap-sm transition-all hover:bg-white/90 text-primary">
                <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                Message
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="glass-panel px-lg py-md rounded-xl font-label-md text-label-md flex items-center gap-sm transition-all hover:bg-white/90 text-primary shadow-lg hover:-translate-y-1">
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Edit Profile
            </button>
          )}
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start mt-24">
        
        {/* Left Column: Bio & Network Graph */}
        <aside className="lg:col-span-4 space-y-lg">
          {/* Bio Card */}
          <div className="glass-panel p-lg rounded-2xl">
            <h3 className="font-title-lg text-title-lg mb-md flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">info</span>
              Bio
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed min-h-[60px]">
              {profile.bio || 'No bio provided yet.'}
            </p>
            {profile.website && (
              <div className="mt-md flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">link</span>
                <a href={profile.website} target="_blank" rel="noreferrer" className="font-body-md text-body-md text-primary hover:underline">{profile.website}</a>
              </div>
            )}
            <div className="mt-lg pt-lg border-t border-outline-variant/30 grid grid-cols-2 gap-md">
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Following</span>
                <p className="font-title-lg text-title-lg text-primary">{profile.followingCount}</p>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Joined</span>
                <p className="font-title-lg text-title-lg text-tertiary">
                  {new Date(profile.createdAt || Date.now()).toLocaleDateString(undefined, {month:'short', year:'numeric'})}
                </p>
              </div>
            </div>
          </div>

          {/* Network Graph Visualizer */}
          <div className="glass-panel p-lg rounded-2xl overflow-hidden relative group">
            <h3 className="font-title-lg text-title-lg mb-md flex items-center justify-between">
              <span className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">hub</span>
                Social Core
              </span>
            </h3>
            <div className="h-48 relative flex items-center justify-center bg-surface-container-lowest/50 rounded-xl">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                <line className="text-primary/20 animate-pulse" stroke="currentColor" strokeWidth="1.5" x1="100" x2="60" y1="100" y2="60"></line>
                <line className="text-primary/20 animate-pulse" stroke="currentColor" strokeWidth="1.5" x1="100" x2="140" y1="100" y2="70"></line>
                <line className="text-primary/20 animate-pulse" stroke="currentColor" strokeWidth="1.5" x1="100" x2="130" y1="100" y2="140"></line>
                <line className="text-primary/20 animate-pulse" stroke="currentColor" strokeWidth="1.5" x1="100" x2="70" y1="100" y2="150"></line>
                <circle className="fill-primary animate-pulse shadow-lg" cx="100" cy="100" r="12"></circle>
                <circle className="fill-secondary/60" cx="60" cy="60" r="6"></circle>
                <circle className="fill-tertiary/60" cx="140" cy="70" r="8"></circle>
                <circle className="fill-primary/60" cx="130" cy="140" r="5"></circle>
                <circle className="fill-secondary/60" cx="70" cy="150" r="7"></circle>
              </svg>
            </div>
            <button onClick={() => navigate('/graph')} className="w-full mt-md py-sm rounded-xl border border-primary/20 text-primary font-label-md text-label-md hover:bg-primary/5 transition-colors">
              Expand Visualization
            </button>
          </div>
        </aside>

        {/* Right Column: Stats Bento & Feed */}
        <div className="lg:col-span-8 space-y-lg">
          {/* Floating Stats Bento */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
            <div className="glass-panel p-md rounded-xl text-center group hover:-translate-y-1 transition-transform">
              <span className="material-symbols-outlined text-primary mb-xs">group</span>
              <p className="font-title-lg text-title-lg text-on-surface">{profile.followerCount}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Followers</p>
            </div>
            <div className="glass-panel p-md rounded-xl text-center group hover:-translate-y-1 transition-transform">
              <span className="material-symbols-outlined text-secondary mb-xs">article</span>
              <p className="font-title-lg text-title-lg text-on-surface">{profile.postCount}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Posts</p>
            </div>
            <div className="glass-panel p-md rounded-xl text-center group hover:-translate-y-1 transition-transform">
              <span className="material-symbols-outlined text-tertiary mb-xs">star</span>
              <p className="font-title-lg text-title-lg text-on-surface">4.8</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Rating</p>
            </div>
            <div className="glass-panel p-md rounded-xl text-center group hover:-translate-y-1 transition-transform">
              <span className="material-symbols-outlined text-primary-container mb-xs">visibility</span>
              <p className="font-title-lg text-title-lg text-on-surface">1.2k</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Views</p>
            </div>
          </div>

          {/* Feed Navigation */}
          <div className="flex gap-lg border-b border-outline-variant/20 pb-xs">
            <button className="text-primary font-bold font-label-md text-label-md relative pb-sm">
              Activity
              <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-full"></span>
            </button>
            <button className="text-on-surface-variant hover:text-on-surface font-label-md text-label-md pb-sm transition-colors">Insights</button>
            <button className="text-on-surface-variant hover:text-on-surface font-label-md text-label-md pb-sm transition-colors">Assets</button>
          </div>

          {/* Activity Feed Cards (Placeholder for now) */}
          <div className="space-y-lg">
            {profile.postCount === 0 ? (
               <div className="card p-12 text-center flex flex-col items-center justify-center py-16">
                 <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
                   <span className="material-symbols-outlined text-[40px] text-secondary">inventory_2</span>
                 </div>
                 <h3 className="text-xl font-bold mb-2">No posts yet</h3>
                 <p className="text-text-secondary max-w-sm">This user hasn't posted anything yet. Check back later!</p>
               </div>
            ) : (
               <div className="space-y-lg">
                 {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="card p-lg border border-transparent">
                      <div className="flex items-center gap-md mb-md">
                        <div className="w-12 h-12 rounded-full skeleton flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 skeleton rounded" />
                          <div className="h-3 w-24 skeleton rounded" />
                        </div>
                      </div>
                      <div className="space-y-2 mb-md">
                        <div className="h-4 w-full skeleton rounded" />
                        <div className="h-4 w-[90%] skeleton rounded" />
                        <div className="h-4 w-[60%] skeleton rounded" />
                      </div>
                      <div className="h-[200px] w-full skeleton rounded-xl" />
                    </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass-panel rounded-[32px] w-full max-w-lg p-8 shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => setIsEditing(false)} className="absolute top-6 right-6 text-on-surface-variant hover:text-error transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="font-headline-md text-headline-md mb-6">Edit Profile</h2>
            
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-surface-container-highest overflow-hidden border-4 border-white shadow-md relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  {sanitizeUrl(avatarPreview) ? (
                    <img src={sanitizeUrl(avatarPreview)} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[40px] text-on-surface-variant absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">person</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white">photo_camera</span>
                  </div>
                </div>
                <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={handleAvatarChange} />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-4">Display Name</label>
                  <input className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20" value={editForm.displayName} onChange={e => setEditForm({ ...editForm, displayName: e.target.value })} required />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-4">Bio</label>
                  <textarea className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 resize-y min-h-[100px]" value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-4">Location</label>
                    <input className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                  </div>
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 ml-4">Website</label>
                    <input className="w-full bg-surface-container-low border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20" value={editForm.website} onChange={e => setEditForm({ ...editForm, website: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <button type="button" className="flex-1 py-4 rounded-xl font-label-md text-label-md text-on-surface-variant bg-surface-container-high hover:bg-surface-variant transition-colors" onClick={() => setIsEditing(false)} disabled={savingProfile}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-4 rounded-xl font-label-md text-label-md text-white bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
