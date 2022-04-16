const {Schema, Types} = require('mongoose');

const taskSchema = new Schema({
    category: {
        type: Types.ObjectId, // reference to a category document
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