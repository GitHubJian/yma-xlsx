const {isValidDate} = require('./util');

function isRequired(value) {
    if (value === null || value === undefined || String(value).trim().length === 0) {
        return false;
    }

    return true;
}

function isNumber(value, precision) {
    precision = Number(precision) < 1 ? 1 : precision;
    const re = new RegExp('^[-+]?(\\d*(\\.\\d{0,' + precision + '})?|\\.\\d{1,' + precision + '})$');

    if (re.test(value)) {
        return true;
    }

    return false;
}

function isInteger(value) {
    const re = /^[-+]?\d+$/;

    if (re.test(value)) {
        return true;
    }

    return false;
}

function isPositiveNumber(value) {
    if (/^\+?\d+$/.test(value)) {
        return true;
    }

    return false;
}

function isNegativeNumber(value) {
    const re = /^-\d+$/;

    if (re.test(value)) {
        return true;
    }

    return false;
}

function isMin(value, param, include) {
    value = Number(value);
    param = Number(param);

    if (include ? value >= param : value > param) {
        return true;
    }

    return false;
}

function isMax(value, param, include) {
    value = Number(value);
    param = Number(param);

    if (include ? value <= param : value < param) {
        return true;
    }

    return false;
}

function isRange(value, min, minIncluded, max, maxIncluded) {
    min = Number(min);
    max = Number(max);

    if (minIncluded ? value >= min : value > min && maxIncluded ? value <= max : value.length < max) {
        return true;
    }

    return false;
}

function isMinLength(value, param, include) {
    param = Number(param);

    if (include ? value.length >= param : value.length > param) {
        return true;
    }

    return false;
}

function isMaxLength(value, param, include) {
    param = Number(param);

    if (include ? value.length <= param : value.length < param) {
        return true;
    }

    return false;
}

function isRangeLength(value, min, minIncluded, max, maxIncluded) {
    min = Number(min);
    max = Number(max);

    const len = String(value).length;

    if ((minIncluded ? len >= min : len > min) && (maxIncluded ? len <= max : len < max)) {
        return true;
    }

    return false;
}

function isEqualTo(value, correlativeValue) {
    if (value === correlativeValue) {
        return true;
    }

    return false;
}

function isDateBefore(value, correlativeValue) {
    if (!isValidDate(value)) {
        return false;
    }

    const timestamp = new Date(value).getTime();
    const correlativeTimestamp = new Date(correlativeValue).getTime();

    if (timestamp < correlativeTimestamp) {
        return true;
    }

    return false;
}

function isDateAfter(value, correlativeValue) {
    if (!isValidDate(value)) {
        return false;
    }

    const timestamp = new Date(value).getTime();
    const correlativeTimestamp = new Date(correlativeValue).getTime();

    if (timestamp < correlativeTimestamp) {
        return false;
    }

    return true;
}

module.exports = {
    isRequired,
    isNumber,
    isInteger,
    isPositiveNumber,
    isNegativeNumber,
    isMin,
    isMax,
    isRange,
    isMinLength,
    isMaxLength,
    isRangeLength,
    isDate: isValidDate,
    isEqualTo,
    isDateBefore,
    isDateAfter,
};
