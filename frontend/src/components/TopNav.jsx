import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

export default function TopNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { unreadCount } = useNotifications();
  
  return (
    <header className="bg-surface/70 backdrop-blur-xl border-b border-outline-variant/20 shadow-md docked full-width top-0 sticky z-50 transition-colors">
      <div className="flex justify-between items-center px-margin-desktop py-sm w-full max-w-max-width mx-auto">
        <div className="flex items-center gap-xl">
          <Link to="/feed" className="font-headline-md text-headline-md font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-sm hover:scale-105 transition-transform">
            NetGraph
          </Link>
          <div className="hidden md:flex relative group">
            <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input 
              className="bg-surface-container border border-outline-variant/20 rounded-full pl-10 pr-4 py-2 w-64 focus:ring-2 focus:ring-primary/50 focus:bg-surface-container-high transition-all font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 shadow-inner" 
              placeholder="Search the network..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-md">
          <Link to="/messages" className="p-2 rounded-full hover:bg-surface-container-high/50 transition-all duration-300 scale-95 active:scale-90 text-on-surface-variant">
            <span className="material-symbols-outlined">mail</span>
          </Link>
          <Link to="/notifications" className="p-2 rounded-full hover:bg-surface-container-high/50 transition-all duration-300 scale-95 active:scale-90 text-on-surface-variant relative">
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
            )}
          </Link>
          <button className="p-2 rounded-full hover:bg-surface-container-high/50 transition-all duration-300 scale-95 active:scale-90 text-on-surface-variant">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="h-8 w-[1px] bg-outline-variant/30 mx-2"></div>
          <Link to={`/profile/${user?.userId}`}>
            <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold">
              {user?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
