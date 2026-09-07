import { useNavigate } from 'react-router-dom';
import { Users2, ArrowUpRight } from 'lucide-react';

const statusStyles = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  completed: 'bg-nova-500/10 text-nova-600 dark:text-nova-300',
  archived: 'bg-gray-500/10 text-gray-500 dark:text-gray-400',
};

const ProjectCard = ({ project, progress }) => {
  const navigate = useNavigate();
  const pct = progress ?? 0;

  return (
    <div
      onClick={() => navigate(`/projects/${project._id}`)}
      className="group card card-hover p-5 cursor-pointer relative overflow-hidden animate-fade-in"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-nova opacity-80" />

      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white pr-2">{project.name}</h3>
        <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${statusStyles[project.status] || statusStyles.active}`}>
          {project.status}
        </span>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 min-h-[2.5rem]">
        {project.description || 'No description'}
      </p>

      {progress !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span>Progress</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-nova transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <Users2 size={14} />
          {project.members?.length || 0} member{project.members?.length === 1 ? '' : 's'}
        </div>
        <ArrowUpRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-nova-500 transition-colors" />
      </div>
    </div>
  );
};

export default ProjectCard;
