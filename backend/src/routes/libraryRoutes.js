const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Public / User Routes
router.get('/', libraryController.getLibrary);
router.post('/buy', libraryController.verifyBookPurchase);

// Admin Routes
router.post('/add', verifyAdmin, libraryController.addBook);
router.delete('/:id', verifyAdmin, libraryController.deleteBook);

module.exports = router;