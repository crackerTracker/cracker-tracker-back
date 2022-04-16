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
    },

    pomodoros: {
        type: pomodorosSchema,
    },

    tracker: {
        type: trackerSchema,
    }
});

module.exports = userSchema;