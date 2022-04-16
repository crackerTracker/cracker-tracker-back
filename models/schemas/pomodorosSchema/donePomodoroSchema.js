const { Schema } = require('mongoose');

const donePomodoroSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    minutesSpent: {
        type: Number,
        required: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    }
});

module.exports = donePomodoroSchema;