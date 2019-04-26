const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');

const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');
const Like = require('../models/like');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 10;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .populate({
        path: 'likes',
        populate: { 
          path: 'userId',
          select: ['name', '_id']
        }
      })
      .populate({
        path: 'comments',
        populate: [{ 
          path: 'userId',
          select: ['name', '_id'],
        },{
          path: 'likes',
          populate: { 
            path: 'userId',
            select: ['name', '_id'],
          }
        }]
      })
      // .populate({
      //   path: 'comments',
      //   populate: { 
      //     path: 'likes',
      //     select: ['name', '_id'],
      //   }
      // })
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      posts: posts,
      totalItems: totalItems
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed, entered data is incorrect.');
      error.statusCode = 422;
      throw error;
    }
    if (!req.file) {
      const error = new Error('No image provided.');
      error.statusCode = 422;
      throw error;
    }

    const imageUrl = req.file.path;
    const title = req.body.title;
    const content = req.body.content;
    const post = new Post({
      title: title,
      content: content,
      imageUrl: imageUrl,
      creator: req.userId
    });
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    io.getIO().emit('posts', {
      action: 'create',
      post: { ...post._doc },
      creator: { _id: user._id, name: user.name }
    });
    res.status(201).json({
      post: post,
      creator: { _id: user._id, name: user.name }
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId)
    .populate('creator')
    .populate({
      path: 'likes',
      populate: { 
        path: 'userId',
        select: ['name', '_id']
      }
    });
  try {
    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  try {
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed, entered data is incorrect.');
      error.statusCode = 422;
      throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;

    if (req.file) {
      imageUrl = req.file.path;
    }
    if (!imageUrl) {
      const error = new Error('No file picked.');
      error.statusCode = 422;
      throw error;
    }

    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    const result = await post.save();
    io.getIO().emit('posts', {
      action: 'update',
      post: { ...result._doc },
    });
    res.status(200).json(result);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized!');
      error.statusCode = 403;
      throw error;
    }

    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    io.getIO().emit('posts', {
      action: 'delete',
      post: postId,
    });
    res.status(200).json(postId);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postLike = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Post was not exist');
      error.statusCode = 422;
      throw error;
    }
    const likeExist = await Like.findOne({
      postId: postId,
      userId: req.userId
    });
    if(likeExist) {
      await Like.findByIdAndRemove(likeExist._id);
      post.likes.pull(likeExist._id);
      await post.save();
      res.status(200).json('unliked');
      return next();
    }
    const likeData = new Like({
      postId: post._id,
      userId: req.userId
    });
    const like = await likeData.save();
    post.likes.push(like._id);
    await post.save();
    const likePopulated = await Like.findById(like._id).populate({
      path: 'userId',
      select: ['name', '_id']
    });
    res.status(200).json(likePopulated);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};
