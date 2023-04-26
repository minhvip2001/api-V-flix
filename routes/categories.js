const express = require("express");
const authAdmin = require("../middlewares/authAdmin");
const Router = express.Router();
const Category = require("../models/Category");

// @route GET categories
// @desc Get All Categories
// @access Public
Router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort("-date");
    res.json(categories);
  } catch (err) {
    console.log(err);
  }
});

// @route GET amount categories
// @desc Get Amount Categories
// @access Private
Router.get("/amount", authAdmin, async (req, res) => {
  const amount = await Category.countDocuments();
  res.json(amount);
});

// @route POST category
// @desc Create Category
// @access Private
Router.post("/", authAdmin, async (req, res) => {
  try {
    const { genre, vn } = req.body;

    if (!genre || !vn) {
      return res.status(400).json({
        msg: "Vui lòng điền vào ô trống",
      });
    }

    const newCategory = new Category({
      genre,
      vn,
    });
    const category = await newCategory.save();
    res.json(category);
  } catch (err) {
    console.log(err);
  }
});

module.exports = Router;
