const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");
const { getReceiverSocketId, io } = require("../socket/socket");
const redis = require("../config/redisConfig");

// 🔧 Utility: Consistent Redis key for a conversation between 2 users
const getMessagesCacheKey = (userA, userB) => {
  const [u1, u2] = [userA.toString(), userB.toString()].sort(); // Lexical sort
  return `messages:${u1}:${u2}`;
};

// ✅ Send Message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const receiverId = req.params.id;
    const { content, type, fileType, dealId } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    // Create and save message
    const newMessage = await Message.create({
      senderId,
      receiverId,
      content,
      type: type || "text",
      fileType,
      deal: dealId || null,
      timestamp: new Date(),
    });

    conversation.messages.push(newMessage._id);
    await conversation.save();

    // Invalidate Redis cache for this conversation
    const cacheKey = getMessagesCacheKey(senderId, receiverId);
    await redis.del(cacheKey);

    // Emit real-time message to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json({ newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Get Messages Between Two Users (with Redis caching)
exports.getMessages = async (req, res) => {
  try {
    const receiverId = req.params.id;
    const senderId = req.userId;
    const cacheKey = getMessagesCacheKey(senderId, receiverId);

    // Try Redis first
    const cachedMessages = await redis.get(cacheKey);
    if (cachedMessages) {
      // console.log("📥 Redis hit:", cacheKey);
      return res.status(200).json(JSON.parse(cachedMessages));
    }

    // Fallback to DB
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate("messages");

    const messages = conversation?.messages || [];

    // Cache messages for future requests
    await redis.set(cacheKey, JSON.stringify(messages), "EX", 60 * 5);

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
