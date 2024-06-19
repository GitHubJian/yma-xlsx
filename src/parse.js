const ExcelJS = require('exceljs');
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

function parseFieldMap(fieldMap) {
    const keyMap = {};
    const valMap = {};
    const fieldRules = [];

    const colNames = Object.keys(fieldMap);
    colNames.forEach(function (colName) {
        const config = fieldMap[colName];
        if (isString(config)) {
            keyMap[colName] = config;
            valMap[config] = function (value) {
                return value;
            };
        } else if (isPlainObject(config)) {
            keyMap[colName] = config.key;

            const value = config.value;
            if (isPlainObject(value)) {
                valMap[config.key] = (function (enums) {
                    return function (value) {
                        return enums[value];
                    };
                })(value);
            } else if (isFunction(value)) {
                valMap[config.key] = value;
            } else {
                console.log(`[fieldMap.${colName}.value] must be function or object`);
            }

            fieldRules.push({
                key: config.key,
                label: config.label || colName,
                rules: config.rules,
            });
        }
    });

    return {
        keyMap,
        valMap,
        fieldRules,
    };
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

/**
 *
 * @param {Uint8Array} buffer
 * @param {String} sheetname Excel Sheet 名字
 * @param {*} options
 * @param {Number} fieldRow 数据 Field 字段所在行
 * @param {Number} startRow 数据 开始行
 * @param {Number} startColumn 数据 开始列
 * @param {Object} fieldMap 数据集
 * @returns
 */
function parse(buffer, sheetname, {fieldRow = 1, startRow = 2, startColumn = 1, fieldMap = {}}) {
    const {keyMap, valMap, fieldRules} = parseFieldMap(fieldMap);
    const workbook = new ExcelJS.Workbook();

    return workbook.xlsx
        .load(buffer)
        .then(workbook => {
            const ws = workbook.getWorksheet(sheetname);
            const fieldRowData = ws.findRow(fieldRow).values;
            const fieldRowDataLength = fieldRowData.length;

            let data = [];
            ws.eachRow(function (row, rowNumber) {
                if (rowNumber >= startRow) {
                    const d = {};

                    row.values.forEach(function (col, colNumber) {
                        if (colNumber >= startColumn) {
                            let fieldName;
                            if (colNumber >= fieldRowDataLength) {
                                fieldName = num2col(colNumber);
                            } else {
                                fieldName = keyMap[fieldRowData[colNumber]];
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
        .then(table => {
            if (fieldRules && fieldRules.length > 0) {
                const formsValidate = new FormsValidator(fieldRules);
                return new Promise(resolve => {
                    formsValidate.assert(table, function (message) {
                        resolve({
                            table,
                            message,
                        });
                    });
                });
            }
            return new Promise(resolve => {
                resolve({
                    table,
                    message: [],
                });
            });
        })
        .then(({table, message}) => {
            const data = table.map(function (t) {
                const d = {};
                const tKeys = Object.keys(t);
                tKeys.forEach(tKey => {
                    const valFn = valMap[tKey];
                    d[tKey] = isFunction(valFn) ? valFn(t[tKey]) : t[tKey];
                });

                return d;
            });

            const length = table.length;
            message.length = length;

            let fail = 0;
            for (let i = 0; i < length; i++) {
                const msg = message[i];
                if (msg && msg.length > 0) {
                    fail++;
                }
            }

            return {
                table,
                data,
                message,
                total: length,
                fail,
            };
        });
}

module.exports = parse;
