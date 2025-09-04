const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Fetch all users
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Get user by email
router.get('/email/:email', userController.getUserByEmail);

// Get users by role
router.get('/role/:role', userController.getUsersByRole);

// Search users
router.get('/search', userController.searchUsers);

// Paginated users
router.get('/paginated', userController.getPaginatedUsers);

// Get current user (protected route if auth is setup)
router.get('/me', userController.getCurrentUser);

// Create new user
router.post('/', userController.createUser);

// Update user (full)
router.put('/:id', userController.updateUser);

// Update user (partial)
router.patch('/:id', userController.partialUpdateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;