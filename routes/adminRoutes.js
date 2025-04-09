const express = require("express");
const router = express.Router();

const {
  getDealStats,
  getUserEngagement,
  getTopUsers,
} = require("../controllers/adminController");

const  isAuthenticated  = require("../MiddleWare/isAuthenticated");
const  isAdmin  = require("../MiddleWare/isAdmin");

// All routes are protected and only accessible by admin users
router.get("/dealstats", isAuthenticated, isAdmin, getDealStats);
router.get("/userengagement", isAuthenticated, isAdmin, getUserEngagement);
router.get("/topusers", isAuthenticated, isAdmin, getTopUsers);

module.exports = router;
