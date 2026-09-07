import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo } from 'lucide-react';
import api from '../services/api';
import TaskDetailsModal from '../components/TaskDetailsModal';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { getMyRole, isAdminRole } from '../utils/roles';

const priorityStyles = {
  low: '🟢',
  medium: '🟡',
  high: '🔴',
};

const filters = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

const startOfToday = () => new Date(new Date().toDateString());

const groupTasks = (tasks) => {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const groups = { overdue: [], today: [], upcoming: [], noDate: [] };
  tasks.forEach((task) => {
    if (!task.dueDate) {
      groups.noDate.push(task);
      return;
    }
    const due = new Date(task.dueDate);
    if (due < today && task.status !== 'done') groups.overdue.push(task);
    else if (due >= today && due < tomorrow) groups.today.push(task);
    else groups.upcoming.push(task);
  });
  return groups;
};

const TaskRow = ({ task, onOpen }) => (
  <button
    onClick={() => onOpen(task)}
    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
  >
    <span className="text-base shrink-0">{priorityStyles[task.priority]}</span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{task.title}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{task.project?.name}</p>
    </div>
    {task.dueDate && (
      <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </span>
    )}
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
        task.status === 'done'
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : task.status === 'in-progress'
          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          : 'bg-gray-500/10 text-gray-500 dark:text-gray-400'
      }`}
    >
      {task.status.replace('-', ' ')}
    </span>
  </button>
);

const Section = ({ title, tasks, onOpen }) =>
  tasks.length > 0 && (
    <div className="card divide-y divide-gray-100 dark:divide-white/10 mb-4 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50/70 dark:bg-white/5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title} <span className="text-gray-400 dark:text-gray-500 font-normal">({tasks.length})</span>
        </p>
      </div>
      {tasks.map((task) => (
        <TaskRow key={task._id} task={task} onOpen={onOpen} />
      ))}
    </div>
  );

const MyTasks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/tasks/mine');
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter]
  );

  const groups = useMemo(() => groupTasks(filtered), [filtered]);

  const handleUpdated = (updated) => {
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? { ...updated, project: t.project } : t)));
    setSelectedTask((prev) => (prev ? { ...updated, project: prev.project } : prev));
  };

  const handleDeleted = (taskId) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    setSelectedTask(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 max-w-2xl">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">My Tasks</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Everything assigned to you, across every project</p>

      <div className="flex gap-1.5 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-sm px-3.5 py-1.5 rounded-full font-medium transition-colors ${
              filter === f.key
                ? 'bg-gradient-nova text-white'
                : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ListTodo}
            title="Nothing assigned to you"
            description="Tasks assigned to you across all projects will show up here."
            action={
              <button onClick={() => navigate('/projects')} className="btn-primary">
                Go to Projects
              </button>
            }
          />
        </div>
      ) : (
        <>
          <Section title="Overdue" tasks={groups.overdue} onOpen={setSelectedTask} />
          <Section title="Today" tasks={groups.today} onOpen={setSelectedTask} />
          <Section title="Upcoming" tasks={groups.upcoming} onOpen={setSelectedTask} />
          <Section title="No due date" tasks={groups.noDate} onOpen={setSelectedTask} />
        </>
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          members={selectedTask.project?.members || []}
          canEditFull={isAdminRole(getMyRole(selectedTask.project, user?._id))}
          canEditStatus
          onClose={() => setSelectedTask(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};

export default MyTasks;
