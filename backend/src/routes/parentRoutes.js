const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { verifyParent } = require('../middleware/authMiddleware');

// Routes
router.post('/login', parentController.parentLogin);
router.post('/update-password', verifyParent, parentController.updatePassword);
router.get('/announcements', verifyParent, parentController.getAnnouncements);
router.get('/assessments', verifyParent, parentController.getAssessmentHistory);
router.get('/library', verifyParent, parentController.getLibrary);

module.exports = router;
