import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Sun, Moon } from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.put('/users/me', { name });
      setUser(data);
      localStorage.setItem('nova_user', JSON.stringify(data));
      toast.success('Profile updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-md flex flex-col gap-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-nova flex items-center justify-center text-white text-xl font-semibold shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">{user?.email}</p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field mt-1" />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input-field mt-1 opacity-60 cursor-not-allowed"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Appearance</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose how NOVA looks on this device</p>
        <div className="flex gap-2">
          <button
            onClick={() => theme !== 'light' && toggleTheme()}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              theme === 'light'
                ? 'border-nova-500 bg-nova-500/10 text-nova-600'
                : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'
            }`}
          >
            <Sun size={16} /> Light
          </button>
          <button
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'border-nova-500 bg-nova-500/10 text-nova-300'
                : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'
            }`}
          >
            <Moon size={16} /> Dark
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
