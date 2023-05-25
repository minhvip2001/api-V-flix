const express = require("express");
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

function get_name_film(videoUrl) {
    videoId = ytdl.getVideoID(videoUrl);
    return videoId
}

function upload_film(videoUrl) {
    const folderPath = './uploads/films';
    const videoId = get_name_film(videoUrl);
    const fileName = `${videoId}.mp4`;
    const filePath = path.join(folderPath, fileName);
    const videoStream = ytdl(videoId, { quality: 'highest', filter: "audioandvideo", format: 'mp4' });
    videoStream.pipe(fs.createWriteStream(filePath))
        .on('finish', function () {
            console.log('Video downloaded successfully');
        })
        .on("error", (err) => {
            console.error(`Error downloading file: ${err}`);
        });
}


module.exports.uploadFilm = upload_film;
module.exports.getNameFilm = get_name_film;
