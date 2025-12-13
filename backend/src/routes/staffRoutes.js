const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { verifyStaff } = require('../middleware/authMiddleware');
const studentController = require('../controllers/studentController'); 

// --- AUTH ROUTES ---
// This fixes the "404 Not Found" error you saw in the logs
router.post('/login', staffController.staffLogin); 
router.post('/register', staffController.registerStaff);

// --- DASHBOARD DATA ---
router.get('/my-students', verifyStaff, staffController.getMyStudents);

router.get('/profile/:id', studentController.getStudentProfile);
router.get('/announcements', studentController.getAnnouncements);
router.get('/fees', studentController.getSchoolFees);

module.exports = router;
