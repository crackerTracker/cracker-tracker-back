const { Schema, Types} = require('mongoose');

const groupSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
});

module.exports = groupSchema;