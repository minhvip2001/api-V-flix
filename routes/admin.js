const express = require("express");
const Admin = require("../models/Admin");
const Router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authAdmin = require("../middlewares/authAdmin");
const Category = require("../models/Category");
const User = require("../models/User");
const Film = require("../models/Film");
const cloudinary = require("../utils/cloudinary");

// @route GET amount for each documents
// @desc Get Amount For Each Documents
// @access Private
Router.get("/amount", authAdmin, async (req, res) => {
  const amountCategories = await Category.countDocuments();
  const amountFilms = await Film.countDocuments({ softDelete: false });
  const amountUsers = await User.countDocuments();
  res.json({
    categories: amountCategories,
    films: amountFilms,
    users: amountUsers,
  });
});

// @route GET Auth
// @desc Get Admin Data
// @access Private
Router.get("/", authAdmin, (req, res) => {
  Admin.findById(req.admin.id)
    .select("-password -lastChangePw")
    .then((admin) => res.json(admin));
});

// @route POST Auth
// @desc Auth Admin
// @access Public
Router.post("/auth", async (req, res) => {
  try {
    const { loginID, password } = req.body;

    // Simple validation
    if (!loginID || !password) {
      return res.status(400).json({ msg: "Vui lòng điền tất cả ô trống" });
    }
    // Check for existing admin
    const adminExisting = await Admin.findOne({ loginID });
    if (!adminExisting) {
      return res.status(400).json({ msg: "Admin này không tồn tại" });
    }
    const comparePassword = await bcrypt.compare(
      password,
      adminExisting.password
    );
    if (!comparePassword) {
      return res.status(400).json({ msg: "Mật khẩu không đúng" });
    }
    jwt.sign(
      { id: adminExisting.id },
      process.env.JWT_SECRET,
      { expiresIn: 3600 * 24 },
      (err, token) => {
        if (err) throw err;
        if (!req.signedCookies.token) {
          res.cookie("tokenAdmin", token, {
            maxAge: 3600 * 24 * 1000,
            signed: true,
            httpOnly: true,
            sameSite: "none",
            secure: true,
          });
        }
        res.json({
          _id: adminExisting.id,
          loginID: adminExisting.loginID,
          imageAdmin: adminExisting.imageAdmin,
        });
      }
    );
  } catch (err) {
    console.log(err);
  }
});

// @route GET Auth
// @desc Logout admin
// @access Private
Router.get("/deleteCookie", (req, res) => {
  res
    .status(202)
    .clearCookie("tokenAdmin", {
      sameSite: "none",
      secure: true,
    })
    .json({
      msg: "Logout success",
    });
});

// @route PATCH User at AdminPage
// @desc Change Password
// @access Private
Router.patch("/changePw/:id", authAdmin, async (req, res) => {
  try {
    const { newPassword, passwordAdmin } = req.body;
    const admin = await Admin.find();

    const comparePassword = await bcrypt.compare(
      passwordAdmin,
      admin[0].password
    );
    if (!comparePassword) {
      return res.status(400).json({ msg: "Mật khẩu admin không đúng" });
    }
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newPassword, salt, async (err, hash) => {
        await User.findByIdAndUpdate(
          req.params.id,
          { userPassword: hash, lastChangePw: Date.now() },
          {
            new: true,
          }
        );
        res.json("Change password success");
      });
    });
  } catch (err) {
    console.log(err);
  }
});

// @route PATCH Admin
// @desc Update Image Admin
// @access Private
Router.patch("/", authAdmin, async (req, res) => {
  try {
    const { imageAdmin, isUpload } = req.body;
    let imageUpdate;
    if (isUpload) {
      const response = await cloudinary.uploader.upload(imageAdmin, {
        upload_preset: "vmoflix_project",
        format: "webp",
      });

      imageUpdate = response.secure_url;
    } else {
      imageUpdate = imageAdmin;
    }
    const admin = await Admin.find();
    const updatedAdmin = await Admin.findOneAndUpdate(
      admin[0].id,
      { imageAdmin: imageUpdate },
      {
        new: true,
      }
    ).select("-password -lastChangePw");
    res.json(updatedAdmin);
  } catch (err) {
    console.log(err);
  }
});

// @route PATCH Admin
// @desc Change Password Admin
// @access Private
Router.patch("/changePwAdmin", authAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const admin = await Admin.find();

    const comparePassword = await bcrypt.compare(
      oldPassword,
      admin[0].password
    );
    if (!comparePassword) {
      return res.status(400).json({ msg: "Mật khẩu cũ không đúng" });
    }
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newPassword, salt, async (err, hash) => {
        await Admin.findByIdAndUpdate(
          admin[0].id,
          { password: hash, lastChangePw: Date.now() },
          {
            new: true,
          }
        );
        res.json("Change password success");
      });
    });
  } catch (err) {
    console.log(err);
  }
});

module.exports = Router;
