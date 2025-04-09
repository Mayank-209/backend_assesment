const express = require("express");
const { register, login, logout, getOtherUsers } = require("../controllers/userController");
const isAuthenticated= require("../MiddleWare/isAuthenticated")

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/users",isAuthenticated, getOtherUsers);

module.exports = router;
