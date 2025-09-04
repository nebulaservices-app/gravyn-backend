const express = require('express');
const router = express.Router();
const aiChatController = require('../../../controllers/aiChatController');

/**
 * @route   POST /api/v1/comm/chat/ai/message
 * @desc    Send a message to AI and receive a response
 * @access  Private (auth middleware can be added as needed)
 */
router.post('/ai/message', aiChatController.handleAIMessage);

module.exports = router;