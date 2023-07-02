const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EpisodeSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    episode: {
        type: Number,
        required: true,
    },
    slug: {
        type: String,
        unique: true,
    },
    poster: {
        type: String,
        required: true,
    },
    video: {
        type: String,
        required: true,
    },
    film: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Film'
      },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = Episode = mongoose.model("Episode", EpisodeSchema);
