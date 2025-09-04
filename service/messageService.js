const { ObjectId } = require("mongodb");
const mongoDBClient = require("../utils/MongoClient");
const { updateRoom } = require("./roomService");

const getMessageCollection = async () => {
    const db = await mongoDBClient.getDatabase("main");
    return db.collection("Messages");
};

// 📥 Create message
const createMessage = async (messageData) => {
    const Messages = await getMessageCollection();

    // Sanitize and prepare the new fields for the message document
    const newFields = {
        // If a replyTo ID is provided, convert it to an ObjectId, otherwise it's null
        replyTo: messageData.replyTo ? new ObjectId(messageData.replyTo) : null,
        
        // The content now comes from the rich text editor, which can be HTML
        content: messageData.content, 

        // Add a flexible metadata object for future data like attachments or mentions
        metadata: {
            attachments: messageData.attachments || [], // e.g., [{ type: 'image', url: '...' }]
            mentions: messageData.mentions || [],       // e.g., [new ObjectId('...')]
        },
    };

    const newMessage = {
        roomId: new ObjectId(messageData.roomId),
        senderId: new ObjectId(messageData.senderId),
        type: messageData.type || "text",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedFor: [],
        ...newFields // Add the new, structured fields to the document
    };

    const result = await Messages.insertOne(newMessage);
    const savedMessage = { ...newMessage, _id: result.insertedId };

    // Update the lastMessage object for the room preview in the sidebar
    const lastMessage = {
        _id: savedMessage._id,
        senderId: savedMessage.senderId,
        content: savedMessage.content, // Storing the rich content for previews
        type: savedMessage.type,
        createdAt: savedMessage.createdAt,
        attachment: savedMessage.metadata.attachments[0] || null, // For quick attachment previews
        status: {
            deliveredTo: [],
            readBy: [],
            failed: []
        }
    };

    // Update the parent room with this new last message
    await updateRoom(savedMessage.roomId, {
        lastMessage,
        lastMessageId: savedMessage._id
    });

    return savedMessage;
};

// 📦 Get messages by room ID
const getMessagesByRoomId = async (roomId, limit = 50, skip = 0) => {
    const Messages = await getMessageCollection();
    console.log("Getting room messages for:", roomId);
    const messages =  await Messages.find({ roomId: new ObjectId(roomId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

    console.log("Messages fetched:", messages);
    return messages;
};

// 🧽 Soft delete a message for a specific user
const softDeleteMessageForUser = async (messageId, userId) => {
    const Messages = await getMessageCollection();
    await Messages.updateOne(
        { _id: new ObjectId(messageId) },
        { $addToSet: { deletedFor: new ObjectId(userId) } }
    );
};

// 🗑️ Hard delete message (admin-level)
const hardDeleteMessage = async (messageId) => {
    const Messages = await getMessageCollection();
    await Messages.deleteOne({ _id: new ObjectId(messageId) });
};

module.exports = {
    createMessage,
    getMessagesByRoomId,
    softDeleteMessageForUser,
    hardDeleteMessage,
};
