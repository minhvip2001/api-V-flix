const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const SubscriptionSchema = new Schema({
  subscription: {
    type: Object,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Subscription = mongoose.model(
  "Subscription",
  SubscriptionSchema
);
