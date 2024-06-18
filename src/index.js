const ExcelJS = require('exceljs');
const {toBuffer, blob} = require('./to-blob');
const FormValidator = require('./forms-validator');
const FormsValidator = require('./forms-validator');

function isString(val) {
    return typeof val === 'string';
}

function isFunction(val) {
    return typeof val === 'function';
}

function isPlainObject(val) {
    return Object.prototype.toString.call(val) === '[object Object]';
}

function normalize(fieldsMap) {
    const newFieldsMap = Object.keys(fieldsMap).reduce(function (prev, cur) {
        const config = fieldsMap[cur];
        if (isString(config)) {
            prev[cur] = {
                key: config,
                value: function (value) {
                    return value;
                },
            };
        } else if (isPlainObject(config)) {
            const value = config.value;
            if (isPlainObject(value)) {
                config.value = (function (enums) {
                    return function (value) {
                        return enums[value];
                    };
                })(value);
            } else if (isFunction(value)) {
                config.value = value;
            } else {
                console.log(
                    `[fieldsMap.${cur}.value] must be a function or a object`
                );
            }

            prev[cur] = config;
        }

        return prev;
    }, {});

    return newFieldsMap;
}

function col2num(col) {
    let num = 0;
    for (let i = 0; i < col.length; i++) {
        num = num * 26 + (col.charCodeAt(i) - 64);
    }
    return num;
}

function num2col(num) {
    let col = '';
    while (num > 0) {
        let remainder = (num - 1) % 26;
        col = String.fromCharCode(65 + remainder) + col;
        num = Math.floor((num - 1) / 26);
    }
    return col;
}

function parse(
    buffer,
    sheetname,
    {
        fieldRow = 1,
        startRow = 2,
        startColumn = 1,
        fieldMap = {},
        fieldRules = [],
    }
) {
    const workbook = new ExcelJS.Workbook();

    return workbook.xlsx
        .load(buffer)
        .then(workbook => {
            const ws = workbook.getWorksheet(sheetname);
            const fieldRowData = ws.findRow(fieldRow).values;
            const fieldRowDataLength = fieldRowData.length;

            let data = [];
            ws.eachRow({includeEmpty: true}, function (row, rowNumber) {
                if (rowNumber >= startRow) {
                    const d = {};

                    row.values.forEach(function (col, colNumber) {
                        if (colNumber >= startColumn) {
                            let fieldName;
                            if (colNumber >= fieldRowDataLength) {
                                fieldName = num2col(colNumber);
                            } else {
                                fieldName = fieldMap[fieldRowData[colNumber]];
                                if (!fieldName) {
                                    fieldName = num2col(colNumber);
                                }
                            }

                            d[fieldName] = col;
                        }
                    });

                    data.push(d);
                }
            });

            return data;
        })
        .then(data => {
            const formsValidate = new FormsValidator(fieldRules);

            formsValidate.assert(data, function (message) {
                debugger;
            });
        });
}

exports.parse = parse;
exports.toBuffer = toBuffer;
exports.blob = blob;
