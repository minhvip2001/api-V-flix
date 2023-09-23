const express = require("express");
const User = require("../models/User");
const Router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { default: fetch } = require("node-fetch");
const authUser = require("../middlewares/authUser");
const client = new OAuth2Client(
  "751886179657-ivb1fuvbm0dfo1gqh8i7lifsped1b4r3.apps.googleusercontent.com"
);
const cloudinary = require("../utils/cloudinary");
const authAdmin = require("../middlewares/authAdmin");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

// @route GET Users
// @desc Get Filter Users
// @access Private
Router.get("/filter", authAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    const filter = q
      ? [{ $text: { $search: q } }, { score: { $meta: "textScore" } }]
      : [{}];
    const users = await User.find(...filter)
      .select("-userPassword")
      .sort(q ? { score: { $meta: "textScore" } } : "-date");
    res.json(users);
  } catch (err) {
    console.log(err);
  }
});

// @route GET Amount Users
// @desc Get Amount Users
// @access Private
Router.get("/amount", authAdmin, async (req, res) => {
  const amount = await User.countDocuments();
  res.json(amount);
});

// @route GET Auth
// @desc Get User Data
// @access Private
Router.get("/", authUser, async (req, res) => {
  const user = await User.findById(req.userId).select(
    "-userPassword -lastChangePw -isActive"
  );
  res.json(user);
});

// @route POST Auth
// @desc Auth User
// @access Public
Router.post("/auth", async (req, res) => {
  try {
    const { userEmail, userPassword } = req.body;
    console.log(req.body);

    // Simple validation
    if (!userEmail || !userPassword) {
      return res.status(400).json({ msg: "Vui lòng điền tất cả ô trống" });
    }
    // Check for existing user
    const userExisting = await User.findOne({ userEmail });
    if (!userExisting) {
      return res.status(400).json({ msg: "Người dùng này không tồn tại" });
    }
    if (!userExisting.isActive) {
      return res
        .status(400)
        .json({ msg: "Tài khoản bị khóa liên hệ admin để mở" });
    }
    const comparePassword = await bcrypt.compare(
      userPassword,
      userExisting.userPassword
    );
    if (!comparePassword) {
      return res.status(400).json({ msg: "Mật khẩu không đúng" });
    }
    jwt.sign(
      {
        id: userExisting.id,
        userName: userExisting.userName,
        userEmail: userExisting.userEmail,
        lastChangePw: userExisting.lastChangePw.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: 3600 * 24 },
      (err, token) => {
        if (err) throw err;
        res.json({
          _id: userExisting.id,
          userName: userExisting.userName,
          userEmail: userExisting.userEmail,
          imageUser: userExisting.imageUser,
          history: userExisting.history,
          token: token,
        });
      }
    );
  } catch (err) {
    console.log(err);
  }
});

