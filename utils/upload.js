const express = require("express");
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');


function upload_film(videoUrl) {
    const folderPath = './uploads/films';
    const videoId = ytdl.getVideoID(videoUrl);
    const fileName = `${videoId}.mp4`;
    const filePath = path.join(folderPath, fileName);
    const videoStream = ytdl(videoId, { quality: 'highest', filter: "audioandvideo", format: 'mp4' });
    videoStream.pipe(fs.createWriteStream(filePath))
        .on('finish', function () {
            console.log('Video downloaded successfully');
            return req.headers.host + "/uploads/films/" + fileName
        })
        .on("error", (err) => {
            console.error(`Error downloading file: ${err}`);
        });
}

module.exports = upload_film;
