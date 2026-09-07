import { useEffect, useState } from 'react';
import { Plus, FolderKanban, Check } from 'lucide-react';
import api from '../services/api';
import ProjectCard from '../components/ProjectCard';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { PROJECT_TEMPLATES } from '../utils/projectTemplates';

const Projects = () => {
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('blank');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/projects');
      setProjects(data);

      const taskLists = await Promise.all(
        data.map((p) => api.get(`/tasks/project/${p._id}`).then((res) => res.data))
      );
      const map = {};
      data.forEach((p, i) => {
        const tasks = taskLists[i];
        map[p._id] = tasks.length ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0;
      });
      setProgressMap(map);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data: project } = await api.post('/projects', { name, description });

      const chosen = PROJECT_TEMPLATES.find((t) => t.key === template);
      if (chosen?.tasks.length) {
        await Promise.all(
          chosen.tasks.map((t) => api.post('/tasks', { ...t, project: project._id }))
        );
      }

      setName('');
      setDescription('');
      setTemplate('blank');
      setShowModal(false);
      toast.success('Project created');
      loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage and track all your team's work</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> New Project
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to start organizing tasks and inviting your team."
            action={
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <Plus size={16} /> New Project
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} progress={progressMap[project._id]} />
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="New Project" onClose={() => setShowModal(false)}>
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Choose a template</label>
              <div className="flex flex-col gap-2">
                {PROJECT_TEMPLATES.map((t) => {
                  const Icon = t.icon;
                  const selected = template === t.key;
                  return (
                    <button
                      type="button"
                      key={t.key}
                      onClick={() => setTemplate(t.key)}
                      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                        selected
                          ? 'border-nova-500 bg-nova-500/5'
                          : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon size={17} className="text-nova-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{t.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{t.description}</p>
                      </div>
                      {selected && <Check size={16} className="text-nova-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Projects;
