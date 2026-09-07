import { useEffect, useState } from 'react';
import { UserPlus, X, Users, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getMyRole, isAdminRole } from '../utils/roles';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';

const roleBadge = {
  owner: 'bg-nova-500/10 text-nova-600 dark:text-nova-300',
  admin: 'bg-accent-500/10 text-accent-600 dark:text-accent-400',
  member: 'bg-gray-500/10 text-gray-500 dark:text-gray-400',
};

const Team = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [members, setMembers] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/projects')
      .then(({ data }) => {
        setProjects(data);
        if (data.length > 0) setSelectedProjectId(data[0]._id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    api.get(`/projects/${selectedProjectId}/members`).then(({ data }) => setMembers(data));
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p._id === selectedProjectId);
  const myRole = getMyRole(selectedProject, user?._id);
  const isOwner = myRole === 'owner';
  const isAdmin = isAdminRole(myRole);

  const refreshMembers = async () => {
    const { data } = await api.get(`/projects/${selectedProjectId}/members`);
    setMembers(data);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const { data } = await api.get(`/users?search=${encodeURIComponent(searchEmail)}`);
    setResults(data);
  };

  const handleAdd = async (userId) => {
    setError('');
    try {
      await api.post(`/projects/${selectedProjectId}/members`, { userId });
      await refreshMembers();
      setResults([]);
      setSearchEmail('');
      toast.success('Member added');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemove = async (userId) => {
    try {
      await api.delete(`/projects/${selectedProjectId}/members/${userId}`);
      await refreshMembers();
      toast.info('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/projects/${selectedProjectId}/members/${userId}/role`, { role });
      await refreshMembers();
      toast.success(`Role updated to ${role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Team</h2>

      {projects.length === 0 ? (
        <div className="card">
          <EmptyState icon={Users} title="No projects yet" description="Create a project first to manage its team." />
        </div>
      ) : (
        <>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="input-field mb-6 max-w-xs"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          {isAdmin && (
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Search by name or email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="input-field flex-1"
              />
              <button type="submit" className="btn-primary shrink-0">
                <UserPlus size={16} /> Search
              </button>
            </form>
          )}

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="card p-3 mb-6">
              {results.map((r) => (
                <div key={r._id} className="flex items-center justify-between py-1.5 px-1 text-sm">
                  <span className="text-gray-700 dark:text-gray-200">
                    {r.name} <span className="text-gray-400 dark:text-gray-500">({r.email})</span>
                  </span>
                  <button onClick={() => handleAdd(r._id)} className="text-nova-600 dark:text-nova-300 font-medium hover:underline">
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="card divide-y divide-gray-100 dark:divide-white/10">
            {members.map((m) => {
              const role = m._id === selectedProject?.owner?._id ? 'owner' : m.role;
              return (
                <div key={m._id} className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-nova flex items-center justify-center text-white text-xs font-semibold shrink-0">
                      {m.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{m.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner && role !== 'owner' ? (
                      <select
                        value={role}
                        onChange={(e) => handleRoleChange(m._id, e.target.value)}
                        className="text-xs border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 rounded-lg px-2 py-1"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${roleBadge[role]}`}>
                        {role === 'owner' && <ShieldCheck size={11} />}
                        {role}
                      </span>
                    )}
                    {isOwner && role !== 'owner' && (
                      <button onClick={() => handleRemove(m._id)} className="text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Team;
