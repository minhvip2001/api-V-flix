const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ msg: "Không có token nào được định nghĩa" });
    }
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, lastChangePw } = decoded;
    // Add admin from payload
    req.userId = id;
    const user = await User.findById(id).select('-userPassword -lastChangePw');
    req.user = user
    next();
  } catch (err) {
    res.status(400).json({ msg: "Token không đúng" });
  }
};

module.exports = authUser;
