const { Schema } = require('mongoose');

const plannedPomodoroSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    pomodorosAmount: {
        type: Number,
        required: true,
    },
});

module.exports = plannedPomodoroSchema;