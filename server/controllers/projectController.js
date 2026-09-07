const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const logActivity = require('../utils/logActivity');
const createNotification = require('../utils/createNotification');
const { isOwner, isAdmin, isMember, getMemberEntry } = require('../utils/permissions');

const MEMBER_POPULATE = { path: 'members.user', select: 'name email avatar' };

const serializeProject = (project) => {
  const obj = project.toObject ? project.toObject() : project;
  return {
    ...obj,
    members: (obj.members || []).map((m) => ({
      _id: m.user._id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatar,
      role: m.role,
    })),
  };
};

// @route GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    })
      .populate('owner', 'name email avatar')
      .populate(MEMBER_POPULATE)
      .sort({ createdAt: -1 });

    res.json(projects.map(serializeProject));
  } catch (error) {
    next(error);
  }
};

// @route GET /api/projects/:id
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('owner', 'name email avatar').populate(MEMBER_POPULATE);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const serialized = serializeProject(project);
    serialized.myRole = isOwner(project, req.user._id) ? 'owner' : getMemberEntry(project, req.user._id)?.role || null;

    res.json(serialized);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    await logActivity({ project: project._id, user: req.user._id, action: 'project_created', target: project.name });

    await project.populate('owner', 'name email avatar');
    await project.populate(MEMBER_POPULATE);
    res.status(201).json(serializeProject(project));
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!isOwner(project, req.user._id)) {
      return res.status(403).json({ message: 'Only the project owner can update this project' });
    }

    const { name, description, status } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;

    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate(MEMBER_POPULATE);
    res.json(serializeProject(project));
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!isOwner(project, req.user._id)) {
      return res.status(403).json({ message: 'Only the project owner can delete this project' });
    }

    await Task.deleteMany({ project: project._id });
    await Activity.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/projects/:id/members
const addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!isAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only the owner or an admin can add members' });
    }

    if (getMemberEntry(project, userId)) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    project.members.push({ user: userId, role: 'member' });
    await project.save();

    await logActivity({ project: project._id, user: req.user._id, action: 'member_added', target: '' });
    await createNotification({
      user: userId,
      type: 'member_added',
      message: `You were added to ${project.name}`,
      project: project._id,
    });

    await project.populate('owner', 'name email avatar');
    await project.populate(MEMBER_POPULATE);
    res.json(serializeProject(project));
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/projects/:id/members/:userId
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (req.params.userId === project.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }

    const targetEntry = getMemberEntry(project, req.params.userId);
    const requesterIsOwner = isOwner(project, req.user._id);

    if (!requesterIsOwner) {
      const requesterEntry = getMemberEntry(project, req.user._id);
      if (requesterEntry?.role !== 'admin') {
        return res.status(403).json({ message: 'Only the owner or an admin can remove members' });
      }
      if (targetEntry?.role === 'admin') {
        return res.status(403).json({ message: 'Only the owner can remove an admin' });
      }
    }

    project.members = project.members.filter((m) => m.user.toString() !== req.params.userId);
    await project.save();

    await logActivity({ project: project._id, user: req.user._id, action: 'member_removed', target: '' });

    await project.populate('owner', 'name email avatar');
    await project.populate(MEMBER_POPULATE);
    res.json(serializeProject(project));
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/projects/:id/members/:userId/role
const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either "admin" or "member"' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!isOwner(project, req.user._id)) {
      return res.status(403).json({ message: 'Only the project owner can change member roles' });
    }

    const entry = getMemberEntry(project, req.params.userId);
    if (!entry) {
      return res.status(404).json({ message: 'Member not found' });
    }

    entry.role = role;
    await project.save();

    await logActivity({ project: project._id, user: req.user._id, action: 'member_role_changed', target: role });

    await project.populate('owner', 'name email avatar');
    await project.populate(MEMBER_POPULATE);
    res.json(serializeProject(project));
  } catch (error) {
    next(error);
  }
};

// @route GET /api/projects/:id/members
const getMembers = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate(MEMBER_POPULATE);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(serializeProject(project).members);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/projects/:id/activity
const getProjectActivity = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!isMember(project, req.user._id)) {
      return res.status(403).json({ message: 'You do not have access to this project' });
    }

    const activity = await Activity.find({ project: project._id })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(activity);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
  getMembers,
  getProjectActivity,
};