// @route POST Auth Google
// @desc Auth User Google
// @access Public
Router.post("/googleLogin", async (req, res) => {
  try {
    const { tokenId } = req.body;

    const response = await client.verifyIdToken({
      idToken: tokenId,
      audience:
        "751886179657-ivb1fuvbm0dfo1gqh8i7lifsped1b4r3.apps.googleusercontent.com",
    });
    const { email_verified, name, email, picture } = response.payload;
    if (email_verified) {
      const userExisting = await User.findOne({ userEmail: email });
      if (userExisting) {
        if (!userExisting.isActive) {
          return res
            .status(400)
            .json({ msg: "Tài khoản bị khóa liên hệ admin để mở" });
        }
        jwt.sign(
          {
            id: userExisting.id,
            lastChangePw: userExisting.lastChangePw.toString(),
          },
          process.env.JWT_SECRET,
          { expiresIn: 3600 * 24 },
          (err, token) => {
            if (err) throw err;
            if (!req.signedCookies.tokenUser) {
              res.cookie("tokenUser", token, {
                maxAge: 3600 * 24 * 1000,
                signed: true,
                httpOnly: true,
                sameSite: "none",
                secure: true,
              });
            }
            const { _id, userName, imageUser, userEmail, history } =
              userExisting;
            res.json({
              _id,
              userName,
              imageUser,
              userEmail,
              history,
            });
          }
        );
      } else {
        const newUser = new User({
          userName: name,
          userEmail: email,
          userPassword: "",
          imageUser: picture,
        });
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(email, salt, (err, hash) => {
            newUser.userPassword = hash;
            newUser.save().then((user) => {
              jwt.sign(
                { id: user.id, lastChangePw: user.lastChangePw.toString() },
                process.env.JWT_SECRET,
                {
                  expiresIn: 3600,
                },
                (err, token) => {
                  if (!req.signedCookies.tokenUser) {
                    res.cookie("tokenUser", token, {
                      maxAge: 3600 * 24 * 1000,
                      signed: true,
                      httpOnly: true,
                      sameSite: "none",
                      secure: true,
                    });
                  }
                  res.json({
                    _id: user.id,
                    userName: user.userName,
                    userEmail: user.userEmail,
                    imageUser: user.imageUser,
                    history: user.history,
                  });
                }
              );
            });
          });
        });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

// @route POST Auth Facebook
// @desc Auth User Facebook
// @access Public
Router.post("/facebookLogin", async (req, res) => {
  try {
    const { userID, accessToken } = req.body;
    let urlGraphFacebook = `https://graph.facebook.com/v10.0/${userID}/?fields=id,name,email,picture&access_token=${accessToken}`;
    const response1 = await fetch(urlGraphFacebook, {
      method: "GET",
    });
    const response2 = await response1.json();
    const { email, name, picture } = response2;
    const userExisting = await User.findOne({ userEmail: email });
    if (userExisting) {
      if (!userExisting.isActive) {
        return res
          .status(400)
          .json({ msg: "Tài khoản bị khóa liên hệ admin để mở" });
      }
      jwt.sign(
        {
          id: userExisting.id,
          lastChangePw: userExisting.lastChangePw.toString(),
        },
        process.env.JWT_SECRET,
        { expiresIn: 3600 * 24 },
        (err, token) => {
          if (err) throw err;
          if (!req.signedCookies.tokenUser) {
            res.cookie("tokenUser", token, {
              maxAge: 3600 * 24 * 1000,
              signed: true,
              httpOnly: true,
              sameSite: "none",
              secure: true,
            });
          }
          const { _id, userName, imageUser, userEmail, history } = userExisting;
          res.json({
            _id,
            userName,
            imageUser,
            userEmail,
            history,
          });
        }
      );
    } else {
      const newUser = new User({
        userName: name,
        userEmail: email,
        userPassword: "",
        imageUser: picture.data.url,
      });
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(email, salt, (err, hash) => {
          newUser.userPassword = hash;
          newUser.save().then((user) => {
            jwt.sign(
              { id: user.id, lastChangePw: user.lastChangePw.toString() },
              process.env.JWT_SECRET,
              {
                expiresIn: 3600,
              },
              (err, token) => {
                if (!req.signedCookies.tokenUser) {
                  res.cookie("tokenUser", token, {
                    maxAge: 3600 * 24 * 1000,
                    signed: true,
                    httpOnly: true,
                    sameSite: "none",
                    secure: true,
                  });
                }
                res.json({
                  _id: user.id,
                  userName: user.userName,
                  userEmail: user.userEmail,
                  imageUser: user.imageUser,
                  history: user.history,
                });
              }
            );
          });
        });
      });
    }
  } catch (err) {
    console.log(err);
  }
});

// @route POST Register
// @desc Register No Response
// @access Private
Router.post("/registerNoRes", async (req, res) => {
  try {
    const { userName, userEmail, userPassword } = req.body;

    // Simple validation
    if (!userName || !userEmail || !userPassword) {
      return res.status(400).json({ msg: "Vui lòng điền tất cả ô trống" });
    }

    // Check for existing user
    const userExisting = await User.findOne({ userEmail });
    if (userExisting) {
      return res.status(400).json({ msg: "Email này đã tồn tại" });
    }

    const newUser = new User({
      userName,
      userEmail,
      userPassword,
    });

    // Create salt & hash
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(userPassword, salt, (err, hash) => {
        newUser.userPassword = hash;
        newUser.save();
      });
    });
  } catch (err) {
    console.log(err);
  }
});

Router.post("/register", async (req, res) => {
  try {
    const { userName, userEmail, userPassword } = req.body;

    // Simple validation
    if (!userName || !userEmail || !userPassword) {
      return res.status(400).json({ msg: "Vui lòng điền tất cả ô trống" });
    }

    // Check for existing user
    const userExisting = await User.findOne({ userEmail });
    if (userExisting) {
      return res.status(400).json({ msg: "Email này đã tồn tại" });
    }

    const newUser = new User({
      userName,
      userEmail,
      userPassword,
    });

    // Create salt & hash
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(userPassword, salt, (err, hash) => {
        newUser.userPassword = hash;
        newUser.save().then((user) => {
          jwt.sign(
            {
              id: user.id,
              lastChangePw: user.lastChangePw.toString(),
              userName: user.userName,
            },
            process.env.JWT_SECRET,
            {
              expiresIn: 3600,
            },
            (err, token) => {
              if (!req.signedCookies.token) {
                res.cookie("tokenUser", token, {
                  maxAge: 3600 * 24 * 1000,
                  signed: true,
                  httpOnly: true,
                  sameSite: "none",
                  secure: true,
                });
              }
              res.json({
                _id: user.id,
                userName: user.userName,
                userEmail: user.userEmail,
                imageUser: user.imageUser,
                history: user.history,
                token: token,
              });
            }
          );
        });
      });
    });
  } catch (err) {
    console.log(err);
  }
});

