const User = require('../models/userModel');

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId); // assumes req.userId is set via auth middleware
    console.log('====================================');
    console.log(user);
    console.log('====================================');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }
    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = isAdmin;
