const { Schema } = require('mongoose');
const plannedPomodoroSchema = require('./plannedPomodoroSchema');
const donePomodoroSchema = require('./donePomodoroSchema');

const pomodorosSchema = new Schema({
    plan: {
        type: [plannedPomodoroSchema],
        default: undefined,
    },

    done: {
        type: [donePomodoroSchema],
        default: undefined,
    },
});

module.exports = pomodorosSchema;