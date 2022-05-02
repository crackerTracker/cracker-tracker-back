const {Types} = require("mongoose");

const isValidIdString = (id) => {
    if (typeof id !== 'string') {
        return false;
    }

    try {
        Types.ObjectId(id);
    }
    catch (e) {
        return false;
    }

    return true;
}

module.exports = isValidIdString;