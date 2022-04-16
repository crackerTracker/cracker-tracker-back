const { Schema } = require('mongoose');
const groupSchema = require('./groupSchema');
const todoSchema = require('./todoSchema');

const todoSectionSchema = new Schema({
    todos: {
        type: [todoSchema],
        default: undefined,
    },

    groups: {
        type: [groupSchema],
        default: undefined,
    },
})

module.exports = todoSectionSchema;