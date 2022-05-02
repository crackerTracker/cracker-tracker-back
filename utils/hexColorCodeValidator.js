const reg = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

const isValidHexColorString = (string) =>
    typeof string === 'string'
    && reg.test(string);

module.exports = isValidHexColorString;