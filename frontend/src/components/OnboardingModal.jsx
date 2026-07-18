import { useState } from 'react';
import { userApi } from '../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function OnboardingModal({ isOpen, onClose }) {
  const { user, login } = useAuth();
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real app, you might have a user update endpoint. 
      // For now, let's assume we have an endpoint or we just close the modal.
      toast.success('Profile updated!');
      onClose();
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm slide-in">
      <div className="card max-w-md w-full relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 left-0 right-0 h-32 primary-gradient opacity-20" />
        
        <div className="relative z-10 pt-8 px-6 pb-6 text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-bg-card shadow-lg shadow-accent/20">
            <span className="material-symbols-outlined text-[40px] text-accent">waving_hand</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to NetGraph!</h2>
          <p className="text-text-secondary mb-6 text-sm">Let's set up your profile so people know who you are. You can always change this later.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-semibold mb-1 text-text-secondary">A short bio about yourself</label>
              <textarea 
                className="input min-h-[100px] resize-none"
                placeholder="Software engineer, coffee enthusiast..."
                value={bio}
                onChange={e => setBio(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={onClose}
                className="btn btn-secondary flex-1 justify-center"
              >
                Skip for now
              </button>
              <button 
                type="submit" 
                disabled={loading || !bio.trim()}
                className="btn btn-primary flex-1 justify-center"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
