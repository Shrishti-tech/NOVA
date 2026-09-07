import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, X } from 'lucide-react';
import api from '../services/api';

const SearchPalette = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get('/projects')
      .then(({ data }) => setProjects(data))
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  if (!open) return null;

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  const go = (id) => {
    navigate(`/projects/${id}`);
    onClose();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-lg card overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/10">
          <Search size={18} className="text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
          <kbd className="text-[10px] text-gray-400 border border-gray-200 dark:border-white/10 rounded px-1.5 py-0.5">Esc</kbd>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {loading ? (
            <p className="text-sm text-gray-400 px-4 py-6 text-center">Searching...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 px-4 py-6 text-center">No projects found</p>
          ) : (
            filtered.map((p) => (
              <button
                key={p._id}
                onClick={() => go(p._id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <FolderKanban size={16} className="text-nova-500" />
                <span className="text-sm text-gray-800 dark:text-gray-200">{p.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPalette;
