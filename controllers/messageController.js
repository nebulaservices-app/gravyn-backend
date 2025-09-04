const messageService = require("../service/messageService");

// POST /api/messages
const createMessage = async (req, res) => {
    try {
        const newMsg = await messageService.createMessage(req.body);
        res.status(201).json(newMsg);
    } catch (err) {
        console.error("Error creating message:", err);
        res.status(500).json({ error: "Failed to create message" });
    }
};

// GET /api/messages/room/:roomId
const getMessagesByRoomId = async (req, res) => {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    try {
        const messages = await messageService.getMessagesByRoomId(roomId, limit, skip);
        res.json(messages);
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};

// DELETE (soft) /api/messages/:messageId/user/:userId
const softDeleteMessageForUser = async (req, res) => {
    const { messageId, userId } = req.params;
    try {
        await messageService.softDeleteMessageForUser(messageId, userId);
        res.json({ success: true });
    } catch (err) {
        console.error("Soft delete failed:", err);
        res.status(500).json({ error: "Soft delete failed" });
    }
};

// DELETE (hard) /api/messages/:messageId
const hardDeleteMessage = async (req, res) => {
    const { messageId } = req.params;
    try {
        await messageService.hardDeleteMessage(messageId);
        res.json({ success: true });
    } catch (err) {
        console.error("Hard delete failed:", err);
        res.status(500).json({ error: "Hard delete failed" });
    }
};

module.exports = {
    createMessage,
    getMessagesByRoomId,
    softDeleteMessageForUser,
    hardDeleteMessage,
};
