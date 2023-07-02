const Film = require("../models/Film");
const upload = require("../utils/upload");
const url = require('url');

const addFilm = (req, res) => {
  const {
    title,
    trailerURL,
    filmURL,
    description,
    genre,
    actor,
    titleSearch,
  } = req.body;
  upload.uploadFilm(filmURL);
  upload.uploadFilm(trailerURL);
  const fullUrl = url.format({
    protocol: req.protocol,
    host: req.headers.host,
    pathname: "/"
  });
  let poster_image = req.files['posterImage'][0];
  const folderPath = 'uploads/films/';
  let infoFilm = {
    title: title,
    trailerURL: fullUrl + folderPath + upload.getNameFilm(trailerURL) + '.mp4',
    filmURL: fullUrl + folderPath + upload.getNameFilm(filmURL) + '.mp4',
    description: description,
    genre: genre,
    actor: actor,
    posterFilm: fullUrl + poster_image.destination + poster_image.filename,
    bannerFilm: fullUrl + banner_mage.destination + banner_mage.filename,
    titleSearch: titleSearch,
  };

  const newFilm = new Film(infoFilm);

  newFilm.save().then((film) => res.json(film));
};

const updateFilm = async (req, res, poster, banner) => {
  try {
    const {
      title,
      trailerURL,
      filmURL,
      description,
      genre,
      reviews,
      actor,
      titleSearch,
      slug,
      softDelete,
    } = req.body;
    const currentFilm = await Film.findOne({ slug: req.params.slug });

    let infoFilm = {
      title: title !== currentFilm.title ? title : undefined,
      trailerURL:
        trailerURL !== currentFilm.trailerURL ? trailerURL : undefined,
      filmURL: filmURL !== currentFilm.filmURL ? filmURL : undefined,
      description:
        description !== currentFilm.description ? description : undefined,
      reviews,
      genre:
        genre.join(",") !== currentFilm.genre.join(",") ? genre : undefined,
      actor:
        actor.join(",") !== currentFilm.actor.join(",") ? actor : undefined,
      posterFilm: poster !== currentFilm.posterFilm ? poster : undefined,
      bannerFilm: banner !== currentFilm.bannerFilm ? banner : undefined,
      titleSearch:
        titleSearch !== currentFilm.titleSearch ? titleSearch : undefined,
      slug: slug !== currentFilm.slug ? slug : undefined,
    };

    for (let prop in infoFilm) {
      if (!infoFilm[prop]) {
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
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  addFilm,
  updateFilm,
};