// @route PATCH User
// @desc Forgot Password
// @access Private
Router.patch("/forgotPassword", async (req, res) => {
  try {
    const { email } = req.body;
    const userExisting = await User.findOne({ userEmail: email });

    if (!userExisting) {
      return res
        .status(400)
        .json({ msg: "Người dùng với email này không tồn tại" });
    }
    const token = jwt.sign(
      {
        id: userExisting.id,
        lastChangePw: userExisting.lastChangePw.toString(),
      },
      process.env.RESET_PASSWORD_KEY,
      { expiresIn: 1200 }
    );

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    const url = `${process.env.NODE_ENV !== 'production' ? "http://localhost:5000" : process.env.LINK_RESET_PASSWORD}/reset-password/${token}`;
    var mainOptions = {
      from: "VMOflix Support",
      to: email,
      subject: "Yêu cầu khôi phục mật khẩu",
      html: `
        <div style='min-width: 100%; font-family: Helvetica,Arial,sans-serif; color: #333;'>
          <div style='width: 500px; border: 1px solid #ccc; border-radius: 8px; margin: 32px auto 0; padding: 40px'>
            <img
            style='width: 200px; display: block; margin: auto' src='https://res.cloudinary.com/nghiemduong2000/image/upload/v1618458158/VMOflix%20Project/VMOflix%20-%20base/VMOFLIX-02-02_bpjidv.png' alt="logo">
            <h2 style='font-size: 30px; line-height: 30px; margin: 50px 0  0; text-align:center'>Xin chào!</h2>
            <p style='text-align: center; margin: 20px 0 0; font-size: 14px'>Bạn nhận được email này vì chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p style='text-align: center; margin-bottom: 30px; font-size: 14px'><strong>Nếu bạn không làm điều này,</strong> vui lòng bỏ qua email này và tuyệt đối không cung cấp nội dung email này cho người khác.</p>
            <p style='text-align: center; font-size: 14px'>Nhấn vào nút Đặt lại mật khẩu dưới đây để đặt mật khẩu mới</p>
            <a href=${url} target="_blank" style='text-decoration: none; display: block; text-align: center; padding: 14px 0; font-size: 20px; font-weight: bold; width: 100%; border-radius: 5px; border: none; background-color: rgb(229,9,20); color: white'>Đặt lại mật khẩu</a>
            <div style='padding: 20px 10px; background-color: #ddd; border-radius: 5px; margin-top: 40px'>
              <p style='margin: 0; text-align: center; margin-bottom: 5px; font-size: 14px'>Nút đặt lại mật khẩu không hoạt động? Bạn có thể sao chép liên kết sau và dán vào trình duyệt:</p>
              <a href=${url} target="_blank" style='text-decoration: none; color: rgb(229,9,20); display: block; text-align: center; font-size: 14px'>${url}</a>
            </div>
          </div>
        </div>
      `,
    };

    await User.findByIdAndUpdate(userExisting.id, { resetLink: token });

    transporter.sendMail(mainOptions, function (err, info) {
      if (err) {
        console.log(err);
        return res.status(400).json({
          msg: err.message,
        });
      } else {
        console.log("Message sent: " + info.response);
        return res.json({
          msg: "Email đã được gửi, vui lòng làm theo hướng dẫn",
        });
      }
    });
  } catch (err) {
    console.log(err);
  }
});

