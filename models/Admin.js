const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AdminSchema = new Schema({
  loginID: {
    type: String,
    required: true,
  },
  permission: {
    type: Boolean,
    default: true,
  },
  imageAdmin: {
    type: String,
    default:
      "https://res.cloudinary.com/nghiemduong2000/image/upload/v1620542467/VMOflix%20Project/VMOflix%20-%20base/1f41f01769219a40f837861852b1afb2_riafjw.webp",
  },
  password: {
    type: String,
    required: true,
  },
  lastChangePw: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Admin = mongoose.model("Admin", AdminSchema);
