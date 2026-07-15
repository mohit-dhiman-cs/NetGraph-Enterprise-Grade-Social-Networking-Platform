import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MobileNav() {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/profile') return location.pathname.startsWith('/profile');
    if (path === '/feed') return location.pathname === '/feed';
    return location.pathname.startsWith(path);
  };

  const navItem = (icon, label, path) => {
    const active = isActive(path);
    const linkPath = path === '/profile' ? `/profile/${user?.userId}` : path;
    
    return (
      <Link to={linkPath} className={`flex flex-col items-center gap-xs ${active ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
        <span className={`material-symbols-outlined ${active ? 'fill-icon' : ''}`}>{icon}</span>
        <span className="font-label-sm text-label-sm">{label}</span>
      </Link>
    );
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-2xl border-t border-white/20 z-50 flex justify-around items-center py-sm shadow-lg">
      {navItem('home', 'Home', '/feed')}
      {navItem('explore', 'Explore', '/discover')}
      
      <div className="relative -top-6">
        <button className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center scale-110 active:scale-95 transition-transform">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
      
      {navItem('group', 'Network', '/graph')}
      {navItem('person', 'Profile', '/profile')}
    </nav>
  );
}
