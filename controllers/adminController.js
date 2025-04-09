const Deal = require('../models/dealModel');
const User = require('../models/userModel');
const Message = require('../models/messageModel');

// GET /api/admin/deal-stats
const getDealStats = async (req, res) => {
  try {
    const totalDeals = await Deal.countDocuments();
    const completedDeals = await Deal.countDocuments({ status: "Completed" });
    const pendingDeals = await Deal.countDocuments({ status: "Pending" });
    const inProgressDeals = await Deal.countDocuments({ status: "In Progress" });
    const cancelledDeals = await Deal.countDocuments({ status: "Cancelled" });

    const totalRevenue = await Deal.aggregate([
      { $match: { status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);

    res.status(200).json({
      totalDeals,
      completedDeals,
      pendingDeals,
      inProgressDeals,
      cancelledDeals,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error("Error fetching deal stats:", error);
    res.status(500).json({ message: "Failed to fetch deal stats" });
  }
};

// GET /api/admin/user-engagement
const getUserEngagement = async (req, res) => {
  try {
    const messages = await Message.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "senderId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $group: {
          _id: "$user.role",
          count: { $sum: 1 }
        }
      }
    ]);

    let buyerMessages = 0;
    let sellerMessages = 0;

    messages.forEach((entry) => {
      if (entry._id === "buyer") buyerMessages = entry.count;
      else if (entry._id === "seller") sellerMessages = entry.count;
    });

    res.status(200).json({ buyerMessages, sellerMessages });
  } catch (error) {
    console.error("Error fetching user engagement:", error);
    res.status(500).json({ message: "Failed to fetch user engagement" });
  }
};


// GET /api/admin/top-users
const getTopUsers = async (req, res) => {
  try {
    const topBuyers = await Deal.aggregate([
      { $group: { _id: "$buyer", dealCount: { $sum: 1 } } },
      { $sort: { dealCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          name: "$user.name",
          role: "$user.role",
          dealCount: 1
        }
      }
    ]);

    const topSellers = await Deal.aggregate([
      { $group: { _id: "$seller", dealCount: { $sum: 1 } } },
      { $sort: { dealCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          name: "$user.name",
          role: "$user.role",
          dealCount: 1
        }
      }
    ]);

    res.status(200).json({ topBuyers, topSellers });
  } catch (error) {
    console.error("Error fetching top users:", error);
    res.status(500).json({ message: "Failed to fetch top users" });
  }
};

module.exports = {
  getDealStats,
  getUserEngagement,
  getTopUsers,
};
