// config/redis.js
const Redis = require("ioredis");
require("dotenv").config();
let redisClient;

if (process.env.REDIS_URL) {
  // For production or cloud-hosted Redis
  redisClient = new Redis(process.env.REDIS_URL, {
    tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  });
} else {
  // Local development
  redisClient = new Redis({
    host: "127.0.0.1",
    port: 6379,
  });
}

redisClient.on("connect", () => {
  console.log("✅ Redis connected");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

module.exports = redisClient;
