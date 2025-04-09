const jwt = require("jsonwebtoken");
const redis = require("../config/redisConfig"); // Import Redis configuration

const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Extract token from Bearer token
    console.log("JWT Token:", token);

    // Verify JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Check Redis session
    const redisSessionKey = `session:${decoded.userId}`;
    const session = await redis.get(redisSessionKey);

    if (!session) {
      return res.status(401).json({ message: "Session expired or not found" });
    }

    // Add user info to request object
    const userSession = JSON.parse(session);
    req.userId = userSession.userId;
    req.role = userSession.role;

    next(); // Continue to the next middleware/route
  } catch (error) {
    console.error("JWT Verification or Redis Error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = isAuthenticated;
