const express = require("express");
const Router = express.Router();
const upload = require("../utils/multer");

// @route GET Users
// @desc Get Filter Users
// @access Private
Router.post("/upload", async (req, res) => {
  try {
   upload(req, res,  () => {
       res.json(req.file);
    })
  } catch (err) {
    console.log(err);
  }
});

module.exports = Router;