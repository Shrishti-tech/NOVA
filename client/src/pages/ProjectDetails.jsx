import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ClipboardList, LayoutGrid, History } from 'lucide-react';
import api from '../services/api';
import TaskCard from '../components/TaskCard';
import TaskDetailsModal from '../components/TaskDetailsModal';
import ActivityFeed from '../components/ActivityFeed';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getMyRole, isAdminRole } from '../utils/roles';

const columns = [
  { key: 'todo', label: 'To Do', dot: 'bg-gray-400' },
  { key: 'in-progress', label: 'In Progress', dot: 'bg-amber-400' },
  { key: 'done', label: 'Done', dot: 'bg-emerald-400' },
];

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [label, setLabel] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const load = async () => {
    setLoading(true);
    const [projectRes, tasksRes] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/project/${id}`),
    ]);
    setProject(projectRes.data);
    setTasks(tasksRes.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/tasks', {
        title,
        description,
        priority,
        label,
        project: id,
        assignedTo: assignedTo || null,
        dueDate: dueDate || null,
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setLabel('');
      setAssignedTo('');
      setDueDate('');
      setShowTaskModal(false);
      toast.success('Task created');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.info('Task deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${id}`);
    toast.info('Project deleted');
    navigate('/projects');
  };

  const handleDrop = (e, columnKey) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find((t) => t._id === taskId);
    if (task && task.status !== columnKey) {
      handleStatusChange(taskId, columnKey);
    }
  };

  if (loading || !project) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const myRole = getMyRole(project, user?._id);
  const isOwner = myRole === 'owner';
  const isAdmin = isAdminRole(myRole);
  const donePct = tasks.length ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{project.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{project.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <button onClick={() => setShowTaskModal(true)} className="btn-primary">
              <Plus size={16} /> New Task
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleDeleteProject}
              className="flex items-center gap-2 text-red-500 text-sm px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 mb-5">
        <button
          onClick={() => setTab('board')}
          className={`flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-full font-medium transition-colors ${
            tab === 'board' ? 'bg-gradient-nova text-white' : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
          }`}
        >
          <LayoutGrid size={14} /> Board
        </button>
        <button
          onClick={() => setTab('activity')}
          className={`flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-full font-medium transition-colors ${
            tab === 'activity' ? 'bg-gradient-nova text-white' : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
          }`}
        >
          <History size={14} /> Activity
        </button>
      </div>

      {tab === 'activity' ? (
        <ActivityFeed projectId={id} />
      ) : (
        <>
          {tasks.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                <span>{donePct}% complete</span>
                <span>
                  {tasks.filter((t) => t.status === 'done').length} / {tasks.length} tasks
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-nova transition-all duration-500" style={{ width: `${donePct}%` }} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {columns.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.key);
              return (
                <div
                  key={col.key}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverCol(col.key);
                  }}
                  onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
                  onDrop={(e) => handleDrop(e, col.key)}
                  className={`rounded-2xl p-4 transition-colors ${
                    dragOverCol === col.key ? 'bg-nova-500/10 ring-2 ring-nova-400/50' : 'bg-gray-100/70 dark:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">{col.label}</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-white/10 rounded-full px-2 py-0.5 ml-auto">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 min-h-[80px]">
                    {colTasks.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">No tasks</p>
                    ) : (
                      colTasks.map((task) => {
                        const canManageTask = isAdmin;
                        const canDrag = isAdmin || task.assignedTo?._id === user?._id;
                        return (
                          <TaskCard
                            key={task._id}
                            task={task}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteTask}
                            onOpen={setSelectedTask}
                            canManage={canManageTask}
                            canDrag={canDrag}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {tasks.length === 0 && (
            <div className="card mt-4">
              <EmptyState
                icon={ClipboardList}
                title="No tasks yet"
                description={
                  isAdmin
                    ? 'Add your first task to start tracking work on this project.'
                    : 'No tasks have been created for this project yet.'
                }
                action={
                  isAdmin && (
                    <button onClick={() => setShowTaskModal(true)} className="btn-primary">
                      <Plus size={16} /> New Task
                    </button>
                  )
                }
              />
            </div>
          )}
        </>
      )}

      {showTaskModal && (
        <Modal title="New Task" onClose={() => setShowTaskModal(false)}>
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input-field"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="input-field resize-none"
            />
            <input
              type="text"
              placeholder="Label (optional, e.g. Backend)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="input-field"
            />
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-field">
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="input-field">
              <option value="">Unassigned</option>
              {project.members?.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Due date (optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field mt-1"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </form>
        </Modal>
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          members={project.members}
          canEditFull={isAdmin}
          canEditStatus={isAdmin || selectedTask.assignedTo?._id === user?._id}
          onClose={() => setSelectedTask(null)}
          onUpdated={(updated) => {
            setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
            setSelectedTask(updated);
          }}
          onDeleted={(taskId) => {
            setTasks((prev) => prev.filter((t) => t._id !== taskId));
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetails;
