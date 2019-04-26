const express = require('express');
const router = express.Router();

const { body } = require('express-validator/check');

const feedController = require('../controllers/feed');
const commentController = require('../controllers/comment');
const isAuth = require('../middleware/auth');

// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);

// POST /feed/post
router.post('/post', isAuth, [
    body('title')
        .trim()
        .isLength({ min: 5 }),
    body('content')
        .trim()
        .isLength({ min: 5 })
], feedController.createPost);

// GET /post/:postId
router.get('/post/:postId', isAuth, feedController.getPost);

// PUT /post/:postId
router.put('/post/:postId', isAuth, [
    body('title')
        .trim()
        .isLength({ min: 5 }),
    body('content')
        .trim()
        .isLength({ min: 5 })
], feedController.updatePost);

// PUT /post/:postId/like
router.put('/post/:postId/like', isAuth, feedController.postLike);

// PUT /post/:postId/comment
router.put('/post/:postId/comment', isAuth, commentController.postComment);

// PUT /post/:postId/comment
router.put('/comment/:commentId/like', isAuth, commentController.commentLike);


// PUT /post/:postId/comment
router.delete('/post/:postId/comment/:commentId', isAuth, commentController.deleteComment);

// DELETE /post/:postId
router.delete('/post/:postId', isAuth, feedController.deletePost);

module.exports = router;