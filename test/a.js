const XLSX = require('xlsx');
const dayjs = require('dayjs');

const fieldsMap = {
    1: {
        key: 'name',
        value: {
            0: '不限制',
            1: '限制',
        },
    },
    2: {
        key: 'brithday',
    },
};

let list = [['Harry', new Date(formatTime('2024/05/23'))]];

/**
 * 获取当前机器时间时区是否存在时间误差
 *
 * @param {Date} date 比对的误差时间
 * @returns {Number} 误差毫秒
 */
function getTimezoneOffsetMS(date) {
    var time = date.getTime();
    var utcTime = Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds(),
    );
    return time - utcTime;
}

/**
 * 矫正日期误差
 *
 * @param {Date} date 需要矫正的日期
 * @returns {Date} 返回矫正后的日期
 */
function fixDate(date) {
    const importBugHotfixDiff = (function () {
        const basedate = new Date(1899, 11, 30, 0, 0, 0);
        const dnthreshAsIs = (new Date().getTimezoneOffset() - basedate.getTimezoneOffset()) * 60000;
        const dnthreshToBe = getTimezoneOffsetMS(new Date()) - getTimezoneOffsetMS(basedate);
        return dnthreshAsIs - dnthreshToBe;
    })();
    return new Date(date.getTime() + importBugHotfixDiff);
}

/**
 * 是否需要矫正日期
 *
 * @param {Date} date 需要判断的日期
 * @returns {Boolean}  是否需要矫正
 */
function isNeedFixDate(date) {
    const baseDate = new Date(1899, 11, 30, 0, 0, 0);
    const baseDateUtc = new Date(Date.UTC(1899, 11, 30, 0, 0, 0));
    const timezoneOffsetFix = baseDateUtc.valueOf() + baseDate.getTimezoneOffset() * 60000 - baseDate.valueOf();
    return new Date(date.valueOf() - timezoneOffsetFix).getTimezoneOffset() !== baseDate.getTimezoneOffset();
}

function formatTime(timeStr) {
    const time = dayjs(timeStr).toDate();
    const t = isNeedFixDate(time) ? fixDate(time) : time;
    return dayjs(t).format('YYYY-MM-DD HH:mm:ss');
}

function toBlob(list, fieldsMap) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([], {
        dense: true,
    });

    let heading = [];

    Object.keys(fieldsMap).forEach(function (colIndex) {
        const config = fieldsMap[colIndex];

        heading.push(config.key);
    });

    XLSX.utils.sheet_add_aoa(ws, [heading]);
    XLSX.utils.sheet_add_aoa(ws, list, {
        origin: 'A2',
        skipHeader: true,
        dateNF: 'YYYY/MM/DD',
        dense: true,
    });

    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // const blob = XLSX.write(wb, {type: 'array', bookType: 'xlsx'});

    XLSX.writeFile(wb, 'SheetJSNow.xlsx', {});
}

toBlob(list, fieldsMap);
