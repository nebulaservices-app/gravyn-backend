// src/sockets/communicationServer.js
const { handleJoinRooms, handleLeaveRooms } = require('../utils/socketHelpers');

module.exports = function (communicationNamespace) {
    communicationNamespace.on('connection', (socket) => {
        console.log(`🔌 User connected to /communication: ${socket.id}`);

        // Join user-specific and project/team rooms
        socket.on('joinUserRoom', ({ userId }) => {
            socket.join(`user_${userId}`);
            console.log(`✅ User ${userId} joined user_${userId}`);
        });

        socket.on('joinProjectRoom', ({ projectId }) => {
            socket.join(`projectRoom_${projectId}`);
            console.log(`📁 Joined project room: projectRoom_${projectId}`);
        });

        socket.on('joinTeamRoom', ({ teamId }) => {
            socket.join(`teamRoom_${teamId}`);
            console.log(`👥 Joined team room: teamRoom_${teamId}`);
        });


        socket.on("joinPrivateRoom", ({ conversationId }) => {
            socket.join(`privateRoom_${conversationId}`);
            console.log(`🧩 Joined private room: privateRoom_${conversationId}`);
        });


        socket.on("privateMessage", ({ conversationId, message }) => {
            communicationNamespace.to(`privateRoom_${conversationId}`).emit("receivePrivateMessage", message);
        });


        socket.on('joinTopicRoom', ({ topicId }) => {
            socket.join(`topicChannel_${topicId}`);
            console.log(`💬 Joined topic: topicChannel_${topicId}`);
        });



        // Real-time task update
        socket.on('updateTask', ({ projectId, task }) => {
            communicationNamespace.to(`projectRoom_${projectId}`).emit('taskUpdated', task);
        });

        // New comment on a task
        socket.on('newComment', ({ projectId, comment }) => {
            communicationNamespace.to(`projectRoom_${projectId}`).emit('commentAdded', comment);
        });

        // DM between two users
        socket.on('sendPrivateMessage', ({ toUserId, message }) => {
            communicationNamespace.to(`user_${toUserId}`).emit('receivePrivateMessage', message);
        });

        socket.on('disconnect', () => {
            console.log(`❌ Disconnected: ${socket.id}`);
            // Optional: Leave logic
        });
    });
};