// @route PATCH User
// @desc Reset Password
// @access Private
Router.patch("/resetPassword", async (req, res) => {
  try {
    const { resetLink, newPassword } = req.body;

    if (resetLink) {
      jwt.verify(
        resetLink,
        process.env.RESET_PASSWORD_KEY,
        (error, decoded) => {
          if (error) {
            return res.status(401).json({
              msg: "Incorrect token or it is expired",
            });
          }
          User.findOne({ resetLink }, (err, user) => {
            if (err || !user) {
              return res
                .status(400)
                .json({ msg: "Mã khôi phục mật khẩu không tồn tại" });
            }
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(newPassword, salt, async (err, hash) => {
                await User.findByIdAndUpdate(
                  user.id,
                  {
                    userPassword: hash,
                    lastChangePw: Date.now(),
                    resetLink: "",
                  },
                  {
                    new: true,
                  }
                );
                const transporter = nodemailer.createTransport({
                  host: "smtp.gmail.com",
                  port: 465,
                  secure: true,
                  auth: {
                    user: process.env.MAIL_USERNAME,
                    pass: process.env.MAIL_PASSWORD,
                  },
                  tls: {
                    rejectUnauthorized: false,
                  },
                });
                const currentDate = new Date();
                var mainOptions = {
                  from: "VMOflix Support",
                  to: user.userEmail,
                  subject: "Mật khẩu đã được thay đổi",
                  html: `
                  <div style='min-width: 100%; font-family: Helvetica,Arial,sans-serif; color: #333;'>
                    <div style='width: 500px; border: 1px solid #ccc; border-radius: 8px; margin: 32px auto 0; padding: 40px'>
                      <img
                      style='width: 200px; display: block; margin: auto' src='https://res.cloudinary.com/nghiemduong2000/image/upload/v1618458158/VMOflix%20Project/VMOflix%20-%20base/VMOFLIX-02-02_bpjidv.png' alt="logo">
                      <h2 style='font-size: 30px; line-height: 30px; margin: 50px 0  0; text-align:center'>Xin chào!</h2>
                      <p style='text-align: center; margin: 20px 0 0; font-size: 14px'>
                      Mật khẩu
                      <a href="https://vmoflix-vn.web.app/" style="color: rgb(229,9,20); text-decoration: none">VMOflix-vn.web.app</a>
                      của bạn đã được thay đổi vào ${`ngày ${currentDate.getDate()} tháng ${currentDate.getMonth()} năm ${currentDate.getFullYear()} lúc ${currentDate.getHours()}:${currentDate.getMinutes()} (UTC/GMT +0 hours)`}</p>
                      <p style='text-align: center; margin-bottom: 30px; font-size: 14px'><strong>Nếu bạn làm điều này,</strong> bạn có thể bỏ qua email này một cách an toàn.</p>
                      <p style='text-align: center; margin-bottom: 30px; font-size: 14px'><strong>Nếu bạn không làm điều này,</strong> vui lòng <a href="mailto:vmoflix.sp@gmail.com" style="text-decoration: none; color: rgb(229,9,20)">liên hệ ngay với chúng tôi</a> để được hỗ trợ kịp thời.</p>
                    </div>
                  </div>
                `,
                };
                transporter.sendMail(mainOptions, function (err, info) {
                  if (err) {
                    console.log(err);
                    return res.status(400).json({
                      msg: err.message,
                    });
                  }
                });
                res.json("Change password success");
              });
            });
          });
        }
      );
    } else {
      return res.status(400).json({ msg: "Authentication error!!!" });
    }
  } catch (err) {
    console.log(err);
  }
});

// @route PATCH User
// @desc Update User
// @access Private
Router.patch("/:id", async (req, res) => {
  try {
    const { userName, imageUser, history, isActive, isUpload } = req.body;
    if (imageUser) {
      let updateUser;
      if (isUpload) {
        const response = await cloudinary.uploader.upload(imageUser, {
          upload_preset: "vmoflix_project",
          format: "webp",
        });

        updateUser = {
          userName,
          imageUser: response.secure_url,
        };
      } else {
        updateUser = {
          userName,
          imageUser,
        };
      }
      for (let prop in updateUser) {
        if (!updateUser[prop]) {
          delete updateUser[prop];
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateUser,
        {
          new: true,
        }
      ).select("-userPassword -lastChangePw -isActive");
      res.json(updatedUser);
    } else {
      const updateUser = {
        userName,
        history,
        isActive,
      };
      for (let prop in updateUser) {
        if (typeof updateUser[prop] === "undefined") {
          delete updateUser[prop];
        }
      }
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateUser,
        { new: true }
      ).select("-userPassword -lastChangePw -isActive");
      res.json(updatedUser);
    }
  } catch (err) {
    console.log(err);
  }
});

// @route PATCH User
// @desc Change Password
// @access Private
Router.patch("/changePw/:id", authUser, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);

    const comparePassword = await bcrypt.compare(
      oldPassword,
      user.userPassword
    );
    if (!comparePassword) {
      return res.status(400).json({ msg: "Mật khẩu cũ không đúng" });
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

// @route GET Auth
// @desc Logout User
// @access Private
Router.get("/deleteCookie", (req, res) => {
  res
    .status(202)
    .clearCookie("tokenUser", {
      sameSite: "none",
      secure: true,
    })
    .json({
      msg: "Logout success",
    });
});

Router.post("/history", async (req, res) => {
    const token = req.signedCookies.tokenUser;
    if (!token) {
      return res.json({});
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    const episodeId = req.body.episodeId
    if (!mongoose.Types.ObjectId.isValid(episodeId)) {
      console.error(`Invalid episode ID: ${episodeId}`);
      return res.status(400).json({ error: `Invalid episode ID: ${episodeId}` });
  }
    const newEpisodeHistory = { date: Date.now(), episodeId: episodeId };
    user.history.unshift(newEpisodeHistory)
    await user.save();
    res.json({ "msg": `Add viewed episode ${episodeId} to history memory` });

});

module.exports = Router;
