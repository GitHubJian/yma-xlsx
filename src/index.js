const parse = require('./parse');
const write = require('./write');

exports.parse = parse;
exports.write = write;
exports.filetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function clone(v) {
    return JSON.parse(JSON.stringify(v));
}

exports.dataConvert = function (dataArray, errorArrayLike, options) {
    options = options || {};
    const errorMessageKey = options.errorMessageKey || 'errmsg';
    const separator = options.separator || ';';

    const highlightArrayLike = {};
    const errorKeys = Object.keys(errorArrayLike);
    const newDataArray = [];

    for (let i = 0, len = errorKeys.length; i < len; i++) {
        const key = errorKeys[i];
        const errorList = errorArrayLike[key];

        const messages = [];
        const highlightKeys = [];
        if (errorList && errorList.length > 0) {
            errorList.forEach(function (e) {
                highlightKeys.push(e.key);
                messages.push(e.messages.join(separator));
            });
        }

        const value = clone(dataArray[key]);
        value[errorMessageKey] = messages.join(separator);

        highlightArrayLike[key] = highlightKeys;
        newDataArray.push(value);
    }

    return {
        dataArray: newDataArray,
        highlightArrayLike,
    };
};

exports.toBlob = function blob(buf) {
    const blob = new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    return blob;
};
