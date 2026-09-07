import { useState } from 'react';
import { X, Plus, Trash2, Check, Send } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const priorityDot = { low: '🟢', medium: '🟡', high: '🔴' };

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const TaskDetailsModal = ({ task, members = [], canEditFull = true, canEditStatus = true, onClose, onUpdated, onDeleted }) => {
  const toast = useToast();
  const canEditAny = canEditFull || canEditStatus;
  const [title] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [label, setLabel] = useState(task.label || '');
  const [assignedTo, setAssignedTo] = useState(task.assignedTo?._id || '');
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');
  const [checklist, setChecklist] = useState(task.checklist || []);
  const [comments, setComments] = useState(task.comments || []);
  const [newItem, setNewItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  const persistChecklist = async (next) => {
    if (!canEditAny) return;
    setChecklist(next);
    try {
      const { data } = await api.put(`/tasks/${task._id}`, { checklist: next });
      onUpdated(data);
    } catch {
      toast.error('Failed to update checklist');
    }
  };

  const addChecklistItem = (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    persistChecklist([...checklist, { text: newItem.trim(), done: false }]);
    setNewItem('');
  };

  const toggleChecklistItem = (idx) => {
    const next = checklist.map((item, i) => (i === idx ? { ...item, done: !item.done } : item));
    persistChecklist(next);
  };

  const removeChecklistItem = (idx) => {
    persistChecklist(checklist.filter((_, i) => i !== idx));
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const { data } = await api.post(`/tasks/${task._id}/comments`, { text: newComment.trim() });
      setComments(data.comments);
      setNewComment('');
      onUpdated(data);
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setPostingComment(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = canEditFull
        ? { description, status, priority, label, assignedTo: assignedTo || null, dueDate: dueDate || null }
        : { status };
      const { data } = await api.put(`/tasks/${task._id}`, payload);
      onUpdated(data);
      toast.success('Task updated');
      onClose();
    } catch {
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${task._id}`);
    onDeleted(task._id);
    toast.info('Task deleted');
    onClose();
  };

  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 animate-slide-up">
        <div className="flex items-start justify-between mb-5 gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-snug">{title}</h2>
          <div className="flex items-center gap-2 shrink-0">
            {canEditFull && (
              <button onClick={handleDelete} className="text-gray-400 hover:text-red-500">
                <Trash2 size={17} />
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={!canEditFull}
              placeholder="Add a description..."
              className="input-field mt-1 resize-none disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={!canEditAny}
                className="input-field mt-1 disabled:opacity-60"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={!canEditFull}
                className="input-field mt-1 disabled:opacity-60"
              >
                <option value="low">{priorityDot.low} Low</option>
                <option value="medium">{priorityDot.medium} Medium</option>
                <option value="high">{priorityDot.high} High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Assignee</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                disabled={!canEditFull}
                className="input-field mt-1 disabled:opacity-60"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={!canEditFull}
                className="input-field mt-1 disabled:opacity-60"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={!canEditFull}
                placeholder="e.g. Backend, Design"
                className="input-field mt-1 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">Checklist</label>
              {checklist.length > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {doneCount}/{checklist.length}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 mb-2">
              {checklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <button
                    onClick={() => canEditAny && toggleChecklistItem(idx)}
                    disabled={!canEditAny}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      item.done
                        ? 'bg-gradient-nova border-transparent'
                        : 'border-gray-300 dark:border-white/20'
                    } ${!canEditAny ? 'opacity-60' : ''}`}
                  >
                    {item.done && <Check size={11} className="text-white" />}
                  </button>
                  <span
                    className={`text-sm flex-1 ${
                      item.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {item.text}
                  </span>
                  {canEditAny && (
                    <button
                      onClick={() => removeChecklistItem(idx)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {canEditAny && (
              <form onSubmit={addChecklistItem} className="flex gap-2">
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add checklist item..."
                  className="input-field flex-1 text-sm py-2"
                />
                <button type="submit" className="btn-secondary px-3">
                  <Plus size={15} />
                </button>
              </form>
            )}
          </div>

          {canEditAny && (
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}

          <div className="border-t border-gray-100 dark:border-white/10 pt-4">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
              Comments {comments.length > 0 && `(${comments.length})`}
            </label>
            <div className="flex flex-col gap-3 mb-3 max-h-48 overflow-y-auto">
              {comments.map((c, idx) => (
                <div key={c._id || idx} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-nova flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                    {(c.user?.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{c.user?.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="input-field flex-1 text-sm py-2"
              />
              <button type="submit" disabled={postingComment} className="btn-secondary px-3">
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
