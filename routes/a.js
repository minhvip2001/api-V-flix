const newEpisodes = await Promise.all(film.episodes.map(async (episode) => {
  const videoInfo = await ytdl.getInfo(episode.video); 
  console.log(videoInfo)
  ytdl(videoInfo.videoDetails.thumbnails.slice(-1)[0].url).pipe(fs.createWriteStream(`thumbnail-${uuidv4()}.jpg`, { format: 'jpg' }));

  const episodeTitle = slugify(episode.title, options);
  console.log(episodeTitle)
  const videoPath = path.join(filmPath, `${episodeTitle}-${episode.episode}-${uuidv4()}.mp4`);
  const videoStream = ytdl(episode.video);
  videoStream.pipe(fs.createWriteStream(videoPath, { quality: 'highest', filter: "audioandvideo", format: 'mp4' }))
    .on('finish', function () {
      console.log('Video film downloaded successfully');
    })
    .on("error", (err) => {
      console.error(`Error downloading file: ${err}`);
    });
  
  const episodeExt = episode.poster.substring("data:image/".length, episode.poster.indexOf(";base64"));
  const episodePoster = path.join(filmPath, `${uuidv4()}.${episodeExt}`);
  const episodePosterFilm = episode.poster.split(';base64,').pop();
  await fs.promises.writeFile(episodePoster, episodePosterFilm, { encoding: 'base64' });
  console.log('Image Poster Film saved successfully');

  const slug = episode.title + " " + episode.episode
  const newEpisode = new Episode({
    ...episode,
    // poster: fullUrl + "/" + thumbnailPath,
    video: fullUrl + "/" + videoPath,
    slug: slugify(slug, options),
    film: newFilm._id
  });

  return newEpisode.save();
}));