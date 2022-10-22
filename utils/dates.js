const {isNaturalNumber} = require("./numberValidator");
const getPrecedingZeroNumberString = require("./getPrecedingZeroNumberString");
const zeroReg = /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T00:00:00(.000+)?Z$/;
const edgeReg = /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T23:59:59(.999+)?Z$/;
const reg = /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/;

const isUTCZeroDateString = (date) =>
    typeof date === 'string'
    && zeroReg.test(date);

const isUTCEdgeDateString = (date) =>
    typeof date === 'string'
    && edgeReg.test(date);

const isUTCDateString = (date) =>
    typeof date === 'string'
    && reg.test(date);

const getUTCZeroDateReg = ({
    year = null,
    month = null,
    day = null
}) => {
    const yearRegexString = year && isNaturalNumber(year)
        ? getPrecedingZeroNumberString(year, 4)
        : '(-?(?:[1-9][0-9]*)?[0-9]{4})';

    const monthRegexString = month && isNaturalNumber(month)
        ? getPrecedingZeroNumberString(month, 2)
        : '(1[0-2]|0[1-9])';

    const dayRegexString = day && isNaturalNumber(day)
        ? getPrecedingZeroNumberString(day, 2)
        : '(3[01]|0[1-9]|[12][0-9])';

    return new RegExp(`^${yearRegexString}-${monthRegexString}-${dayRegexString}T00:00:00(.000+)?Z$`);
}


module.exports = {
    isUTCZeroDateString,
    isUTCEdgeDateString,
    isUTCDateString,
    getUTCZeroDateReg
};