import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users, Settings, HelpCircle, Sparkles, X, ListTodo, CalendarDays } from 'lucide-react';

const groups = [
  {
    label: 'Overview',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/my-tasks', label: 'My Tasks', icon: ListTodo },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Workspace',
    links: [{ to: '/projects', label: 'Projects', icon: FolderKanban }],
  },
  {
    label: 'Team',
    links: [{ to: '/team', label: 'Members', icon: Users }],
  },
];

const NavItem = ({ to, label, icon: Icon, onNavigate }) => (
  <NavLink
    to={to}
    onClick={onNavigate}
    className={({ isActive }) =>
      `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-gradient-nova-soft text-nova-700 dark:text-nova-200'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-gradient-nova" />}
        <Icon size={18} />
        {label}
      </>
    )}
  </NavLink>
);

const Sidebar = ({ open, onClose }) => {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-surface-dark border-r border-gray-200/70 dark:border-white/10 flex flex-col z-50 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-nova flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">NOVA</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.links.map((link) => (
                  <NavItem key={link.to} {...link} onNavigate={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 dark:border-white/10 flex flex-col gap-0.5">
          <NavItem to="/profile" label="Settings" icon={Settings} onNavigate={onClose} />
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 dark:text-gray-500 cursor-default">
            <HelpCircle size={18} />
            Help
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
