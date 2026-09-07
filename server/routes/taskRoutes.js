const express = require('express');
const { getTasksByProject, getMyTasks, createTask, updateTask, addComment, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/mine', getMyTasks);
router.get('/project/:projectId', getTasksByProject);
router.post('/', createTask);
router.route('/:id').put(updateTask).delete(deleteTask);
router.post('/:id/comments', addComment);

module.exports = router;
