const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const FilmSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  titleSearch: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
  posterFilm: {
    type: String,
    required: true,
  },
  bannerFilm: {
    type: String,
    required: true,
  },
  trailerURL: {
    type: String,
    required: true,
  },
  filmURL: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  actor: {
    type: Array,
    default: [],
  },
  genre: {
    type: Array,
    required: true,
  },
  reviews: {
    type: Array,
    default: [],
  },
  softDelete: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

FilmSchema.index({ titleSearch: "text" });

module.exports = Film = mongoose.model("Film", FilmSchema);
