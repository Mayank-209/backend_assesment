const express = require("express");
const router = express.Router();
const { upload } = require("../MiddleWare/upload");
const { uploadDocument } = require("../controllers/uploadController");
const isAuthenticated = require("../MiddleWare/isAuthenticated"); // assuming you have auth

// POST /api/v1/document/upload
router.post("/upload/:id", isAuthenticated, upload.single("file"), uploadDocument);

module.exports = router;
