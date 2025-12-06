const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const studentController = require('../controllers/studentController');

router.post('/register', authController.registerStudent);

router.get('/profile/:id', studentController.getStudentProfile);
router.get('/announcements', studentController.getAnnouncements);

router.post('/verify-payment', studentController.verifyPayment);

router.get('/fees', studentController.getSchoolFees);

module.exports = router;