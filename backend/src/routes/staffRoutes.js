const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { verifyStaff } = require('../middleware/authMiddleware');

router.post('/register', staffController.registerStaff);
router.post('/login', staffController.staffLogin);
router.get('/my-students', verifyStaff, staffController.getMyStudents);

module.exports = router;