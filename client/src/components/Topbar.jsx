import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, LogOut, User, Menu, UserPlus, ClipboardCheck, MessageSquare, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import SearchPalette from './SearchPalette';

const NOTIF_ICONS = {
  task_assigned: ClipboardCheck,
  member_added: UserPlus,
  comment_added: MessageSquare,
};

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const loadNotifications = () => {
    api.get('/notifications').then(({ data }) => setNotifications(data)).catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotifClick = async (n) => {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      api.put(`/notifications/${n._id}/read`).catch(() => {});
    }
    setNotifOpen(false);
    if (n.project?._id) navigate(`/projects/${n.project._id}`);
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await api.put('/notifications/read-all').catch(() => {});
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="h-16 shrink-0 glass sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 border-b border-gray-200/70 dark:border-white/10">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
          <Menu size={22} />
        </button>
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 text-sm text-gray-400 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 w-64 hover:border-nova-400 transition-colors"
        >
          <Search size={16} />
          <span className="flex-1 text-left">Search projects...</span>
          <kbd className="text-[10px] border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5">Ctrl K</kbd>
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <button
          onClick={() => setSearchOpen(true)}
          className="sm:hidden text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-2"
        >
          <Search size={20} />
        </button>

        <button
          onClick={toggleTheme}
          className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((o) => !o);
              if (!notifOpen) loadNotifications();
            }}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors relative"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-surface-dark" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 card p-0 animate-slide-up z-40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-nova-600 dark:text-nova-300 hover:underline"
                  >
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">You're all caught up 🎉</p>
                ) : (
                  notifications.map((n) => {
                    const Icon = NOTIF_ICONS[n.type] || Bell;
                    return (
                      <button
                        key={n._id}
                        onClick={() => handleNotifClick(n)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                          !n.read ? 'bg-nova-500/5' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-nova-soft flex items-center justify-center shrink-0 mt-0.5">
                          <Icon size={14} className="text-nova-600 dark:text-nova-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-700 dark:text-gray-200">{n.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-nova-500 mt-1.5 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative pl-1.5 ml-1 border-l border-gray-200 dark:border-white/10" ref={userRef}>
          <button onClick={() => setUserMenuOpen((o) => !o)} className="flex items-center gap-2 pl-2 group">
            <div className="w-8 h-8 rounded-full bg-gradient-nova flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials}
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-nova-600 dark:group-hover:text-nova-300">
              {user?.name}
            </span>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 card py-1.5 animate-slide-up z-40">
              <button
                onClick={() => {
                  navigate('/profile');
                  setUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <User size={15} /> Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};

export default Topbar;
