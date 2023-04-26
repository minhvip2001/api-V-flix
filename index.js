const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
dotenv.config();
// const bcrypt = require("bcrypt");
const corsConfig = require("./config/index");

const app = express();
// const whitelist = [
//   "http://127.0.0.1:9000",
//   "https://exercises-at-vmo.web.app",
//   "https://vmoflix-vn.web.app",
//   "https://exercise-blog-api.vercel.app",
// ];
app.use(cors(corsConfig));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));

const db = process.env.MONGO_URI;

// Connect to Mongo
mongoose.connect(db, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const { connection } = mongoose;
connection.once("open", () => {
  console.log("Mongo database connection established successfully");
});
app.use("/uploads", express.static("./uploads"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/user", require("./routes/user"));
app.use("/api/films", require("./routes/films"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/subscription", require("./routes/subscription"));
// app.use("/api/file", require("./routes/file"));

// app.use("/", require("./routes/dumpData"));

const port = process.env.PORT_SERVE || 9000;
app.listen(port, () => {
  console.log(`Server :: Running @ 'http://localhost:${port}'`);
});
