const express = require("express");
const RoomController = require("../../controllers/roomController.js");

const router = express.Router();

// Create room
router.post("/", RoomController.createRoom);

// Get a specific room by ID
router.get("/:roomId", RoomController.getRoomById);

// Get all rooms a user is part of
router.get("/user/:userId", RoomController.getUserRooms);

// Get all rooms under a project
router.get("/project/:projectId", RoomController.getRoomsByProject);

// Get all rooms a user is part of in a specific project
router.get("/project/:projectId/user/:userId", RoomController.getUserRoomsByProject);

// Update room details
router.put("/:roomId", RoomController.updateRoom);

// Update room config only
router.put("/:roomId/config", RoomController.updateRoomConfig);

// Add participant to room
router.post("/:roomId/participants", RoomController.addParticipant);

// Remove participant from room
router.delete("/:roomId/participants/:userId", RoomController.removeParticipant);

// Soft delete room for a specific user
router.delete("/:roomId/soft-delete/:userId", RoomController.softDeleteRoom);

// routes/rooms.js
router.get("/project/:projectId/dm/:user1Id/:user2Id", RoomController.checkDMRoom);

module.exports = router;