const {Schema} = require('mongoose');

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true, // todo уникальное в пределах всей бд или только массива категорий?
    },

    color: {
        type: String,
        required: true,
    },

    isArchived: {
        type: Boolean,
        default: false,
    },
});

module.exports = categorySchema;