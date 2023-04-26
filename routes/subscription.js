const express = require("express");
const Router = express.Router();
const Subscription = require("../models/Subscription");
const webpush = require("web-push");

const vapidKeys = {
  privateKey: "AyD4IcYBJlt-kRBzThhLHQhNXsjxtW1m1yzsbKZrX24",
  publicKey:
    "BJHyU8y3LWW1gVABQsOlfBhgo5hVDvAathO4WJWKbyDzLk6d2NW5sp92TWi4C95KjLQrBdX-jijAkHmmo1pd94Y",
};

webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

Router.post("/", async (req, res) => {
  const subscriptionRequest = req.body.data;
  const newSubscription = new Subscription({
    subscription: subscriptionRequest,
  });
  const response = await newSubscription.save();
  res.status(201).json({ id: response.id });
});

Router.post("/push", async (req, res) => {
  try {
    const { slug } = req.body;
    const allSubscription = await Subscription.find();
    for (let subscription of allSubscription) {
      await webpush.sendNotification(
        subscription.subscription,
        JSON.stringify({
          title: "VMOflix - Có phim mới",
          text: "Uầy!!! Có phim mới rồi này vào xem ngay thôi nào",
          tag: "new-film",
          url: `/film/${slug}`,
        })
      );
    }
    res.status(202).json({});
  } catch (err) {
    if (err.statusCode === 410) {
      await Subscription.findOneAndDelete({
        "subscription.endpoint": err.endpoint,
      });
      res.json({ unsubscription: true });
    } else {
      res.json({ error: "unexpected" });
    }
  }
});

module.exports = Router;
