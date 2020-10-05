const {Schema, model} = require('mongoose');

const instagramSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    countSubscribe: {
        type: Number,
        default: 0
    },
    countUnSubscribe: {
        type: Number,
        default: 0
    },
    tagLikes: {
        type: Array
    },
    countLikes: {
        type: Number
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = model('Instagram', instagramSchema);