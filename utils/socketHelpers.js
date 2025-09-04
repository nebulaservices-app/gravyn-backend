// src/utils/socketHelpers.js
function handleJoinRooms(socket, rooms = []) {
    rooms.forEach(room => socket.join(room));
}

function handleLeaveRooms(socket, rooms = []) {
    rooms.forEach(room => socket.leave(room));
}

module.exports = { handleJoinRooms, handleLeaveRooms };