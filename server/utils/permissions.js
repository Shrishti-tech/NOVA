const isOwner = (project, userId) => project.owner.toString() === userId.toString();

const getMemberEntry = (project, userId) => project.members.find((m) => m.user.toString() === userId.toString());

const isAdmin = (project, userId) => isOwner(project, userId) || getMemberEntry(project, userId)?.role === 'admin';

const isMember = (project, userId) => isOwner(project, userId) || !!getMemberEntry(project, userId);

module.exports = { isOwner, isAdmin, isMember, getMemberEntry };
