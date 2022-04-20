const {Schema, Types} = require('mongoose');

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
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