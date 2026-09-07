const Task = require('../models/Task');
const Project = require('../models/Project');
const logActivity = require('../utils/logActivity');
const createNotification = require('../utils/createNotification');
const { isAdmin, isMember } = require('../utils/permissions');

const POPULATE_ASSIGNEE = 'assignedTo';
const ASSIGNEE_FIELDS = 'name email avatar';
const COMMENT_POPULATE = { path: 'comments.user', select: 'name email avatar' };

// @route GET /api/tasks/project/:projectId
const getTasksByProject = async (req, res, next) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate(POPULATE_ASSIGNEE, ASSIGNEE_FIELDS)
      .populate(COMMENT_POPULATE)
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/tasks/mine
const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate(POPULATE_ASSIGNEE, ASSIGNEE_FIELDS)
      .populate(COMMENT_POPULATE)
      .populate({
        path: 'project',
        select: 'name members',
        populate: { path: 'members.user', select: 'name email avatar' },
      })
      .sort({ dueDate: 1, createdAt: -1 });

    const serialized = tasks.map((t) => {
      const obj = t.toObject();
      if (obj.project) {
        obj.project.members = (obj.project.members || []).map((m) => ({
          _id: m.user._id,
          name: m.user.name,
          email: m.user.email,
          avatar: m.user.avatar,
          role: m.role,
        }));
      }
      return obj;
    });

    res.json(serialized);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, project, assignedTo, status, priority, dueDate, label } = req.body;

    if (!title || !project) {
      return res.status(400).json({ message: 'Task title and project are required' });
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!isAdmin(projectDoc, req.user._id)) {
      return res.status(403).json({ message: 'Only the owner or an admin can create tasks' });
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignedTo: assignedTo || null,
      status,
      priority,
      dueDate,
      label,
    });

    await logActivity({ project, user: req.user._id, action: 'task_created', target: task.title });

    if (assignedTo && assignedTo !== req.user._id.toString()) {
      await createNotification({
        user: assignedTo,
        type: 'task_assigned',
        message: `You were assigned to "${task.title}"`,
        project,
        task: task._id,
      });
    }

    const populated = await task.populate(POPULATE_ASSIGNEE, ASSIGNEE_FIELDS);
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const admin = isAdmin(project, req.user._id);
    const assignedToSelf = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!admin && !assignedToSelf) {
      return res.status(403).json({ message: 'You do not have permission to edit this task' });
    }

    const { title, description, assignedTo, status, priority, dueDate, checklist, label } = req.body;

    // Plain members who own the assignment may only update status and checklist progress.
    if (!admin) {
      if (status !== undefined) task.status = status;
      if (checklist !== undefined) task.checklist = checklist;
    } else {
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (checklist !== undefined) task.checklist = checklist;
      if (label !== undefined) task.label = label;

      if (assignedTo !== undefined && assignedTo !== (task.assignedTo?.toString() || null)) {
        task.assignedTo = assignedTo || null;
        if (assignedTo && assignedTo !== req.user._id.toString()) {
          await createNotification({
            user: assignedTo,
            type: 'task_assigned',
            message: `You were assigned to "${task.title}"`,
            project: project._id,
            task: task._id,
          });
        }
      }
    }

    await task.save();
    await logActivity({ project: project._id, user: req.user._id, action: 'task_updated', target: task.title });

    const populated = await task.populate(POPULATE_ASSIGNEE, ASSIGNEE_FIELDS);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/tasks/:id/comments
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project || !isMember(project, req.user._id)) {
      return res.status(403).json({ message: 'You do not have access to this task' });
    }

    task.comments.push({ user: req.user._id, text: text.trim() });
    await task.save();

    await logActivity({ project: project._id, user: req.user._id, action: 'comment_added', target: task.title });

    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      await createNotification({
        user: task.assignedTo,
        type: 'comment_added',
        message: `New comment on "${task.title}"`,
        project: project._id,
        task: task._id,
      });
    }

    const populated = await task.populate([
      { path: POPULATE_ASSIGNEE, select: ASSIGNEE_FIELDS },
      COMMENT_POPULATE,
    ]);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project || !isAdmin(project, req.user._id)) {
      return res.status(403).json({ message: 'Only the owner or an admin can delete tasks' });
    }

    await task.deleteOne();
    await logActivity({ project: project._id, user: req.user._id, action: 'task_deleted', target: task.title });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasksByProject, getMyTasks, createTask, updateTask, addComment, deleteTask };
