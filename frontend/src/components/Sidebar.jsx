import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../api/client';
import { useEffect, useState } from 'react';

const NAV = [
  { icon: 'home',          label: 'Home',          path: '/feed' },
  { icon: 'explore',       label: 'Explore',       path: '/discover' },
  { icon: 'group',         label: 'My Network',    path: '/graph' },
  { icon: 'chat',          label: 'Messages',      path: '/messages' },
  { icon: 'notifications', label: 'Notifications', path: '/notifications', badge: true },
  { icon: 'groups',        label: 'Communities',   path: '/communities' },
  { icon: 'person',        label: 'Profile',       path: '/profile' },
  { icon: 'neurology',     label: 'AI Insights',   path: '/ai' },
  { icon: 'terminal',      label: 'Dev Portal',    path: '/dev' },
  { icon: 'admin_panel_settings', label: 'Admin',  path: '/admin', adminOnly: true }
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () => notificationApi.getUnreadCount().then(r => setUnread(r.data || 0)).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const isActive = (path) => {
    if (path === '/profile') return location.pathname.startsWith('/profile');
    if (path === '/feed') return location.pathname === '/feed';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden md:block md:col-span-3 lg:col-span-2">
      <nav className="flex flex-col gap-sm sticky top-24">
        {NAV.map(({ icon, label, path, adminOnly, badge }) => {
          if (adminOnly && user?.role !== 'ADMIN') return null;
          const active = isActive(path);
          const linkPath = path === '/profile' ? `/profile/${user?.userId}` : path;
          
          return (
            <Link 
              key={path} 
              to={linkPath}
              className={`flex items-center gap-md p-md rounded-lg transition-all duration-200 ${
                active 
                  ? 'bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary text-primary font-bold translate-x-1 shadow-sm' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span className={`material-symbols-outlined ${active ? 'fill-icon text-primary' : ''}`}>{icon}</span>
              <span className="font-label-md text-label-md">{label}</span>
              {badge && unread > 0 && (
                <span className="ml-auto bg-error text-white rounded-full px-2 py-0.5 text-[10px] font-bold shadow-md shadow-error/30">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          );
        })}
        
        <button className="mt-lg w-full py-md bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all">
          Create Post
        </button>

        <div className="mt-xxl pt-md border-t border-outline-variant/20">
          <div className="glass-panel p-md rounded-xl">
            <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-xs">Active Projects</p>
            <div className="flex flex-col gap-sm mt-sm">
              <div className="flex items-center gap-sm">
                <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                <span className="font-label-md text-label-md text-on-surface">Cloud Architecture</span>
              </div>
              <div className="flex items-center gap-sm">
                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                <span className="font-label-md text-label-md text-on-surface">Neural Interfaces</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
