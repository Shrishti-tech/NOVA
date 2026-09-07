const express = require('express');
const { getUsers, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getUsers);
router.put('/me', updateProfile);

module.exports = router;
