const {Schema} = require('mongoose');
const categorySchema = require('./categorySchema');
const taskSchema = require('./taskSchema');

const trackerSchema = new Schema({
    categories: {
        type: [categorySchema],
        default: undefined,
    },

    tasks: {
        type: [taskSchema],
        default: undefined,
    },
});

module.exports = trackerSchema;