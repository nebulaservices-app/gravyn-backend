import * as RoomService from "../service/roomService.js";

// 🎯 Create Room
export const createRoom = async (req, res) => {
    try {
        const roomData = req.body;
        const newRoom = await RoomService.createRoom(roomData);
        res.status(201).json({ success: true, room: newRoom });
    } catch (error) {
        console.error("Error creating room:", error);
        res.status(500).json({ success: false, message: "Failed to create room" });
    }
};

// 📦 Get Room by ID
export const getRoomById = async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await RoomService.getRoomById(roomId);
        if (!room) return res.status(404).json({ success: false, message: "Room not found" });
        res.json({ success: true, room });
    } catch (error) {
        console.error("Error fetching room:", error);
        res.status(500).json({ success: false, message: "Failed to fetch room" });
    }
};

// 📋 Get All Rooms for a User
export const getUserRooms = async (req, res) => {
    try {
        const { userId } = req.params;
        const rooms = await RoomService.getRoomsByUserId(userId);
        res.json({ success: true, rooms });
    } catch (error) {
        console.error("Error fetching user rooms:", error);
        res.status(500).json({ success: false, message: "Failed to fetch rooms" });
    }
};

// ✏️ Update Room
export const updateRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const updateData = req.body;
        const updatedRoom = await RoomService.updateRoom(roomId, updateData);
        res.json({ success: true, room: updatedRoom });
    } catch (error) {
        console.error("Error updating room:", error);
        res.status(500).json({ success: false, message: "Failed to update room" });
    }
};

// ⚙️ Update Config
export const updateRoomConfig = async (req, res) => {
    try {
        const { roomId } = req.params;
        const config = req.body;
        const updatedRoom = await RoomService.updateRoomConfig(roomId, config);
        res.json({ success: true, room: updatedRoom });
    } catch (error) {
        console.error("Error updating config:", error);
        res.status(500).json({ success: false, message: "Failed to update config" });
    }
};

// ➕ Add Participant
export const addParticipant = async (req, res) => {
    try {
        const { roomId } = req.params;
        const participant = req.body;
        await RoomService.addParticipant(roomId, participant);
        res.json({ success: true, message: "Participant added" });
    } catch (error) {
        console.error("Error adding participant:", error);
        res.status(500).json({ success: false, message: "Failed to add participant" });
    }
};

// ➖ Remove Participant
export const removeParticipant = async (req, res) => {
    try {
        const { roomId, userId } = req.params;
        await RoomService.removeParticipant(roomId, userId);
        res.json({ success: true, message: "Participant removed" });
    } catch (error) {
        console.error("Error removing participant:", error);
        res.status(500).json({ success: false, message: "Failed to remove participant" });
    }
};

// 🗑️ Soft Delete Room for a User
export const softDeleteRoom = async (req, res) => {
    try {
        const { roomId, userId } = req.params;
        await RoomService.softDeleteRoomForUser(roomId, userId);
        res.json({ success: true, message: "Room deleted for user" });
    } catch (error) {
        console.error("Error deleting room for user:", error);
        res.status(500).json({ success: false, message: "Failed to delete room for user" });
    }
};

// 📁 Get All Rooms for a Project
export const getRoomsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const rooms = await RoomService.getRoomsByProjectId(projectId);
        res.json({ success: true, rooms });
    } catch (error) {
        console.error("Error fetching project rooms:", error);
        res.status(500).json({ success: false, message: "Failed to fetch rooms for project" });
    }
};

// 📁 Get All Rooms for a User in a Project
export const getUserRoomsByProject = async (req, res) => {
    try {
        const { userId, projectId } = req.params;
        console.log("PROJECT ID , USERID" , { projectId, userId })
        const rooms = await RoomService.getUserRoomsByProject(userId, projectId);
        res.json({ success: true, rooms });
    } catch (error) {
        console.error("Error fetching user rooms in project:", error);
        res.status(500).json({ success: false, message: "Failed to fetch user rooms in project" })
    }
};


// controllers/roomController.js
export const checkDMRoom = async (req, res) => {
    try {
        const { user1Id, user2Id, projectId } = req.params;
        const room = await RoomService.findDMRoomBetweenUsers(user1Id, user2Id, projectId);
        res.json({ success: true, exists: !!room, room });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error checking DM room" });
    }
};