const { Schema } = require('mongoose');

const subTodoSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    done: {
        type: Boolean,
        default: false,
    },
});

module.exports = subTodoSchema;