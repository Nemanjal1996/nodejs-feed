const Post = require('../models/post');
const Comment = require('../models/comment');
const Like = require('../models/like');

exports.postComment = async (req, res, next) => {
    const postId = req.params.postId;
    const commentText = req.body.comment;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Post was not found!');
            error.statusCode = 422;
            throw error;
        }
        const comment = new Comment({
            comment: commentText,
            postId: postId,
            userId: req.userId
        });
        const commentData = await comment.save();
        post.comments.push(comment._id);
        await post.save();
        res.status(201).json(commentData);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.deleteComment = async (req, res, next) => {
    const commentId = req.params.commentId;
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Post was not found!');
            error.statusCode = 422;
            throw error;
        }
        const comment = await Comment.findById(commentId);
        if (!comment) {
            const error = new Error('Comment was not found!');
            error.statusCode = 422;
            throw error;
        }
        if (!post.comments.indexOf(commentId) === -1) {
            const error = new Error('Comment was not commented on that post');
            error.statusCode = 422;
            throw error;
        }
        const deletedComment = await Comment.findByIdAndRemove(commentId);
        res.status(200).json(deletedComment._id);
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.commentLike = async (req, res, next) => {
    const commentId = req.params.commentId;
    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            const error = new Error('Comment was not found!');
            error.statusCode = 422;
            throw error;
        }
        const likeExist = await Like.findOne({
            commentId: commentId,
            userId: req.userId
        });
        if (likeExist) {
            await Like.remove({ _id: likeExist._id });
            comment.likes.pull(likeExist._id);
            await comment.save();
            res.status(200).json('unliked');
            return next();
        }
        const likeData = new Like({
            type: 'comment',
            commentId: comment._id,
            userId: req.userId
        });
        const like = await likeData.save();
        comment.likes.push(like._id);
        await comment.save();
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
