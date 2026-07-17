import React from 'react';

export default function LoginPage() {
  const API_URL = import.meta.env.VITE_API_BASE ? import.meta.env.VITE_API_BASE.replace('/api', '') : 'http://localhost:8080';

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/oauth2/authorization/google`;
  };

  return (
    <div className="min-h-screen flex bg-background items-center justify-center relative overflow-hidden">
      {/* Background visual flair */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none"></div>

      <div className="glass-panel p-xl rounded-3xl max-w-md w-full mx-4 shadow-2xl relative z-10 border border-outline-variant/30 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-lg shadow-lg shadow-primary/30">
          <span className="material-symbols-outlined text-white text-5xl">hub</span>
        </div>
        
        <h1 className="text-display-sm font-extrabold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">NetGraph</h1>
        <p className="text-on-surface-variant font-body-lg mb-xl">The intelligent social network.</p>

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-md py-4 px-6 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-on-surface font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-outline-variant/50 shadow-md group"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" />
          Continue with Google
        </button>

        <p className="mt-xl text-on-surface-variant/60 font-body-sm max-w-xs mx-auto">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
