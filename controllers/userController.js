const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // Ensure correct path
const redis = require("../config/redisConfig");

// REGISTER USER
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Default Profile Picture Based on Gender
    const malePP = `https://avatar.iran.liara.run/public/boy?username=${email}`;
    const femalePP = `https://avatar.iran.liara.run/public/girl?username=${email}`;
    const profilePic = `https://avatar.iran.liara.run/public/boy?username=${email}`;
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      profilePic,
      role, // Buyer or Seller
    });

    return res.status(201).json({ message: "Account Created Successfully", success: true });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// LOGIN USER
// LOGIN USER
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Token Payload
    const tokenData = {
      userId: user._id,
      role: user.role,
    };

    // Generate JWT Token
    const token = jwt.sign(tokenData, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d",
    });

    // Store session in Redis (optional — but you already have it)
    const redisSessionKey = `session:${user._id}`;
    await redis.set(
      redisSessionKey,
      JSON.stringify({ userId: user._id, role: user.role }),
      "EX",
      60 * 60 * 24
    );

    // ✅ Send token in response body (not cookie)
    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        profilePic: user.profilePic,
        role: user.role,
      },
      message: "Logged in Successfully",
      success: true,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};


// LOGOUT USER
const logout = async (req, res) => {
  try {
    const redisSessionKey = `session:${req.userId}`;
    await redis.del(redisSessionKey);

    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// GET OTHER USERS (excluding logged-in user)
const getOtherUsers = async (req, res) => {
  try {
    const loggedInUserId = req.userId;

    // Get the current user's role
    const currentUser = await User.findById(loggedInUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const oppositeRole = currentUser.role === "buyer" ? "seller" : "buyer";

    // Fetch only users with opposite role
    const otherUsers = await User.find({
      _id: { $ne: loggedInUserId },
      role: oppositeRole,
    }).select("-password");

    return res.status(200).json(otherUsers);
  } catch (error) {
    console.error("Fetch Users Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  register,
  login,
  logout,
  getOtherUsers,
};
