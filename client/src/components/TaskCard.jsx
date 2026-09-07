import { Trash2, Calendar, ListChecks, GripVertical } from 'lucide-react';

const priorityStyles = {
  low: { bar: 'bg-gray-400', badge: 'bg-gray-500/10 text-gray-500 dark:text-gray-400' },
  medium: { bar: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  high: { bar: 'bg-red-400', badge: 'bg-red-500/10 text-red-600 dark:text-red-400' },
};

const isOverdue = (task) => {
  if (!task.dueDate || task.status === 'done') return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
};

const TaskCard = ({ task, onStatusChange, onDelete, onOpen, canManage = true, canDrag = true }) => {
  const p = priorityStyles[task.priority] || priorityStyles.medium;
  const overdue = isOverdue(task);
  const checklistDone = task.checklist?.filter((c) => c.done).length || 0;

  return (
    <div
      className="group card card-hover relative overflow-hidden animate-fade-in cursor-pointer"
      onClick={() => onOpen?.(task)}
      draggable={canDrag}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task._id);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${p.bar}`} />
      <div className="p-4 pl-5 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-snug">{task.title}</h4>
          <div className="flex items-center gap-1 shrink-0">
            {canDrag && <GripVertical size={14} className="text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab" />}
            {canManage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task._id);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {task.label && (
          <span className="self-start text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-nova-500/10 text-nova-600 dark:text-nova-300">
            {task.label}
          </span>
        )}

        {task.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{task.description}</p>}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.badge}`}>{task.priority}</span>
          <div className="flex items-center gap-2">
            {task.checklist?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <ListChecks size={12} />
                {checklistDone}/{task.checklist.length}
              </span>
            )}
            {task.dueDate && (
              <span
                className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md ${
                  overdue
                    ? 'text-red-600 dark:text-red-400 bg-red-500/10 font-medium'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <Calendar size={12} />
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {task.assignedTo && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-nova flex items-center justify-center text-white text-[9px] font-semibold">
              {task.assignedTo.name?.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{task.assignedTo.name}</span>
          </div>
        )}

        <select
          value={task.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          className="mt-1 text-xs border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-nova-500/40"
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
  );
};

export default TaskCard;
