import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      loginWithToken(token).then(() => {
        navigate('/feed', { replace: true });
      });
    } else {
      navigate('/login', { replace: true });
    }
  }, [location, loginWithToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
      <div className="flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-primary text-6xl animate-spin">sync</span>
        <h2 className="text-xl font-bold">Authenticating...</h2>
      </div>
    </div>
  );
}
