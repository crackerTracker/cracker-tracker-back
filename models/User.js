const { model } = require('mongoose');
const userSchema = require('./schemas/userSchema');

module.exports = model('User', userSchema);