const { Schema } = require('mongoose');

const plannedPomodoroSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    pomodorosAmount: {
        type: Number,
        default: 0,
    },
});

module.exports = plannedPomodoroSchema;