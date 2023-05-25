const mongoose = require("mongoose");
const slugify = require('slugify');
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
    unique: true,
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

FilmSchema.pre('save', async function (next) {
  const film = this;
  const options = {
    lower: true,
    strict: true,
  };

  film.slug = slugify(film.title, options);
  if (film.isModified('title') || film.isNew) {
    const slugRegex = new RegExp(`^(${film.slug})((-[0-9]*$)?)$`, 'i');
    const filmsWithSlug = await film.constructor.find({ slug: slugRegex });

    if (filmsWithSlug.length > 0) {
      film.slug = `${film.slug}-${filmsWithSlug.length + 1}`;
    }
  }

  next();
});
module.exports = Film = mongoose.model("Film", FilmSchema);
