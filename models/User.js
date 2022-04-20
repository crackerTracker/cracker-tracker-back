const { model } = require('mongoose');
const userSchema = require('./schemas/userSchema');

const User = model('User', userSchema)

module.exports = User;