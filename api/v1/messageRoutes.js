const express = require("express");
const MessageController = require("../../controllers/messageController");

const router = express.Router();

// POST new message
// This existing route will handle all new messages, including replies
router.post("/", MessageController.createMessage);

// GET messages by roomId
router.get("/room/:roomId", MessageController.getMessagesByRoomId);

// Soft delete for a specific user
router.delete("/:messageId/user/:userId", MessageController.softDeleteMessageForUser);

// Hard delete message (admin)
router.delete("/:messageId", MessageController.hardDeleteMessage);

module.exports = router;
