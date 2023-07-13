const express = require("express");
const Film = require("../models/Film");
const Episode = require("../models/Episode");
const Router = express.Router();
const mongoose = require("mongoose");
const slugify = require('slugify');


// @route Get Episode
// @desc Get pisode
// @access Public
Router.get("/", async (req, res) => {
    try {
        const { slug } = req.query;
        console.log(slug)
        const episode = await Episode.findOne({ slug }).populate("film");
        if (!episode) {
            return res.status(404).json({ message: 'Episode not found' });
        }
        res.json(episode);
    } catch (err) {
        res.json(err);
    }
});

// @route Post Episode
// @desc Post A Episode
// @access Public
Router.post("/", async (req, res) => {
    try {
        const missingParams = [];
        const requiredEpisodeKeys = [
            'title',
            'description',
            'episode',
            'poster',
            'video',
            'film',
        ];


        for (let key of requiredEpisodeKeys) {
            if (!req.body.hasOwnProperty(key)) {
                missingParams.push(key);
            }
        }


        if (missingParams.length > 0) {
            return res.status(400).json({
                error: `Missing parameters: ${missingParams.join(', ')}`,
            });
        }

        const film = await Film.findById(req.body.film);
        if (!film) {
            return res.status(404).json({ message: 'Film not found' });
        }
        const options = {
            lower: true,
            strict: true,
        };
        let slug = req.body.title + " " + req.body.episode;
        const episode = new Episode({
            ...req.body,
            slug: slugify(slug, options),
        });
        await episode.save()
        film.episodes = film.episodes.push(episode._id);
        // console.log(film.episodes)
        await film.save();
        res.status(201).json(episode);
    } catch (err) {
        res.json(err);
    }
});

module.exports = Router;
