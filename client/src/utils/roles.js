export const getMyRole = (project, userId) => {
  if (!project || !userId) return null;
  if (project.owner?._id === userId) return 'owner';
  return project.members?.find((m) => m._id === userId)?.role || null;
};

export const isAdminRole = (role) => role === 'owner' || role === 'admin';
