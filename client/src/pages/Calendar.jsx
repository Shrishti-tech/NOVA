import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import api from '../services/api';
import TaskDetailsModal from '../components/TaskDetailsModal';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { getMyRole, isAdminRole } from '../utils/roles';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const priorityDot = { low: '🟢', medium: '🟡', high: '🔴' };

// Due dates are stored as UTC-midnight instants representing a calendar day
// (whatever the picker's YYYY-MM-DD value was), so the grid is built in UTC
// too -- otherwise cells shift by a day for viewers outside UTC.
const dateKey = (d) => d.toISOString().slice(0, 10);

const buildGrid = (monthDate) => {
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startOffset = (firstOfMonth.getUTCDay() + 6) % 7; // Monday-first

  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(Date.UTC(year, month, 1 - startOffset + i)));
  }
  return days;
};

const Calendar = () => {
  const { user } = useAuth();
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  });
  const [tasksByDate, setTasksByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(dateKey(new Date()));
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskProject, setSelectedTaskProject] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: projects } = await api.get('/projects');
      const taskLists = await Promise.all(
        projects.map((p) => api.get(`/tasks/project/${p._id}`).then((res) => res.data.map((t) => ({ ...t, project: p }))))
      );
      const map = {};
      taskLists.flat().forEach((task) => {
        if (!task.dueDate) return;
        const key = task.dueDate.slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(task);
      });
      setTasksByDate(map);
      setLoading(false);
    };
    load();
  }, []);

  const days = useMemo(() => buildGrid(monthDate), [monthDate]);
  const today = dateKey(new Date());
  const selectedTasks = tasksByDate[selectedDay] || [];

  const changeMonth = (delta) => {
    setMonthDate((d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1)));
  };

  const openTask = (task) => {
    setSelectedTask(task);
    setSelectedTaskProject(task.project);
  };

  const myRole = getMyRole(selectedTaskProject, user?._id);
  const isAdmin = isAdminRole(myRole);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Task due dates across all your projects</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)} className="btn-secondary p-2">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 w-36 text-center">
            {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
          </span>
          <button onClick={() => changeMonth(1)} className="btn-secondary p-2">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="card p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const key = dateKey(d);
              const inMonth = d.getUTCMonth() === monthDate.getUTCMonth();
              const dayTasks = tasksByDate[key] || [];
              const isToday = key === today;
              const isSelected = key === selectedDay;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(key)}
                  className={`aspect-square rounded-xl p-1.5 flex flex-col items-center justify-start text-xs transition-colors ${
                    isSelected
                      ? 'bg-nova-500/15 ring-1 ring-nova-400'
                      : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  } ${!inMonth ? 'opacity-30' : ''}`}
                >
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full mb-0.5 ${
                      isToday ? 'bg-gradient-nova text-white font-semibold' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {d.getUTCDate()}
                  </span>
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {dayTasks.slice(0, 3).map((t, i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-nova-500" />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            {new Date(selectedDay).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })}
          </h3>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : selectedTasks.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No tasks due" description="Nothing is due on this day." />
          ) : (
            <div className="flex flex-col gap-2">
              {selectedTasks.map((task) => (
                <button
                  key={task._id}
                  onClick={() => openTask(task)}
                  className="flex items-start gap-2 text-left rounded-xl border border-gray-100 dark:border-white/10 p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm shrink-0">{priorityDot[task.priority]}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{task.project?.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          members={selectedTaskProject?.members || []}
          canEditFull={isAdmin}
          canEditStatus={isAdmin || selectedTask.assignedTo?._id === user?._id}
          onClose={() => setSelectedTask(null)}
          onUpdated={(updated) => {
            setTasksByDate((prev) => {
              const next = { ...prev };
              Object.keys(next).forEach((key) => {
                next[key] = next[key].map((t) => (t._id === updated._id ? { ...updated, project: t.project } : t));
              });
              return next;
            });
            setSelectedTask((prev) => (prev ? { ...updated, project: prev.project } : prev));
          }}
          onDeleted={(taskId) => {
            setTasksByDate((prev) => {
              const next = { ...prev };
              Object.keys(next).forEach((key) => {
                next[key] = next[key].filter((t) => t._id !== taskId);
              });
              return next;
            });
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default Calendar;
