import { useEffect, useState } from 'react';
import { FolderPlus, UserPlus, UserMinus, ShieldCheck, PlusCircle, Pencil, Trash2, MessageSquare, History } from 'lucide-react';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import { SkeletonLine } from './Skeleton';

const ACTION_META = {
  project_created: { icon: FolderPlus, verb: 'created the project' },
  member_added: { icon: UserPlus, verb: 'added a member' },
  member_removed: { icon: UserMinus, verb: 'removed a member' },
  member_role_changed: { icon: ShieldCheck, verb: 'changed a member role to' },
  task_created: { icon: PlusCircle, verb: 'created' },
  task_updated: { icon: Pencil, verb: 'updated' },
  task_deleted: { icon: Trash2, verb: 'deleted' },
  comment_added: { icon: MessageSquare, verb: 'commented on' },
};

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const ActivityFeed = ({ projectId }) => {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/projects/${projectId}/activity`)
      .then(({ data }) => setActivity(data))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="card p-6 flex flex-col gap-3">
        {[...Array(4)].map((_, i) => (
          <SkeletonLine key={i} className="w-3/4" />
        ))}
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <div className="card">
        <EmptyState icon={History} title="No activity yet" description="Actions on this project will show up here." />
      </div>
    );
  }

  return (
    <div className="card divide-y divide-gray-100 dark:divide-white/10">
      {activity.map((item) => {
        const meta = ACTION_META[item.action] || { icon: History, verb: item.action };
        const Icon = meta.icon;
        return (
          <div key={item._id} className="flex items-start gap-3 px-4 py-3.5">
            <div className="w-8 h-8 rounded-full bg-gradient-nova-soft flex items-center justify-center shrink-0">
              <Icon size={14} className="text-nova-600 dark:text-nova-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-700 dark:text-gray-200">
                <span className="font-medium">{item.user?.name}</span> {meta.verb}
                {item.target && <span className="font-medium"> "{item.target}"</span>}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(item.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
