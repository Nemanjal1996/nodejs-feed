const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const likeSchema = new Schema({
    type: {
        type: String,
        required: true,
        default: 'post'
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
    },
    commentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Like', likeSchema);