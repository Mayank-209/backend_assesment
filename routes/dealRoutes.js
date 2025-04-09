const express = require("express");
const { createDeal, getDealById, updateDealStatus, negotiatePrice, getDealByUserId } = require("../controllers/dealController");
const isAuthenticated = require("../MiddleWare/isAuthenticated");

const router = express.Router();

router.post("/create",isAuthenticated, createDeal);
router.get("/:id", getDealById);
router.patch("/:id/status",isAuthenticated, updateDealStatus);
router.post("/:id/negotiate",isAuthenticated, negotiatePrice);
router.get("/user/:id",isAuthenticated,getDealByUserId)

module.exports = router;
