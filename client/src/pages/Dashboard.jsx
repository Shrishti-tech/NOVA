import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FolderKanban, ListChecks, CheckCircle2, Users2, CheckCircle, UserPlus, Pencil } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SkeletonStat, SkeletonCard } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const COLORS = ['#7c5cff', '#f59e0b', '#22d3ee'];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasksByProject, setTasksByProject] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: projectsData } = await api.get('/projects');
        setProjects(projectsData);

        const taskLists = await Promise.all(
          projectsData.map((p) => api.get(`/tasks/project/${p._id}`).then((res) => res.data))
        );

        const map = {};
        projectsData.forEach((p, i) => {
          map[p._id] = taskLists[i];
        });
        setTasksByProject(map);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allTasks = useMemo(() => Object.values(tasksByProject).flat(), [tasksByProject]);

  const memberCount = useMemo(() => {
    const ids = new Set();
    projects.forEach((p) => p.members?.forEach((m) => ids.add(m._id)));
    return ids.size;
  }, [projects]);

  const statusData = useMemo(() => {
    const counts = { todo: 0, 'in-progress': 0, done: 0 };
    allTasks.forEach((t) => (counts[t.status] = (counts[t.status] || 0) + 1));
    return [
      { name: 'To Do', value: counts.todo },
      { name: 'In Progress', value: counts['in-progress'] },
      { name: 'Done', value: counts.done },
    ];
  }, [allTasks]);

  const recentActivity = useMemo(() => {
    return [...allTasks]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);
  }, [allTasks]);

  const stats = [
    { label: 'Projects', value: projects.length, icon: FolderKanban },
    { label: 'Total Tasks', value: allTasks.length, icon: ListChecks },
    { label: 'Completed', value: allTasks.filter((t) => t.status === 'done').length, icon: CheckCircle2 },
    { label: 'Team Members', value: memberCount, icon: Users2 },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <SkeletonStat />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {greeting()}, {user?.name?.split(' ')[0]} 👋
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Here's what's happening with your projects.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-nova-soft flex items-center justify-center shrink-0">
              <Icon size={20} className="text-nova-600 dark:text-nova-300" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Task Status Breakdown</h3>
          {allTasks.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No tasks yet"
              description="Create a project and add some tasks to see your breakdown."
              action={
                <button onClick={() => navigate('/projects')} className="btn-primary">
                  Go to Projects
                </button>
              }
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 13 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <EmptyState icon={Pencil} title="No activity yet" description="Task updates will show up here." />
          ) : (
            <div className="flex flex-col gap-4">
              {recentActivity.map((task) => (
                <div key={task._id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-nova-soft flex items-center justify-center shrink-0 mt-0.5">
                    {task.status === 'done' ? (
                      <CheckCircle size={15} className="text-emerald-500" />
                    ) : task.assignedTo ? (
                      <UserPlus size={15} className="text-nova-500" />
                    ) : (
                      <Pencil size={15} className="text-accent-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
                      <span className="font-medium">{task.title}</span>{' '}
                      {task.status === 'done' ? 'marked done' : `moved to ${task.status.replace('-', ' ')}`}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(task.updatedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
