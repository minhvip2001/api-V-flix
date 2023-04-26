const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  genre: {
    type: String,
    required: true,
  },
  vn: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Category = mongoose.model("Category", CategorySchema);
