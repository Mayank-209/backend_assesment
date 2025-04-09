const express = require("express");
const { sendMessage, getMessages } = require("../controllers/messageController");
const isAuthenticated = require("../MiddleWare/isAuthenticated");

const router = express.Router();

router.post("/send/:id",isAuthenticated, sendMessage);
router.get("/:id",isAuthenticated, getMessages);

module.exports = router;
