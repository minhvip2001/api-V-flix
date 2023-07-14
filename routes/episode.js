const express = require("express");
const Film = require("../models/Film");
const Episode = require("../models/Episode");
const addFullUrl = require("../utils/url");
const Router = express.Router();
const mongoose = require("mongoose");
const slugify = require('slugify');
const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');
const ytdl = require('ytdl-core');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const filmPath = path.join('uploads', 'films');

// @route Get Episode
// @desc Get Episode
// @access Public
Router.get("/", addFullUrl, async (req, res) => {
    try {
        const { slug } = req.query;
        console.log(slug)
        const episode = await Episode.findOne({ slug }).populate("film");
        if (!episode) {
            return res.status(404).json({ message: 'Episode not found' });
        }
        episode.poster = `${req.fullUrl}/${episode.poster}`;
        episode.video = `${req.fullUrl}/${episode.video}`;
        episode.film.poster = `${req.fullUrl}/${episode.film.poster}`;
        res.json(episode);
    } catch (err) {
        res.json(err);
    }
});

// @route Post Episode
// @desc Post A Episode
// @access Public
Router.post("/", addFullUrl, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const missingParams = [];
        const requiredEpisodeKeys = [
            'title',
            'description',
            'episode',
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

        if (!mongoose.Types.ObjectId.isValid(req.body.film)) {
            console.error(`Invalid film ID: ${req.body.film}`);
            return res.status(400).json({ error: `Invalid film ID: ${req.body.film}` });
        }

        const film = await Film.findById(req.body.film);
        if (!film) {
            return res.status(404).json({ message: 'Film not found' });
        }

        // Check title film exists
        const existingEpisode = await Episode.findOne({ film: film._id, episode: req.body.episode });
        if (existingEpisode) {
            return res.status(400).json({ error: `There is already episode '${existingEpisode.episode}' in this film '${film.title}'` });
        }
        // Dowload video youtube and save it to folder
        const episodeVideoInfo = await ytdl.getInfo(req.body.video);
        const episodeVideoName = `video-${uuidv4()}.mp4`;
        const episodeVideoPath = path.join(filmPath, episodeVideoName);
        const downloadVideoPromise = ytdl(req.body.video, {
            format: 'mp4',
            quality: 'highest',
            filter: "audioandvideo",
        }).pipe(fs.createWriteStream(episodeVideoPath));

        const episodeThumbnailUrl = episodeVideoInfo.videoDetails.thumbnails.slice(-1)[0].url;
        const episodeThumbnailName = `thumbnail-${uuidv4()}.png`;
        const episodeThumbnailPath = path.join(filmPath, episodeThumbnailName);
        const downloadThumbnailPromise = axios.get(episodeThumbnailUrl, { responseType: 'arraybuffer' })
            .then(response => {
                const imageBuffer = Buffer.from(response.data);

                return sharp(imageBuffer)
                    .png()
                    .toBuffer();
            })
            .then(async pngBuffer => {
                return await fs.promises.writeFile(episodeThumbnailPath, pngBuffer);
            });

        const options = {
            lower: true,
            strict: true,
        };
        const slug = slugify(`${film.title} ${req.body.title} ${req.body.episode}`, options);
        const episode = new Episode({
            ...req.body,
            poster: episodeThumbnailPath,
            video: episodeVideoPath,
            slug,
        });

        const savePromise = episode.save()
            .then(() => {
                film.episodes = [...film.episodes, episode._id];
                return film.save();
            });

        await Promise.all([downloadVideoPromise, downloadThumbnailPromise, savePromise]);
        await session.commitTransaction();
        episode.poster = `${req.fullUrl}/${episode.poster}`;
        episode.video = `${req.fullUrl}/${episode.video}`;
        res.status(201).json(episode);
    } catch (err) {
        console.error(err);
        await session.abortTransaction();
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        session.endSession();
    }
});

module.exports = Router;
