const DATE_RE = /^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/;
function parseDate(date) {
    if (date === null) {
        return new Date(NaN); // null is invalid
    }

    if (date === undefined) {
        return new Date(); // today
    }

    if (date instanceof Date) {
        return new Date(date);
    }

    if (typeof date === 'string' && !/Z$/i.test(date)) {
        let d = date.match(DATE_RE);

        if (d) {
            let m = d[2] - 1 || 0;
            let ms = (d[7] || '0').substring(0, 3);

            return new Date(d[1], m, d[3] || 1, d[4] || 0, d[5] || 0, d[6] || 0, ms);
        }
    }

    return new Date(date);
}
function isValidDate(date) {
    const d = parseDate(date);

    return d.toUTCString() !== 'Invalid Date';
}
exports.isValidDate = isValidDate;

const COMBINATION = {
    Digit: 0,
    Small: 1,
    Capital: 2,
    Special: 3,
    Incontinuity: 4,
};
exports.COMBINATION = COMBINATION;
function isIncontinuityString(str) {
    let pairs = str.split('');
    for (let i = 1; i < pairs.length - 1; i++) {
        let prevIndex = pairs[i - 1].charCodeAt();
        let curIndex = pairs[i].charCodeAt();
        let nextIndex = pairs[i + 1].charCodeAt();

        if (
            (nextIndex - curIndex === 1 && curIndex - prevIndex === 1) ||
            (nextIndex - curIndex === -1 && curIndex - prevIndex === -1)
        ) {
            return false;
        }
    }

    return true;
}
function isStrongPassword(password, combination) {
    let lv = 0;
    if (combination.indexOf(COMBINATION.Digit) > -1 && /[0-9]/.test(password)) {
        lv += 1;
    }

    if (combination.indexOf(COMBINATION.Small) > -1 && /[a-z]/.test(password)) {
        lv += 1;
    }

    if (combination.indexOf(COMBINATION.Capital) > -1 && /[A-Z]/.test(password)) {
        lv += 1;
    }

    if (combination.indexOf(COMBINATION.Special) > -1 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        lv += 1;
    }

    if (combination.indexOf(COMBINATION.Incontinuity) > -1 && isIncontinuityString(password)) {
        lv += 1;
    }

    return lv >= combination.length;
}
exports.isStrongPassword = isStrongPassword;

function isEmpty(v) {
    return v === null || v === undefined || String(v).trim().length === 0;
}
exports.isEmpty = isEmpty;

function isFunction(v) {
    return typeof v === 'function';
}
exports.isFunction = isFunction;
