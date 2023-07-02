const express = require("express");
const Film = require("../models/Film");
const Episode = require("../models/Episode");
const { addFilm, updateFilm } = require("../utils/addOrUpdateFilm");
const Router = express.Router();
const mongoose = require("mongoose");
const authUser = require("../middlewares/authUser");
const authAdmin = require("../middlewares/authAdmin");
const slugify = require('slugify');


// @route GET amount films
// @desc Get Amount Films
// @access Private
Router.get("/amount", authAdmin, async (req, res) => {
  const amount = await Film.countDocuments();
  res.json(amount);
});

// @route GET film
// @desc Get A Film
// @access Public
Router.get("/", async (req, res) => {
  try {
    const { slug } = req.query;

    const film = await Film.findOne({ slug, softDelete: false });
    res.json(film);
  } catch (err) {
    console.log(err);
  }
});

// @route GET films related
// @desc Get Films Related
// @access Public
Router.get("/related", async (req, res) => {
  try {
    const { slug } = req.query;
    const film = await Film.findOne({ slug, softDelete: false });
    const related = await Film.find({
      genre: { $in: [...film.genre] },
      softDelete: false,
    }).limit(8);
    res.json({
      film,
      related,
    });
  } catch (err) {
    console.log(err);
  }
});

// @route GET films filter
// @desc Get Films Filter
// @access Public
Router.get("/filter", async (req, res) => {
  try {
    const { q, genre, bin } = req.query;

    let progress = {};
    if (q) {
      progress.$text = { $search: q };
    }
    if (genre) {
      const checkGenre = typeof genre === "string" ? [genre] : [...genre];
      progress.genre = { $all: checkGenre };
    }
    if (bin) {
      progress.softDelete = true;
    } else {
      progress.softDelete = false;
    }

    const filter = q
      ? [{ ...progress }, { score: { $meta: "textScore" } }]
      : [{ ...progress }];

    const films = await Film.find(...filter).sort(
      q ? { score: { $meta: "textScore" } } : "-date"
    );
    res.json(films);
  } catch (err) {
    console.log(err);
  }
});

// @route POST films recent
// @desc POST Films Recent
// @access Private
Router.post("/recent", authUser, async (req, res) => {
  try {
    const { history } = req.body;
    const listIdFilm = history.map((item) =>
      mongoose.Types.ObjectId(item.filmId)
    );
    const films = await Film.find({
      _id: { $in: listIdFilm },
      softDelete: false,
    }).select(
      "title posterFilm trailerURL filmURL genre actor description reviews slug"
    );
    const sortRecent = [];
    for (let i = 0; i < history.length; i++) {
      for (let j = 0; j < films.length; j++) {
        if (history[i].filmId === films[j].id) {
          sortRecent.push(films[j]);
        }
      }
    }
    res.json(sortRecent);
  } catch (err) {
    console.log(err);
  }
});

// @route POST film
// @desc Create A New Film
// @access Public
Router.post("/", (req, res) => {
  try {
    const film = {
      'title': req.body.title,
      'poster': req.body.poster,
      'description': req.body.description,
      'genre': req.body.genre,
      'actor': req.body.actor,
      'episodes': req.body.episodes,
    }

    const missingParams = [

    ];

    const requiredFilmKeys = [
      'title',
      'description',
      'poster',
      'genre',
      'actor',
      'episodes'
    ];

    const requiredEpisodeKeys = [
      'title',
      'description',
      'episode',
      'poster',
      'video',
    ];

    for (let key of requiredFilmKeys) {
      if (!req.body.hasOwnProperty(key)) {
        missingParams.push(key);
      }
    }

    for (let index = 0; index < req.body.episodes.length; index++) {
      for (let key of requiredEpisodeKeys) {
        if (!req.body.episodes[index].hasOwnProperty(key)) {
          let error = key + '[' + index + ']';
          missingParams.push(error);
        }
      }
    }

    if (missingParams.length > 0) {
      return res.status(400).json({
        error: `Missing parameters: ${missingParams.join(', ')}`,
      });
    }

    const newFilm = new Film({
      title: film.title,
      titleSearch: film.title,
      poster: film.poster,
      description: film.description,
      actor: film.actor,
      genre: film.genre,
    });

    const options = {
      lower: true,
      strict: true,
    };
    const newEpisodes = film.episodes.map(episode => {
      let slug = film.title + " " + episode.episode
      episode.slug = slugify(slug, options);
      return new Episode({
        ...episode,
        slug,
        film: newFilm._id
      });
    });

    Episode.insertMany(newEpisodes)
      .then((insertedEpisodes) => {
        newFilm.episodes = insertedEpisodes.map(ep => ep._id);
        return newFilm.save();
      })
      .then(() => res.json(newFilm))
  } catch (err) {
    res.json(err);
  }
});

// @route PATCH film
// @desc UPDATE A Film
// @access Public
Router.patch("/:slug", async (req, res) => {
  try {
    const {
      title,
      trailerURL,
      filmURL,
      description,
      genre,
      images,
      reviews,
      isUpload,
      titleSearch,
      softDelete,
    } = req.body;

    if (images) {
      if (
        !title ||
        !trailerURL ||
        !description ||
        !genre ||
        !titleSearch ||
        !filmURL
      ) {
        return res.status(400).json({
          msg: "Vui lòng điền vào ô trống",
        });
      }
      if (isUpload) {
        let file_urls = [];
        for (let file of images) {
          if (file) {
            const response = await createUploader(file);
            file_urls.push(response.secure_url);
          } else {
            file_urls.push(file);
          }
        }

        updateFilm(req, res, file_urls[0], file_urls[1]);
      } else {
        updateFilm(req, res, images[0], images[1]);
      }
    } else {
      let infoFilm = {
        reviews,
        softDelete,
      };

      for (let prop in infoFilm) {
        if (typeof infoFilm[prop] === "undefined") {
          delete infoFilm[prop];
        }
      }

      const updateFilm = await Film.findOneAndUpdate(
        { slug: req.params.slug },
        infoFilm,
        {
          new: true,
        }
      );
      await res.json(updateFilm);
    }
  } catch (err) {
    console.log(err);
  }
});

// @route DELETE film
// @desc Remove A Film
// @access Public
Router.delete("/:slug", async (req, res) => {
  try {
    const film = await Film.findOne({ slug: req.params.slug });
    await film.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, err });
  }
});

// @route GET slug
// @desc Check Slug Exiting
// @access Public
Router.get("/checkSlug/:slug", async (req, res) => {
  try {
    const slugExisting = await Film.findOne({ slug: req.params.slug });
    if (slugExisting) {
      res.json({ msg: "Slug này đã tồn tại" });
    } else {
      res.json({ msg: "" });
    }
  } catch (err) {
    console.log(err);
  }
});

module.exports = Router;
