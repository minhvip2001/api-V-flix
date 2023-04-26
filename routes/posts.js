const express = require('express');
const Post = require('../models/Post');
const Router = express.Router();

// @route GET posts
// @desc Get All Posts
// @access Public
Router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort('-date');
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
});

// @route POST post
// @desc Create A New Post
// @access Public
Router.post('/', async (req, res) => {
  try {
    const { name, body, author, description } = req.body;

    if (!name || !body || !author || !description) {
      return res.status(400).json({
        msg: 'Vui lòng điền vào ô trống',
      });
    }

    const newPost = new Post({
      name,
      author,
      body,
      description,
    });
    const post = await newPost.save();
    res.json(post);
  } catch (err) {
    console.log(err);
  }
});

// @route PATCH post
// @desc UPDATE A Post
// @access Public
Router.patch('/:id', async (req, res) => {
  try {
    const { name, body, author, description } = req.body;

    if (!name || !body || !author || !description) {
      return res.status(400).json({
        msg: 'Vui lòng điền vào ô trống',
      });
    }
    const updatePost = {
      name,
      author,
      body,
      description,
    };

    const posts = await Post.findByIdAndUpdate(req.params.id, updatePost, {
      new: true,
    });
    res.json(posts);
  } catch (err) {
    console.log(err);
  }
});

// @route DELETE post
// @desc Remove A Post
// @access Public
Router.delete('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, err });
  }
});

module.exports = Router;
