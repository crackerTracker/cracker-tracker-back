const {isNaturalNumber} = require("./numberValidator");
const getPrecedingZeroNumberString = require("./getPrecedingZeroNumberString");
const zeroReg = /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T00:00:00(.000+)?Z$/;
const edgeReg = /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T23:59:59(.999+)?Z$/;
const simpleDateReg = /^(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])-\d{4}$/; // 06-23-2022 | 6-23-2022 (MM.DD.YYYY)
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

const isSimpleDateString = (date) =>
    typeof date === 'string'
    && simpleDateReg.test(date);

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

/**
 * Convert a simple date string (like '12-01-2022', MM-DD-YYYY)
 * to a Date object (utc) with zeros on places of hours, minutes, seconds and ms
 * @param date string
 */
const simpleDateToUTCZeroDate = (date) => {
    const strings = date.split('-');
    return new Date(
        Date.UTC(
            Number(strings[2]),
            Number(strings[0]) - 1, // minus one because months are indexed from 0 in Date constructor
            Number(strings[1]))
    );
}

/**
 * Returns a Date object (utc) with zeros on places of h, m, s, ms
 */
const getUTCNowZeroDate = () => {
    const now = new Date();
    return new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        )
    );
}

/**
 * @param {Date} start
 * @param {Date} end
 */
const getFullDaysDifferenceBetweenDates = (start, end) =>
    Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24));

module.exports = {
    isUTCZeroDateString,
    isUTCEdgeDateString,
    isUTCDateString,
    isSimpleDateString,
    getUTCZeroDateReg,
    simpleDateToUTCZeroDate,
    getUTCNowZeroDate,
    getFullDaysDifferenceBetweenDates
};