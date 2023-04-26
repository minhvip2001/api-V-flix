const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  userName: {
    type: String,
    required: true,
  },
  imageUser: {
    type: String,
    default:
      "https://res.cloudinary.com/nghiemduong2000/image/upload/v1620266729/VMOflix%20Project/VMOflix%20-%20base/flat_1000x1000_075_f.u2_lnllya.webp",
  },
  userEmail: {
    type: String,
    required: true,
  },
  userPassword: {
    type: String,
    required: true,
  },
  history: {
    type: Array,
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastChangePw: {
    type: Date,
    default: Date.now,
  },
  resetLink: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.index({ userName: "text" });

module.exports = User = mongoose.model("User", UserSchema);
