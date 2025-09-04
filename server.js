// server.js
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js'; // Your Express app
import communicationServer from './sockets/communicationServer.js';
import notificationsServer from './sockets/notificationsServer.js';

dotenv.config();

// Create HTTP server
const server = http.createServer(app);

// Attach socket.io
const io = new Server(server, {
    cors: {
        origin: "http://localhost:7001", // Frontend URL
        credentials: true
    }
});

// Set up namespaces
const communicationNamespace = io.of("/communication");
const notificationsNamespace = io.of("/notifications");

// Register socket handlers for each namespace
communicationServer(communicationNamespace);
notificationsServer(notificationsNamespace);

// Start the server
const PORT = 5001;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🧩 Socket.IO namespaces: /communication, /notifications`)
});