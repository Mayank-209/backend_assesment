const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

// Track connected users & sockets
const userSocketMap = {};
const dealRooms = {}; // { dealId: Set(userIds) }

const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  // Emit online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ✅ User joins a deal room
  socket.on("join-deal-room", ({ dealId, userId }) => {
    socket.join(dealId);

    if (!dealRooms[dealId]) {
      dealRooms[dealId] = new Set();
    }
    dealRooms[dealId].add(userId);

    console.log(`📌 User ${userId} joined deal room: ${dealId}`);
    io.to(dealId).emit("user-joined", { userId, dealMembers: [...dealRooms[dealId]] });
  });

  // ✅ Handle sending messages
  socket.on("send-message", ({ dealId, senderId, content }) => {
    const message = { senderId, content, timestamp: new Date() };
    io.to(dealId).emit("receive-message", message);
  });

  // ✅ Handle typing indicators
  socket.on("typing", ({ dealId, senderId }) => {
    socket.to(dealId).emit("user-typing", { senderId });
  });

  socket.on("stopped-typing", ({ dealId, senderId }) => {
    socket.to(dealId).emit("user-stopped-typing", { senderId });
  });

  // ✅ Handle user disconnection
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    // Remove user from all deal rooms
    Object.keys(dealRooms).forEach((dealId) => {
      dealRooms[dealId].delete(userId);
      if (dealRooms[dealId].size === 0) {
        delete dealRooms[dealId];
      }
    });

    // Remove from user tracking
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

module.exports = { app, io, server, getReceiverSocketId };
