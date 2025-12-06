const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { verifyStaff } = require('../middleware/authMiddleware');

router.post('/upload', verifyStaff, resultController.uploadResult);
router.get('/:studentId', resultController.getStudentResults);

module.exports = router;