const jwt = require('jsonwebtoken');
const redis = require('../config/redisConfig'); // Import Redis configuration

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Check Redis session before continuing
    const redisSessionKey = `session:${decoded.userId}`;
    const session = await redis.get(redisSessionKey);

    if (!session) {
      return res.status(401).json({ message: "Session expired or not found" });
    }

    // If session exists, set user information in the request
    const userSession = JSON.parse(session); 
    req.userId = userSession.userId;
    req.role = userSession.role;  // Extracting user role from Redis session

    next(); // Proceed to the next middleware or controller
  } catch (error) {
    console.error("JWT Verification or Redis Error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = isAuthenticated;
