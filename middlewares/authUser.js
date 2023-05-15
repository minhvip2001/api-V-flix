const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authUser = async (req, res, next) => {
  try {
    const token = req.signedCookies.tokenUser;
    if (!token) {
      return res
        .status(401)
        .json({ msg: "Không có token nào được định nghĩa" });
    }
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, lastChangePw } = decoded;
    // const user = await User.findById(id);
    // if (user.lastChangePw.toString() !== lastChangePw) {
    //   return res
    //     .status(401)
    //     .clearCookie("tokenUser", {
    //       sameSite: "none",
    //       secure: true,
    //     })
    //     .json({
    //       msg: "Mật khẩu đã bị thay đổi",
    //     });
    // }

    // Add admin from payload
    req.userId = id;
    next();
  } catch (err) {
    res.status(400).json({ msg: "Token không đúng" });
  }
};

module.exports = authUser;
