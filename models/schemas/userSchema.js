const { Schema } = require('mongoose');
const todoSectionSchema = require('./todoSectionSchema');
const pomodorosSchema = require('./pomodorosSchema');
const trackerSchema = require('./trackerSchema');

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },

    password: {
        type: String,
        required: true,
    },

    todoSection: {
        type: todoSectionSchema,
        default: (() => {}),
    },

    pomodoros: {
        type: pomodorosSchema,
        default: (() => {}),
    },

    tracker: {
        type: trackerSchema,
        default: (() => {}),
    },
});

module.exports = userSchema;