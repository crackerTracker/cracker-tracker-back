const { Schema, Types } = require('mongoose');
const subTodoSchema = require('./subTodoSchema');

const todoSchema = new Schema({
    name: {
        type: String,
        required: true,
    },

    done: {
        type: Boolean,
        default: false,
    },

    deadline: {
        type: Date,
        default: null,
    },

    note: String,

    isImportant: {
        type: Boolean,
        default: false,
    },

    // populate before sending to client
    group: {
        type: Types.ObjectId, // reference to a group document
        default: null,
    },

    today: {
        type: Boolean,
        default: false,
    },

    subTodos: {
        type: [subTodoSchema],
        default: undefined,
    },
});

module.exports = todoSchema;