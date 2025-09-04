// services/roomService.js
import { ObjectId } from "mongodb";
import  mongoDBClient from "../utils/MongoClient.js"; // Adjust path if needed

// 🧩 Collection getter (unified DB)
const getRoomCollection = async () => {
    const db = await mongoDBClient.getDatabase("main");
    return db.collection("Rooms");
};

// 🏗️ Create a new room
export const createRoom = async (roomData) => {
    const Rooms = await getRoomCollection();

    const defaultConfig = {
        isPinned: false,
        isArchived: false,
        isPublic: false,
        allowMedia: true,
        allowThreads: false,
        allowMentions: true,
        allowReaction: true,
        maxParticipants: 100,
        accessTier: "basic",
        messageRetentionDays: 90,
    };

    const newRoom = {
        name: roomData.name || null,
        type: roomData.type, // "private/dm", "team", "channel", etc
        participants: (roomData.participants || []).map((p) => ({
            userId: new ObjectId(p.userId),     // ✅ convert to ObjectId
            isMuted: p.isMuted || false,
            hasDeleted: p.hasDeleted || false,
            deletedAt: p.deletedAt || null,
        })),
        parentRoomId: roomData.parentRoomId ? new ObjectId(roomData.parentRoomId) : null,
        projectId: roomData.projectId ? new ObjectId(roomData.projectId) : null,
        lastMessageId: null,
        createdBy: new ObjectId(roomData.createdBy),
        createdAt: new Date(),
        updatedAt: new Date(),
        config: { ...defaultConfig, ...roomData.config },
    };

    const result = await Rooms.insertOne(newRoom);
    return { ...newRoom, _id: result.insertedId };
};
// 📥 Get a room by ID
export const getRoomById = async (roomId) => {
    const Rooms = await getRoomCollection();
    return await Rooms.findOne({ _id: new ObjectId(roomId) });
};

// 📦 Get all rooms user is part of
export const getRoomsByUserId = async (userId) => {
    const Rooms = await getRoomCollection();
    return await Rooms.find({ "participants.userId": new ObjectId(userId) }).toArray();
};


// Get all the rooms for the project
export const getRoomsByProjectId = async (projectId) => {
    const Rooms = await getRoomCollection();
    return await Rooms.find({ projectId: new ObjectId(projectId) }).toArray();
};

// Get all the rooms for a particular users in that project
export const getUserRoomsByProject = async (userId, projectId) => {
    const Rooms = await getRoomCollection();
    const fetchedRooms = await Rooms.find({
        projectId: new ObjectId(projectId),
        participants: new ObjectId(userId)
    }).toArray();
    console.log("Fetched rooms " , fetchedRooms , "USER ID  " , userId , "PROJECT ID " , projectId );
    return fetchedRooms;
};

// ✏️ Update room info (partial)
export const updateRoom = async (roomId, updateData) => {
    const Rooms = await getRoomCollection();
    updateData.updatedAt = new Date();
    await Rooms.updateOne({ _id: new ObjectId(roomId) }, { $set: updateData });
    return getRoomById(roomId);
};

// ⚙️ Update only the config
export const updateRoomConfig = async (roomId, configUpdate) => {
    const Rooms = await getRoomCollection();
    await Rooms.updateOne(
        { _id: new ObjectId(roomId) },
        { $set: { config: configUpdate, updatedAt: new Date() } }
    );
    return getRoomById(roomId);
};

// ➕ Add a participant
export const addParticipant = async (roomId, participantData) => {
    const Rooms = await getRoomCollection();
    await Rooms.updateOne(
        { _id: new ObjectId(roomId) },
        {
            $addToSet: { participants: participantData },
            $set: { updatedAt: new Date() }
        }
    );
};

// ➖ Remove a participant
export const removeParticipant = async (roomId, userId) => {
    const Rooms = await getRoomCollection();
    await Rooms.updateOne(
        { _id: new ObjectId(roomId) },
        {
            $pull: { participants: { userId: new ObjectId(userId) } },
            $set: { updatedAt: new Date() }
        }
    );
};

// 🕳️ Soft delete messages for user (set hasDeleted + timestamp)
export const softDeleteRoomForUser = async (roomId, userId) => {
    const Rooms = await getRoomCollection();
    await Rooms.updateOne(
        { _id: new ObjectId(roomId), "participants.userId": new ObjectId(userId) },
        {
            $set: {
                "participants.$.hasDeleted": true,
                "participants.$.deletedAt": new Date(),
                updatedAt: new Date()
            }
        }
    );
};

export const findDMRoomBetweenUsers = async (userId1, userId2, projectId) => {
    const Rooms = await getRoomCollection();
    console.log("We are using dm detection, userId1 ", userId1 , "userId2 : " , userId2, " projectId : ", projectId)

    const room =  await Rooms.findOne({
        projectId: new ObjectId(projectId),
        type: "private/dm",
        "participants.userId": { $all: [new ObjectId(userId1), new ObjectId(userId2)] },
    });
    console.log("Room exist " ,!!room);
    return room
};