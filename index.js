const express = require("express");
const dotenv = require("dotenv");
const connectdb = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const dealRoutes = require("./routes/dealRoutes"); 
const uploadRoutes=require("./routes/uploadRoutes")
const adminRoutes=require("./routes/adminRoutes")
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { app, server } = require("./socket/socket");

dotenv.config();

const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const corsOption = {
  origin: "http://localhost:3000",
  credentials: true,
};
app.use(cors(corsOption));

// Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/message", messageRoutes);
app.use("/api/v1/deal", dealRoutes);
app.use("/api/v1/document", uploadRoutes)
app.use("/api/v1/admin",adminRoutes)

server.listen(PORT, () => {
  connectdb();
  console.log(`🚀 Server running on port ${PORT}`);
});
