// принимает число типа number, и количество символов в требуемой строке
// возвращает строку с предшествующими нулями. если в исходном числе больше символов,
// чем передано во втором аргументе, то возвращается исходное число в виде строки.
// предшествующие нули приклеиваются к целочисленной части числа.
// numberStringLength >= 0. проверки на некорректные входные данные нет
const getPrecedingZeroNumberString = (number, numberStringLength) => {
    const integerNumberString = String(Math.abs(Math.trunc(number)));
    const integerNumberStringLength = integerNumberString.length;

    console.log('integerNumberStringLength', integerNumberStringLength)

    if (integerNumberStringLength >= numberStringLength) {
        return String(number);
    }

    const precedingZerosAmount = numberStringLength - integerNumberStringLength;

    console.log('precedingZerosAmount', precedingZerosAmount)

    let precedingZerosString = '';
    Array(precedingZerosAmount).fill(null).forEach(() => precedingZerosString += '0');

    const numberString = String(number);
    const isNegative = number < 0;

    return isNegative ? `-${precedingZerosString}${numberString.slice(1)}` : `${precedingZerosString}${numberString}`;
}

module.exports = getPrecedingZeroNumberString;