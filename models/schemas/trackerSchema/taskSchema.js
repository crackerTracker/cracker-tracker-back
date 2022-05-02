const { Schema, Types } = require('mongoose');

const taskSchema = new Schema({
    // populate before sending to client
    category: {
        type: Types.ObjectId, // reference to a category document
        required: true,
    },

    date: {
        type: Date,
        required: true,
    },

    minutesSpent: {
        type: Number,
        required: true,
    },
});

module.exports = taskSchema;