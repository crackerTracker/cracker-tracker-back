const isNaturalNumber = (number) =>
    typeof number === 'number'
    && number >= 1
    && number - Math.trunc(number) === 0;

module.exports = {
    isNaturalNumber: isNaturalNumber
};