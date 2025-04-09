const Deal = require("../models/dealModel");
const { io, getReceiverSocketId } = require("../socket/socket");
const redis = require("../config/redisConfig");

const DEAL_CACHE_PREFIX = "deal:";

// 🔧 Cache invalidation helper
const invalidateDealCache = async (dealId, buyerId, sellerId) => {
  await Promise.all([
    redis.del(`${DEAL_CACHE_PREFIX}${dealId}`),
    redis.del(`${DEAL_CACHE_PREFIX}user:${buyerId}:${sellerId}`),
    redis.del(`${DEAL_CACHE_PREFIX}user:${sellerId}:${buyerId}`),
  ]);
};

// ✅ Create a new deal
const createDeal = async (req, res) => {
  try {
    const { title, description, price, sellerId } = req.body;
    const buyerId = req.userId;

    if (!title || !description || !price || !sellerId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const deal = await Deal.create({
      title,
      description,
      price,
      buyer: buyerId,
      seller: sellerId,
      status: "Pending",
    });

    await invalidateDealCache(deal._id, buyerId, sellerId);

    // Optionally cache the created deal
    await redis.set(
      `${DEAL_CACHE_PREFIX}${deal._id}`,
      JSON.stringify(deal),
      "EX",
      60 * 5
    );

    const sellerSocket = getReceiverSocketId(sellerId);
    if (sellerSocket) {
      io.to(sellerSocket).emit("newDeal", deal);
    }

    res
      .status(201)
      .json({ success: true, message: "Deal created successfully", deal });
  } catch (error) {
    console.error("Error creating deal:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get deal by userId (pair)
const getDealByUserId = async (req, res) => {
  try {
    const userId = req.userId;
    const otherId = req.params.id;

    if (!otherId) {
      return res.status(400).json({ message: "Other user ID is required" });
    }

    const cacheKey = `${DEAL_CACHE_PREFIX}user:${userId}:${otherId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      // console.log("🔁 Redis hit:", cacheKey);
      return res.status(200).json(JSON.parse(cached));
    }

    const deal = await Deal.findOne({
      $or: [
        { buyer: userId, seller: otherId },
        { buyer: otherId, seller: userId },
      ],
    });

    if (!deal) {
      return res.status(404).json({ message: "No deal found between users" });
    }

    await redis.set(cacheKey, JSON.stringify(deal), "EX", 60 * 5);
    res.status(200).json(deal);
  } catch (error) {
    console.error("Error fetching deal:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Get deal by dealId
const getDealById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `${DEAL_CACHE_PREFIX}${id}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      // console.log("🔁 Redis hit:", cacheKey);
      return res.status(200).json(JSON.parse(cached));
    }

    const deal = await Deal.findById(id);
    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    await redis.set(cacheKey, JSON.stringify(deal), "EX", 60 * 5);
    res.status(200).json(deal);
  } catch (error) {
    console.error("Error fetching deal:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update deal status (accept/reject/cancel/complete)
const updateDealStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    const deal = await Deal.findById(id);
    if (!deal) return res.status(404).json({ message: "Deal not found" });

    // Permission checks
    if (
      (status === "Accepted" || status === "Rejected") &&
      userId !== deal.seller.toString()
    ) {
      return res.status(403).json({ message: "Only seller can accept/reject" });
    }

    if (
      (status === "Cancelled" || status === "Completed") &&
      userId !== deal.buyer.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Only buyer can cancel/complete" });
    }

    deal.status = status === "Accepted" ? "In Progress" : status;
    await deal.save();

    await invalidateDealCache(id, deal.buyer, deal.seller);

    const buyerSocket = getReceiverSocketId(deal.buyer);
    const sellerSocket = getReceiverSocketId(deal.seller);

    if (buyerSocket) io.to(buyerSocket).emit("deal-status-updated", deal);
    if (sellerSocket) io.to(sellerSocket).emit("deal-status-updated", deal);

    res
      .status(200)
      .json({ success: true, message: "Deal status updated", deal });
  } catch (error) {
    console.error("Error updating deal status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Negotiate price
const negotiatePrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { newTitle, newDescription, newPrice } = req.body;
    const userId = req.userId;

    const deal = await Deal.findById(id);
    if (!deal) return res.status(404).json({ message: "Deal not found" });

    if (userId !== deal.buyer.toString() && userId !== deal.seller.toString()) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    if (newPrice !== undefined) deal.price = newPrice;
    if (newTitle !== undefined) deal.title = newTitle;
    if (newDescription !== undefined) deal.description = newDescription;
    await deal.save();

    await invalidateDealCache(id, deal.buyer, deal.seller);

    const buyerSocket = getReceiverSocketId(deal.buyer);
    const sellerSocket = getReceiverSocketId(deal.seller);

    if (buyerSocket) io.to(buyerSocket).emit("price-negotiated", deal);
    if (sellerSocket) io.to(sellerSocket).emit("price-negotiated", deal);

    res.status(200).json({ success: true, message: "Price updated", deal });
  } catch (error) {
    console.error("Error negotiating price:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createDeal,
  getDealById,
  getDealByUserId,
  updateDealStatus,
  negotiatePrice,
};
